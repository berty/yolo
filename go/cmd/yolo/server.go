package main

import (
	"context"
	"flag"
	"net/http"
	"os"
	"syscall"
	"time"

	"berty.tech/yolo/v2/go/pkg/bintray"
	"berty.tech/yolo/v2/go/pkg/yolosvc"

	"github.com/buildkite/go-buildkite/buildkite"
	"github.com/jszwedko/go-circleci"
	"github.com/oklog/run"
	"github.com/peterbourgon/ff/v3"
	"github.com/peterbourgon/ff/v3/ffcli"
	"github.com/tevino/abool"
)

func serverCommand() *ffcli.Command {
	fs := flag.NewFlagSet("server", flag.ExitOnError)

	var (
		devMode            bool
		withCache          bool
		maxBuilds          int
		buildkiteToken     string
		githubToken        string
		githubRepos        string
		bintrayUsername    string
		bintrayToken       string
		artifactsCachePath string
		circleciToken      string
		grpcBind           string
		httpBind           string
		corsAllowedOrigins string
		requestTimeout     time.Duration
		shutdownTimeout    time.Duration
		basicAuth          string
		authSalt           string
		httpCachePath      string
		realm              string
		once               bool
		iosPrivkeyPath     string
		iosProvPath        string
		iosPrivkeyPass     string
	)

	fs.BoolVar(&devMode, "dev-mode", false, "enable insecure helpers")
	fs.BoolVar(&withCache, "with-cache", false, "enable API caching")
	fs.StringVar(&buildkiteToken, "buildkite-token", "", "BuildKite API Token")
	fs.StringVar(&bintrayUsername, "bintray-username", "", "Bintray username")
	fs.StringVar(&bintrayToken, "bintray-token", "", "Bintray API Token")
	fs.StringVar(&circleciToken, "circleci-token", "", "CircleCI API Token")
	fs.StringVar(&githubToken, "github-token", "", "GitHub API Token")
	fs.StringVar(&githubRepos, "github-repos", "berty/berty", "GitHub repositories to watch")
	fs.StringVar(&dbStorePath, "db-path", ":memory:", "DB Store path")
	fs.StringVar(&artifactsCachePath, "artifacts-cache-path", "", "Artifacts caching path")
	fs.IntVar(&maxBuilds, "max-builds", 100, "maximum builds to fetch from external services (pagination)")
	fs.StringVar(&httpBind, "http-bind", ":8000", "HTTP bind address")
	fs.StringVar(&grpcBind, "grpc-bind", ":9000", "gRPC bind address")
	fs.StringVar(&corsAllowedOrigins, "cors-allowed-origins", "", "CORS allowed origins (*.domain.tld)")
	fs.DurationVar(&requestTimeout, "request-timeout", 5*time.Second, "request timeout")
	fs.DurationVar(&shutdownTimeout, "shutdown-timeout", 6*time.Second, "server shutdown timeout")
	fs.StringVar(&basicAuth, "basic-auth-password", "", "if set, enables basic authentication")
	fs.StringVar(&realm, "realm", "Yolo", "authentication Realm")
	fs.StringVar(&authSalt, "auth-salt", "", "salt used to generate authentication tokens at the end of the URLs")
	fs.StringVar(&httpCachePath, "http-cache-path", "", "if set, will cache http client requests")
	fs.BoolVar(&once, "once", false, "just run workers once")
	fs.StringVar(&iosPrivkeyPath, "ios-privkey", "", "iOS signing: path to private key or p12 file (PEM or DER format)")
	fs.StringVar(&iosProvPath, "ios-prov", "", "iOS signing: path to mobile provisioning profile")
	fs.StringVar(&iosPrivkeyPass, "ios-pass", "", "iOS signing: password for private key or p12 file")

	return &ffcli.Command{
		Name:      `server`,
		ShortHelp: `Start a Yolo Server`,
		FlagSet:   fs,
		Options:   []ff.Option{ff.WithEnvVarNoPrefix()},
		Exec: func(ctx context.Context, _ []string) error {
			logger, err := loggerFromArgs(verbose, logFormat)
			if err != nil {
				return err
			}
			ctx, cancel := context.WithCancel(ctx)
			defer cancel()

			roundTripper, rtCloser := roundTripperFromArgs(ctx, httpCachePath, logger)
			defer rtCloser()
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
				if err := os.MkdirAll(artifactsCachePath, 0o755); err != nil {
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
				IOSPrivkeyPath:     iosPrivkeyPath,
				IOSProvPath:        iosProvPath,
				IOSPrivkeyPass:     iosPrivkeyPass,
			})
			if err != nil {
				return err
			}

			// service workers
			if bkc != nil {
				opts := yolosvc.BuildkiteWorkerOpts{Logger: logger, MaxBuilds: maxBuilds, ClearCache: cc, Once: once}
				gr.Add(func() error { return svc.BuildkiteWorker(ctx, opts) }, func(_ error) { cancel() })
			}
			if ccc != nil {
				opts := yolosvc.CircleciWorkerOpts{Logger: logger, MaxBuilds: maxBuilds, ClearCache: cc, Once: once}
				gr.Add(func() error { return svc.CircleciWorker(ctx, opts) }, func(_ error) { cancel() })
			}
			if btc != nil {
				opts := yolosvc.BintrayWorkerOpts{Logger: logger, ClearCache: cc, Once: once}
				gr.Add(func() error { return svc.BintrayWorker(ctx, opts) }, func(_ error) { cancel() })
			}
			if !once { // disable pkgman when running with --once
				opts := yolosvc.PkgmanWorkerOpts{Logger: logger, ClearCache: cc, Once: once}
				gr.Add(func() error { return svc.PkgmanWorker(ctx, opts) }, func(_ error) { cancel() })
			}
			if githubToken != "" {
				opts := yolosvc.GithubWorkerOpts{Logger: logger, MaxBuilds: maxBuilds, ClearCache: cc, Once: once, ReposFilter: githubRepos, Token: githubToken}
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
}
