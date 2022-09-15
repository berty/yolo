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
	"moul.io/climan"

	"github.com/buildkite/go-buildkite/buildkite"
	"github.com/jszwedko/go-circleci"
	"github.com/oklog/run"
	"github.com/peterbourgon/ff/v3"
	"github.com/tevino/abool"
)

type server struct {
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
}

func (s server) parse(fs *flag.FlagSet) {
	fs.BoolVar(&optsGlobal.server.devMode, "dev-mode", false, "enable insecure helpers")
	fs.BoolVar(&optsGlobal.server.withCache, "with-cache", false, "enable API caching")
	fs.StringVar(&optsGlobal.server.buildkiteToken, "buildkite-token", "", "BuildKite API Token")
	fs.StringVar(&optsGlobal.server.bintrayUsername, "bintray-username", "", "Bintray username")
	fs.StringVar(&optsGlobal.server.bintrayToken, "bintray-token", "", "Bintray API Token")
	fs.StringVar(&optsGlobal.server.circleciToken, "circleci-token", "", "CircleCI API Token")
	fs.StringVar(&optsGlobal.server.githubToken, "github-token", "", "GitHub API Token")
	fs.StringVar(&optsGlobal.server.githubRepos, "github-repos", "berty/berty", "GitHub repositories to watch")
	fs.StringVar(&optsGlobal.server.artifactsCachePath, "artifacts-cache-path", "", "Artifacts caching path")
	fs.IntVar(&optsGlobal.server.maxBuilds, "max-builds", 100, "maximum builds to fetch from external services (pagination)")
	fs.StringVar(&optsGlobal.server.httpBind, "http-bind", ":8000", "HTTP bind address")
	fs.StringVar(&optsGlobal.server.grpcBind, "grpc-bind", ":9000", "gRPC bind address")
	fs.StringVar(&optsGlobal.server.corsAllowedOrigins, "cors-allowed-origins", "", "CORS allowed origins (*.domain.tld)")
	fs.DurationVar(&optsGlobal.server.requestTimeout, "request-timeout", 5*time.Second, "request timeout")
	fs.DurationVar(&optsGlobal.server.shutdownTimeout, "shutdown-timeout", 6*time.Second, "server shutdown timeout")
	fs.StringVar(&optsGlobal.server.basicAuth, "basic-auth-password", "", "if set, enables basic authentication")
	fs.StringVar(&optsGlobal.server.realm, "realm", "Yolo", "authentication realm")
	fs.StringVar(&optsGlobal.server.authSalt, "auth-salt", "", "salt used to generate authentication tokens at the end of the URLs")
	fs.StringVar(&optsGlobal.server.httpCachePath, "http-cache-path", "", "if set, will cache http client requests")
	fs.BoolVar(&optsGlobal.server.once, "once", false, "just run workers once")
	fs.StringVar(&optsGlobal.server.iosPrivkeyPath, "ios-privkey", "", "iOS signing: path to private key or p12 file (PEM or DER format)")
	fs.StringVar(&optsGlobal.server.iosProvPath, "ios-prov", "", "iOS signing: path to mobile provisioning profile")
	fs.StringVar(&optsGlobal.server.iosPrivkeyPass, "ios-pass", "", "iOS signing: password for private key or p12 file")
}

func serverCommand(commonFlagsBuilder flagsBuilder) *climan.Command {
	return &climan.Command{
		Name:      `server`,
		ShortHelp: `Start a Yolo Server`,
		FFOptions: []ff.Option{ff.WithEnvVarNoPrefix()},
		FlagSetBuilder: func(fs *flag.FlagSet) {
			commonFlagsBuilder(fs)
			optsGlobal.server.parse(fs)
		},
		Exec: func(ctx context.Context, _ []string) error {
			logger, err := loggerFromArgs(optsGlobal.verbose, optsGlobal.logFormat)
			if err != nil {
				return err
			}
			ctx, cancel := context.WithCancel(ctx)
			defer cancel()

			roundTripper, rtCloser := roundTripperFromArgs(ctx, optsGlobal.server.httpCachePath, logger)
			defer rtCloser()
			http.DefaultTransport = roundTripper

			db, err := dbFromArgs(optsGlobal.dbStorePath, logger)
			if err != nil {
				return err
			}
			defer db.Close()

			gr := run.Group{}
			gr.Add(run.SignalHandler(ctx, syscall.SIGKILL, syscall.SIGTERM))

			cc := abool.New() // clear cache signal

			// service conns
			var bkc *buildkite.Client
			if optsGlobal.server.buildkiteToken != "" {
				bkc, err = buildkiteClientFromArgs(optsGlobal.server.buildkiteToken)
				if err != nil {
					return err
				}
			}
			var ccc *circleci.Client
			if optsGlobal.server.circleciToken != "" {
				ccc, err = circleciClientFromArgs(optsGlobal.server.circleciToken)
				if err != nil {
					return err
				}
			}
			var btc *bintray.Client
			if optsGlobal.server.bintrayToken != "" && optsGlobal.server.bintrayUsername != "" {
				btc, err = bintrayClientFromArgs(optsGlobal.server.bintrayUsername, optsGlobal.server.bintrayToken, logger)
				if err != nil {
					return err
				}
			}
			ghc, err := githubClientFromArgs(optsGlobal.server.githubToken)
			if err != nil {
				return err
			}

			if optsGlobal.server.devMode {
				logger.Warn("--dev-mode: insecure helpers are enabled")
			}

			if optsGlobal.server.artifactsCachePath != "" {
				if err := os.MkdirAll(optsGlobal.server.artifactsCachePath, 0o755); err != nil {
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
				AuthSalt:           optsGlobal.server.authSalt,
				DevMode:            optsGlobal.server.devMode,
				ArtifactsCachePath: optsGlobal.server.artifactsCachePath,
				IOSPrivkeyPath:     optsGlobal.server.iosPrivkeyPath,
				IOSProvPath:        optsGlobal.server.iosProvPath,
				IOSPrivkeyPass:     optsGlobal.server.iosPrivkeyPass,
			})
			if err != nil {
				return err
			}

			// service workers
			if bkc != nil {
				opts := yolosvc.BuildkiteWorkerOpts{Logger: logger, MaxBuilds: optsGlobal.server.maxBuilds, ClearCache: cc, Once: optsGlobal.server.once}
				gr.Add(func() error { return svc.BuildkiteWorker(ctx, opts) }, func(_ error) { cancel() })
			}
			if ccc != nil {
				opts := yolosvc.CircleciWorkerOpts{Logger: logger, MaxBuilds: optsGlobal.server.maxBuilds, ClearCache: cc, Once: optsGlobal.server.once}
				gr.Add(func() error { return svc.CircleciWorker(ctx, opts) }, func(_ error) { cancel() })
			}
			if btc != nil {
				opts := yolosvc.BintrayWorkerOpts{Logger: logger, ClearCache: cc, Once: optsGlobal.server.once}
				gr.Add(func() error { return svc.BintrayWorker(ctx, opts) }, func(_ error) { cancel() })
			}
			if !optsGlobal.server.once { // disable pkgman when running with --once
				opts := yolosvc.PkgmanWorkerOpts{Logger: logger, ClearCache: cc, Once: optsGlobal.server.once}
				gr.Add(func() error { return svc.PkgmanWorker(ctx, opts) }, func(_ error) { cancel() })
			}
			if optsGlobal.server.githubToken != "" {
				opts := yolosvc.GithubWorkerOpts{Logger: logger, MaxBuilds: optsGlobal.server.maxBuilds, ClearCache: cc, Once: optsGlobal.server.once, ReposFilter: optsGlobal.server.githubRepos, Token: optsGlobal.server.githubToken}
				gr.Add(func() error { return svc.GitHubWorker(ctx, opts) }, func(_ error) { cancel() })
			}

			// server/API
			server, err := yolosvc.NewServer(ctx, svc, yolosvc.ServerOpts{
				Logger:             logger,
				GRPCBind:           optsGlobal.server.grpcBind,
				HTTPBind:           optsGlobal.server.httpBind,
				RequestTimeout:     optsGlobal.server.requestTimeout,
				ShutdownTimeout:    optsGlobal.server.shutdownTimeout,
				CORSAllowedOrigins: optsGlobal.server.corsAllowedOrigins,
				BasicAuth:          optsGlobal.server.basicAuth,
				Realm:              optsGlobal.server.realm,
				AuthSalt:           optsGlobal.server.authSalt,
				DevMode:            optsGlobal.server.devMode,
				WithCache:          optsGlobal.server.withCache,
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
