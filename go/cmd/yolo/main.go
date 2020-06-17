package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"syscall"
	"time"

	"berty.tech/yolo/v2/go/pkg/bintray"
	"berty.tech/yolo/v2/go/pkg/yolopb"
	"berty.tech/yolo/v2/go/pkg/yolosvc"
	bearer "github.com/bearer/go-agent"
	"github.com/buildkite/go-buildkite/buildkite"
	"github.com/google/go-github/v31/github"
	"github.com/gregjones/httpcache"
	"github.com/gregjones/httpcache/diskcache"
	_ "github.com/grpc-ecosystem/grpc-gateway/protoc-gen-swagger/options" // required by protoc
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	circleci "github.com/jszwedko/go-circleci"
	"github.com/oklog/run"
	"github.com/peterbourgon/diskv"
	ff "github.com/peterbourgon/ff/v2"
	"github.com/peterbourgon/ff/v2/ffcli"
	"github.com/tevino/abool"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"golang.org/x/oauth2"
	"moul.io/godev"
	"moul.io/hcfilters"
)

func main() {
	err := yolo(os.Args)
	if err != nil {
		log.Fatalf("err: %+v", err)
		os.Exit(1)
	}
}

func yolo(args []string) error {
	log.SetFlags(0)
	var (
		verbose            bool
		devMode            bool
		withCache          bool
		maxBuilds          int
		bearerSecretKey    string
		buildkiteToken     string
		githubToken        string
		bintrayUsername    string
		bintrayToken       string
		artifactsCachePath string
		circleciToken      string
		dbStorePath        string
		withPreloading     bool
		grpcBind           string
		httpBind           string
		corsAllowedOrigins string
		requestTimeout     time.Duration
		shutdownTimeout    time.Duration
		basicAuth          string
		authSalt           string
		httpCachePath      string
		realm              string
		// FIXME: once bool
	)
	var (
		rootFlagSet   = flag.NewFlagSet("yolo", flag.ExitOnError)
		serverFlagSet = flag.NewFlagSet("server", flag.ExitOnError)
		storeFlagSet  = flag.NewFlagSet("store", flag.ExitOnError)
	)
	rand.Seed(time.Now().UnixNano())
	rootFlagSet.SetOutput(os.Stderr)
	rootFlagSet.BoolVar(&verbose, "v", false, "increase log verbosity")
	serverFlagSet.BoolVar(&devMode, "dev-mode", false, "enable insecure helpers")
	serverFlagSet.BoolVar(&withCache, "with-cache", false, "enable API caching")
	serverFlagSet.StringVar(&buildkiteToken, "buildkite-token", "", "BuildKite API Token")
	serverFlagSet.StringVar(&bintrayUsername, "bintray-username", "", "Bintray username")
	serverFlagSet.StringVar(&bintrayToken, "bintray-token", "", "Bintray API Token")
	serverFlagSet.StringVar(&circleciToken, "circleci-token", "", "CircleCI API Token")
	serverFlagSet.StringVar(&githubToken, "github-token", "", "GitHub API Token")
	serverFlagSet.StringVar(&dbStorePath, "db-path", ":memory:", "DB Store path")
	serverFlagSet.StringVar(&artifactsCachePath, "artifacts-cache-path", "", "Artifacts caching path")
	serverFlagSet.IntVar(&maxBuilds, "max-builds", 100, "maximum builds to fetch from external services (pagination)")
	serverFlagSet.StringVar(&httpBind, "http-bind", ":8000", "HTTP bind address")
	serverFlagSet.StringVar(&grpcBind, "grpc-bind", ":9000", "gRPC bind address")
	serverFlagSet.StringVar(&corsAllowedOrigins, "cors-allowed-origins", "", "CORS allowed origins (*.domain.tld)")
	serverFlagSet.DurationVar(&requestTimeout, "request-timeout", 5*time.Second, "request timeout")
	serverFlagSet.DurationVar(&shutdownTimeout, "shutdown-timeout", 6*time.Second, "server shutdown timeout")
	serverFlagSet.StringVar(&basicAuth, "basic-auth-password", "", "if set, enables basic authentication")
	serverFlagSet.StringVar(&realm, "realm", "Yolo", "authentication Realm")
	serverFlagSet.StringVar(&bearerSecretKey, "bearer-secretkey", "", "optional Bearer.sh Secret Key")
	serverFlagSet.StringVar(&authSalt, "auth-salt", "", "salt used to generate authentication tokens at the end of the URLs")
	serverFlagSet.StringVar(&httpCachePath, "http-cache-path", "", "if set, will cache http client requests")
	storeFlagSet.StringVar(&dbStorePath, "db-path", ":memory:", "DB Store path")
	storeFlagSet.BoolVar(&withPreloading, "with-preloading", false, "with auto DB preloading")

	server := &ffcli.Command{
		Name:      `server`,
		ShortHelp: `Start a Yolo Server`,
		FlagSet:   serverFlagSet,
		Options:   []ff.Option{ff.WithEnvVarNoPrefix()},
		Exec: func(ctx context.Context, _ []string) error {
			logger, err := loggerFromArgs(verbose)
			if err != nil {
				return err
			}
			ctx, cancel := context.WithCancel(ctx)
			defer cancel()

			roundTripper, err := roundTripperFromArgs(ctx, bearerSecretKey, httpCachePath, logger)
			if err != nil {
				return err
			}
			http.DefaultTransport = roundTripper

			db, err := dbFromArgs(dbStorePath, logger)
			if err != nil {
				return err
			}
			defer db.Close()

			gr := run.Group{}
			gr.Add(run.SignalHandler(ctx, syscall.SIGKILL, syscall.SIGTERM))

			cc := abool.New() // clear cache signal

			// service conns
			var bkc *buildkite.Client
			if buildkiteToken != "" {
				bkc, err = buildkiteClientFromArgs(buildkiteToken)
				if err != nil {
					return err
				}
			}
			var ccc *circleci.Client
			if circleciToken != "" {
				ccc, err = circleciClientFromArgs(circleciToken)
				if err != nil {
					return err
				}
			}
			var btc *bintray.Client
			if bintrayToken != "" && bintrayUsername != "" {
				btc, err = bintrayClientFromArgs(bintrayUsername, bintrayToken, logger)
				if err != nil {
					return err
				}
			}
			ghc, err := githubClientFromArgs(githubToken)
			if err != nil {
				return err
			}

			if devMode {
				logger.Warn("--dev-mode: insecure helpers are enabled")
			}

			if artifactsCachePath != "" {
				if err := os.MkdirAll(artifactsCachePath, 0755); err != nil {
					return err
				}
			}

			// service
			svc, err := yolosvc.NewService(db, yolosvc.ServiceOpts{
				Logger:             logger,
				BuildkiteClient:    bkc,
				CircleciClient:     ccc,
				BintrayClient:      btc,
				GithubClient:       ghc,
				AuthSalt:           authSalt,
				DevMode:            devMode,
				ArtifactsCachePath: artifactsCachePath,
			})
			if err != nil {
				return err
			}

			// service workers
			if bkc != nil {
				opts := yolosvc.BuildkiteWorkerOpts{Logger: logger, MaxBuilds: maxBuilds, ClearCache: cc}
				gr.Add(func() error { return svc.BuildkiteWorker(ctx, opts) }, func(_ error) { cancel() })
			}
			if ccc != nil {
				opts := yolosvc.CircleciWorkerOpts{Logger: logger, MaxBuilds: maxBuilds, ClearCache: cc}
				gr.Add(func() error { return svc.CircleciWorker(ctx, opts) }, func(_ error) { cancel() })
			}
			if btc != nil {
				opts := yolosvc.BintrayWorkerOpts{Logger: logger, ClearCache: cc}
				gr.Add(func() error { return svc.BintrayWorker(ctx, opts) }, func(_ error) { cancel() })
			}
			{
				opts := yolosvc.PkgmanWorkerOpts{Logger: logger, ClearCache: cc}
				gr.Add(func() error { return svc.PkgmanWorker(ctx, opts) }, func(_ error) { cancel() })
			}
			if githubToken != "" {
				opts := yolosvc.GithubWorkerOpts{Logger: logger, MaxBuilds: maxBuilds, ClearCache: cc}
				gr.Add(func() error { return svc.GitHubWorker(ctx, opts) }, func(_ error) { cancel() })
			}

			// server/API
			server, err := yolosvc.NewServer(ctx, svc, yolosvc.ServerOpts{
				Logger:             logger,
				GRPCBind:           grpcBind,
				HTTPBind:           httpBind,
				RequestTimeout:     requestTimeout,
				ShutdownTimeout:    shutdownTimeout,
				CORSAllowedOrigins: corsAllowedOrigins,
				BasicAuth:          basicAuth,
				Realm:              realm,
				AuthSalt:           authSalt,
				DevMode:            devMode,
				WithCache:          withCache,
				ClearCache:         cc,
			})
			if err != nil {
				return err
			}
			gr.Add(func() error { return server.Start() }, func(_ error) { server.Stop() })

			return gr.Run()
		},
	}

	dumpObjects := &ffcli.Command{
		Name:    `dump-objects`,
		FlagSet: storeFlagSet,
		Options: []ff.Option{ff.WithEnvVarNoPrefix()},
		Exec: func(_ context.Context, _ []string) error {
			logger, err := loggerFromArgs(verbose)
			if err != nil {
				return err
			}
			db, err := dbFromArgs(dbStorePath, logger)
			if err != nil {
				return err
			}
			defer db.Close()

			svc, err := yolosvc.NewService(db, yolosvc.ServiceOpts{
				Logger:  logger,
				DevMode: true,
			})
			if err != nil {
				return err
			}

			ctx := context.Background()
			input := &yolopb.DevDumpObjects_Request{
				WithPreloading: withPreloading,
			}
			ret, err := svc.DevDumpObjects(ctx, input)
			if err != nil {
				return err
			}
			fmt.Println(godev.PrettyJSONPB(ret))

			return nil
		},
	}

	info := &ffcli.Command{
		Name:    `info`,
		FlagSet: storeFlagSet,
		Options: []ff.Option{ff.WithEnvVarNoPrefix()},
		Exec: func(_ context.Context, _ []string) error {
			logger, err := loggerFromArgs(verbose)
			if err != nil {
				return err
			}
			db, err := dbFromArgs(dbStorePath, logger)
			if err != nil {
				return err
			}
			defer db.Close()

			svc, err := yolosvc.NewService(db, yolosvc.ServiceOpts{
				Logger:  logger,
				DevMode: true,
			})
			if err != nil {
				return err
			}

			ctx := context.Background()
			ret, err := svc.Status(ctx, nil)
			if err != nil {
				return err
			}
			fmt.Println(godev.PrettyJSONPB(ret))

			return nil
		},
	}

	root := &ffcli.Command{
		ShortUsage:  `server [flags] <subcommand>`,
		FlagSet:     rootFlagSet,
		Subcommands: []*ffcli.Command{server, dumpObjects, info},
		Options:     []ff.Option{ff.WithEnvVarNoPrefix()},
		Exec: func(_ context.Context, _ []string) error {
			return flag.ErrHelp
		},
	}

	return root.ParseAndRun(context.Background(), os.Args[1:])
}

func bintrayClientFromArgs(username, token string, logger *zap.Logger) (*bintray.Client, error) {
	btc := bintray.New(username, token, logger)
	return btc, nil
}

func circleciClientFromArgs(token string) (*circleci.Client, error) {
	httpclient := &http.Client{
		Timeout: time.Second * 1800,
	}
	ccc := &circleci.Client{Token: token, HTTPClient: httpclient}
	return ccc, nil
}

func githubClientFromArgs(token string) (*github.Client, error) {
	if token != "" {
		ctx := context.Background()
		ts := oauth2.StaticTokenSource(
			&oauth2.Token{AccessToken: token},
		)
		tc := oauth2.NewClient(ctx, ts)
		return github.NewClient(tc), nil
	}

	return github.NewClient(nil), nil
}

func buildkiteClientFromArgs(token string) (*buildkite.Client, error) {
	config, err := buildkite.NewTokenConfig(token, false)
	if err != nil {
		return nil, err
	}
	bkc := buildkite.NewClient(config.Client())
	return bkc, nil
}

func loggerFromArgs(verbose bool) (*zap.Logger, error) {
	config := zap.NewDevelopmentConfig()
	if verbose {
		config.Level.SetLevel(zap.DebugLevel)
	} else {
		config.Level.SetLevel(zap.InfoLevel)
	}
	config.DisableStacktrace = true
	config.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	return config.Build()
}

func dbFromArgs(dbPath string, logger *zap.Logger) (*gorm.DB, error) {
	db, err := gorm.Open("sqlite3", dbPath)
	if err != nil {
		return nil, err
	}
	return db, nil
}

func roundTripperFromArgs(ctx context.Context, bearerSecretKey, httpCachePath string, logger *zap.Logger) (http.RoundTripper, error) {
	roundTripper := http.DefaultTransport

	if bearerSecretKey != "" {
		zap.RedirectStdLog(logger.Named("bearer"))
		agent, err := bearer.NewAgent(bearerSecretKey, log.Writer())
		if err != nil {
			return nil, err
		}
		roundTripper = agent.Decorate(roundTripper)
		// FIXME: return closer to call it at defer from main
	}

	if httpCachePath != "" {
		d := diskv.New(diskv.Options{
			BasePath:     httpCachePath,
			CacheSizeMax: 100 * 1024 * 1024, // 100MB
		})
		var cache httpcache.Cache
		cache = diskcache.NewWithDiskv(d)
		cache = hcfilters.MaxSize(cache, 2*1024*1024) // 2MB max per cache file
		roundTripper = &httpcache.Transport{
			Cache:               cache,
			MarkCachedResponses: true,
			Transport:           roundTripper,
		}
	}

	return roundTripper, nil
}
