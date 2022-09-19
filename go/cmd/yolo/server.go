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

type serverOpts struct {
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

func (s *serverOpts) configureFlagSet(fs *flag.FlagSet) {
	fs.BoolVar(&s.devMode, "dev-mode", false, "enable insecure helpers")
	fs.BoolVar(&s.withCache, "with-cache", false, "enable API caching")
	fs.StringVar(&s.buildkiteToken, "buildkite-token", "", "BuildKite API Token")
	fs.StringVar(&s.bintrayUsername, "bintray-username", "", "Bintray username")
	fs.StringVar(&s.bintrayToken, "bintray-token", "", "Bintray API Token")
	fs.StringVar(&s.circleciToken, "circleci-token", "", "CircleCI API Token")
	fs.StringVar(&s.githubToken, "github-token", "", "GitHub API Token")
	fs.StringVar(&s.githubRepos, "github-repos", "berty/berty", "GitHub repositories to watch")
	fs.StringVar(&s.artifactsCachePath, "artifacts-cache-path", "", "Artifacts caching path")
	fs.IntVar(&s.maxBuilds, "max-builds", 100, "maximum builds to fetch from external services (pagination)")
	fs.StringVar(&s.httpBind, "http-bind", ":8000", "HTTP bind address")
	fs.StringVar(&s.grpcBind, "grpc-bind", ":9000", "gRPC bind address")
	fs.StringVar(&s.corsAllowedOrigins, "cors-allowed-origins", "", "CORS allowed origins (*.domain.tld)")
	fs.DurationVar(&s.requestTimeout, "request-timeout", 5*time.Second, "request timeout")
	fs.DurationVar(&s.shutdownTimeout, "shutdown-timeout", 6*time.Second, "server shutdown timeout")
	fs.StringVar(&s.basicAuth, "basic-auth-password", "", "if set, enables basic authentication")
	fs.StringVar(&s.realm, "realm", "Yolo", "authentication realm")
	fs.StringVar(&s.authSalt, "auth-salt", "", "salt used to generate authentication tokens at the end of the URLs")
	fs.StringVar(&s.httpCachePath, "http-cache-path", "", "if set, will cache http client requests")
	fs.BoolVar(&s.once, "once", false, "just run workers once")
	fs.StringVar(&s.iosPrivkeyPath, "ios-privkey", "", "iOS signing: path to private key or p12 file (PEM or DER format)")
	fs.StringVar(&s.iosProvPath, "ios-prov", "", "iOS signing: path to mobile provisioning profile")
	fs.StringVar(&s.iosPrivkeyPass, "ios-pass", "", "iOS signing: password for private key or p12 file")
}

func serverCommand() *climan.Command {
	return &climan.Command{
		Name:      `server`,
		ShortHelp: `Start a Yolo Server`,
		FFOptions: []ff.Option{ff.WithEnvVarNoPrefix()},
		FlagSetBuilder: func(fs *flag.FlagSet) {
			glOpts.commonFlagsBuilder(fs)
			glOpts.server.configureFlagSet(fs)
		},
		Exec: func(ctx context.Context, _ []string) error {
			logger, err := loggerFromArgs(glOpts.verbose, glOpts.logFormat)
			if err != nil {
				return err
			}
			ctx, cancel := context.WithCancel(ctx)
			defer cancel()

			roundTripper, rtCloser := roundTripperFromArgs(ctx, glOpts.server.httpCachePath, logger)
			defer rtCloser()
			http.DefaultTransport = roundTripper

			db, err := dbFromArgs(glOpts.dbStorePath, logger)
			if err != nil {
				return err
			}
			defer db.Close()

			gr := run.Group{}
			gr.Add(run.SignalHandler(ctx, syscall.SIGKILL, syscall.SIGTERM))

			cc := abool.New() // clear cache signal

			// service conns
			var bkc *buildkite.Client
			if glOpts.server.buildkiteToken != "" {
				bkc, err = buildkiteClientFromArgs(glOpts.server.buildkiteToken)
				if err != nil {
					return err
				}
			}
			var ccc *circleci.Client
			if glOpts.server.circleciToken != "" {
				ccc, err = circleciClientFromArgs(glOpts.server.circleciToken)
				if err != nil {
					return err
				}
			}
			var btc *bintray.Client
			if glOpts.server.bintrayToken != "" && glOpts.server.bintrayUsername != "" {
				btc, err = bintrayClientFromArgs(glOpts.server.bintrayUsername, glOpts.server.bintrayToken, logger)
				if err != nil {
					return err
				}
			}
			ghc, err := githubClientFromArgs(glOpts.server.githubToken)
			if err != nil {
				return err
			}

			if glOpts.server.devMode {
				logger.Warn("--dev-mode: insecure helpers are enabled")
			}

			if glOpts.server.artifactsCachePath != "" {
				if err := os.MkdirAll(glOpts.server.artifactsCachePath, 0o755); err != nil {
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
				AuthSalt:           glOpts.server.authSalt,
				DevMode:            glOpts.server.devMode,
				ArtifactsCachePath: glOpts.server.artifactsCachePath,
				IOSPrivkeyPath:     glOpts.server.iosPrivkeyPath,
				IOSProvPath:        glOpts.server.iosProvPath,
				IOSPrivkeyPass:     glOpts.server.iosPrivkeyPass,
			})
			if err != nil {
				return err
			}

			// service workers
			if bkc != nil {
				opts := yolosvc.BuildkiteWorkerOpts{Logger: logger, MaxBuilds: glOpts.server.maxBuilds, ClearCache: cc, Once: glOpts.server.once}
				gr.Add(func() error { return svc.BuildkiteWorker(ctx, opts) }, func(_ error) { cancel() })
			}
			if ccc != nil {
				opts := yolosvc.CircleciWorkerOpts{Logger: logger, MaxBuilds: glOpts.server.maxBuilds, ClearCache: cc, Once: glOpts.server.once}
				gr.Add(func() error { return svc.CircleciWorker(ctx, opts) }, func(_ error) { cancel() })
			}
			if btc != nil {
				opts := yolosvc.BintrayWorkerOpts{Logger: logger, ClearCache: cc, Once: glOpts.server.once}
				gr.Add(func() error { return svc.BintrayWorker(ctx, opts) }, func(_ error) { cancel() })
			}
			if !glOpts.server.once { // disable pkgman when running with --once
				opts := yolosvc.PkgmanWorkerOpts{Logger: logger, ClearCache: cc, Once: glOpts.server.once}
				gr.Add(func() error { return svc.PkgmanWorker(ctx, opts) }, func(_ error) { cancel() })
			}
			if glOpts.server.githubToken != "" {
				opts := yolosvc.GithubWorkerOpts{Logger: logger, MaxBuilds: glOpts.server.maxBuilds, ClearCache: cc, Once: glOpts.server.once, ReposFilter: glOpts.server.githubRepos, Token: glOpts.server.githubToken}
				gr.Add(func() error { return svc.GitHubWorker(ctx, opts) }, func(_ error) { cancel() })
			}

			// server/API
			server, err := yolosvc.NewServer(ctx, svc, yolosvc.ServerOpts{
				Logger:             logger,
				GRPCBind:           glOpts.server.grpcBind,
				HTTPBind:           glOpts.server.httpBind,
				RequestTimeout:     glOpts.server.requestTimeout,
				ShutdownTimeout:    glOpts.server.shutdownTimeout,
				CORSAllowedOrigins: glOpts.server.corsAllowedOrigins,
				BasicAuth:          glOpts.server.basicAuth,
				Realm:              glOpts.server.realm,
				AuthSalt:           glOpts.server.authSalt,
				DevMode:            glOpts.server.devMode,
				WithCache:          glOpts.server.withCache,
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
