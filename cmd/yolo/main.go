package main // import "berty.tech/yolo/cmd/yolo"

import (
	"context"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"math/rand"
	"net/http"
	"os"
	"path"
	"syscall"
	"time"

	"berty.tech/yolo/v2/pkg/bintray"
	"berty.tech/yolo/v2/pkg/yolosvc"
	bearer "github.com/Bearer/bearer-go"
	"github.com/buildkite/go-buildkite/buildkite"
	"github.com/cayleygraph/cayley"
	"github.com/cayleygraph/cayley/graph"
	_ "github.com/cayleygraph/cayley/graph/kv/bolt" // required by cayley
	"github.com/google/go-github/v31/github"
	_ "github.com/grpc-ecosystem/grpc-gateway/protoc-gen-swagger/options" // required by protoc
	circleci "github.com/jszwedko/go-circleci"
	"github.com/oklog/run"
	ff "github.com/peterbourgon/ff/v2"
	"github.com/peterbourgon/ff/v2/ffcli"
	"github.com/tevino/abool"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"golang.org/x/oauth2"
	"moul.io/godev"
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
		maxBuilds          int
		bearerSecretKey    string
		buildkiteToken     string
		githubToken        string
		bintrayUsername    string
		bintrayToken       string
		circleciToken      string
		dbStorePath        string
		grpcBind           string
		httpBind           string
		corsAllowedOrigins string
		requestTimeout     time.Duration
		shutdownTimeout    time.Duration
		basicAuth          string
		authSalt           string
		realm              string
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
	serverFlagSet.StringVar(&buildkiteToken, "buildkite-token", "", "BuildKite API Token")
	serverFlagSet.StringVar(&bintrayUsername, "bintray-username", "", "Bintray username")
	serverFlagSet.StringVar(&bintrayToken, "bintray-token", "", "Bintray API Token")
	serverFlagSet.StringVar(&circleciToken, "circleci-token", "", "CircleCI API Token")
	serverFlagSet.StringVar(&githubToken, "github-token", "", "GitHub API Token")
	serverFlagSet.StringVar(&dbStorePath, "db-path", ":temp:", "DB Store path")
	storeFlagSet.StringVar(&dbStorePath, "db-path", ":temp:", "DB Store path")
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
			if bearerSecretKey != "" {
				bearer.ReplaceGlobals(bearer.Init(bearerSecretKey))
			}
			db, dbCleanup, err := dbFromArgs(dbStorePath, logger)
			if err != nil {
				return err
			}
			defer dbCleanup()
			dbSchema := yolosvc.SchemaConfig()

			gr := run.Group{}
			gr.Add(run.SignalHandler(ctx, syscall.SIGKILL, syscall.SIGTERM))
			ctx, cancel := context.WithCancel(ctx)
			defer cancel()

			cc := abool.New() // clear cache signal

			// service workers
			var bkc *buildkite.Client
			if buildkiteToken != "" {
				bkc, err = buildkiteClientFromArgs(buildkiteToken)
				if err != nil {
					return err
				}
				opts := yolosvc.BuildkiteWorkerOpts{Logger: logger, MaxBuilds: maxBuilds, ClearCache: cc}
				gr.Add(func() error { return yolosvc.BuildkiteWorker(ctx, db, bkc, dbSchema, opts) }, func(_ error) { cancel() })
			}
			var ccc *circleci.Client
			if circleciToken != "" {
				ccc, err = circleciClientFromArgs(circleciToken)
				if err != nil {
					return err
				}
				opts := yolosvc.CircleciWorkerOpts{Logger: logger, MaxBuilds: maxBuilds, ClearCache: cc}
				gr.Add(func() error { return yolosvc.CircleciWorker(ctx, db, ccc, dbSchema, opts) }, func(_ error) { cancel() })
			}
			var btc *bintray.Client
			if bintrayToken != "" && bintrayUsername != "" {
				btc, err = bintrayClientFromArgs(bintrayUsername, bintrayToken)
				if err != nil {
					return err
				}
				opts := yolosvc.BintrayWorkerOpts{Logger: logger, ClearCache: cc}
				gr.Add(func() error { return yolosvc.BintrayWorker(ctx, db, btc, dbSchema, opts) }, func(_ error) { cancel() })
			}
			ghc, err := githubClientFromArgs(githubToken)
			if err != nil {
				return err
			}
			if githubToken != "" {
				opts := yolosvc.GithubWorkerOpts{Logger: logger, MaxBuilds: maxBuilds, ClearCache: cc}
				gr.Add(func() error { return yolosvc.GithubWorker(ctx, db, ghc, dbSchema, opts) }, func(_ error) { cancel() })
			}

			if devMode {
				logger.Warn("--dev-mode: insecure helpers are enabled")
			}

			// server
			svc := yolosvc.NewService(db, dbSchema, yolosvc.ServiceOpts{
				Logger:          logger,
				BuildkiteClient: bkc,
				CircleciClient:  ccc,
				BintrayClient:   btc,
				GithubClient:    ghc,
				AuthSalt:        authSalt,
				DevMode:         devMode,
			})
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
				ClearCache:         cc,
			})
			if err != nil {
				return err
			}
			gr.Add(func() error { return server.Start() }, func(_ error) { server.Stop() })

			return gr.Run()
		},
	}

	dumpQuads := &ffcli.Command{
		Name:    `dump-quads`,
		FlagSet: storeFlagSet,
		Options: []ff.Option{ff.WithEnvVarNoPrefix()},
		Exec: func(_ context.Context, _ []string) error {
			logger, err := loggerFromArgs(verbose)
			if err != nil {
				return err
			}
			db, dbCleanup, err := dbFromArgs(dbStorePath, logger)
			if err != nil {
				return err
			}
			defer dbCleanup()
			dbSchema := yolosvc.SchemaConfig()

			svc := yolosvc.NewService(db, dbSchema, yolosvc.ServiceOpts{
				Logger:  logger,
				DevMode: true,
			})
			ctx := context.Background()
			ret, err := svc.DevDumpQuads(ctx, nil)
			if err != nil {
				return err
			}
			for _, line := range ret.Quads {
				fmt.Println(line)
			}

			return nil
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
			db, dbCleanup, err := dbFromArgs(dbStorePath, logger)
			if err != nil {
				return err
			}
			defer dbCleanup()
			dbSchema := yolosvc.SchemaConfig()

			svc := yolosvc.NewService(db, dbSchema, yolosvc.ServiceOpts{
				Logger:  logger,
				DevMode: true,
			})
			ctx := context.Background()
			ret, err := svc.DevDumpObjects(ctx, nil)
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
			db, dbCleanup, err := dbFromArgs(dbStorePath, logger)
			if err != nil {
				return err
			}
			defer dbCleanup()
			dbSchema := yolosvc.SchemaConfig()

			svc := yolosvc.NewService(db, dbSchema, yolosvc.ServiceOpts{
				Logger:  logger,
				DevMode: true,
			})
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
		Subcommands: []*ffcli.Command{server, dumpQuads, dumpObjects, info},
		Options:     []ff.Option{ff.WithEnvVarNoPrefix()},
		Exec: func(_ context.Context, _ []string) error {
			return flag.ErrHelp
		},
	}

	return root.ParseAndRun(context.Background(), os.Args[1:])
}

func bintrayClientFromArgs(username, token string) (*bintray.Client, error) {
	btc := bintray.New(username, token)
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

func dbFromArgs(dbPath string, logger *zap.Logger) (*cayley.Handle, func(), error) {
	cleanup := func() {}
	if dbPath == ":temp:" {
		dir, err := ioutil.TempDir("", "yolo")
		if err != nil {
			return nil, nil, err
		}
		dbPath = dir
		logger.Debug("using temporary db", zap.String("path", dir))

	}
	if _, err := os.Stat(path.Join(dbPath, "indexes.bolt")); err != nil {
		if err := graph.InitQuadStore("bolt", dbPath, nil); err != nil {
			cleanup()
			return nil, nil, err
		}
	}
	db, err := cayley.NewGraph("bolt", dbPath, nil)
	if err != nil {
		cleanup()
		return nil, nil, err
	}
	return db, cleanup, nil
}
