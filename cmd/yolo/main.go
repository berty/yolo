package main // import "berty.tech/yolo/cmd/yolo"

import (
	"context"
	"flag"
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
	_ "github.com/cayleygraph/cayley/graph/kv/bolt"                       // required by cayley
	_ "github.com/grpc-ecosystem/grpc-gateway/protoc-gen-swagger/options" // required by protoc
	circleci "github.com/jszwedko/go-circleci"
	"github.com/oklog/run"
	ff "github.com/peterbourgon/ff/v2"
	"github.com/peterbourgon/ff/v2/ffcli"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

func main() {
	log.SetFlags(0)
	var (
		verbose            bool
		maxBuilds          int
		bearerSecretKey    string
		buildkiteToken     string
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
		realm              string
	)
	var (
		rootFlagSet   = flag.NewFlagSet("yolo", flag.ExitOnError)
		serverFlagSet = flag.NewFlagSet("server", flag.ExitOnError)
	)
	rand.Seed(time.Now().UnixNano())
	rootFlagSet.SetOutput(os.Stderr)
	rootFlagSet.BoolVar(&verbose, "v", false, "increase log verbosity")
	serverFlagSet.StringVar(&buildkiteToken, "buildkite-token", "", "BuildKite API Token")
	serverFlagSet.StringVar(&bintrayUsername, "bintray-username", "", "Bintray username")
	serverFlagSet.StringVar(&bintrayToken, "bintray-token", "", "Bintray API Token")
	serverFlagSet.StringVar(&circleciToken, "circleci-token", "", "CircleCI API Token")
	serverFlagSet.StringVar(&dbStorePath, "db-path", ":temp:", "DB Store path")
	serverFlagSet.IntVar(&maxBuilds, "max-builds", 100, "maximum builds to fetch from external services (pagination)")
	serverFlagSet.StringVar(&httpBind, "http-bind", ":8000", "HTTP bind address")
	serverFlagSet.StringVar(&grpcBind, "grpc-bind", ":9000", "gRPC bind address")
	serverFlagSet.StringVar(&corsAllowedOrigins, "cors-allowed-origins", "", "CORS allowed origins (*.domain.tld)")
	serverFlagSet.DurationVar(&requestTimeout, "request-timeout", 5*time.Second, "request timeout")
	serverFlagSet.DurationVar(&shutdownTimeout, "shutdown-timeout", 6*time.Second, "server shutdown timeout")
	serverFlagSet.StringVar(&basicAuth, "basic-auth-password", "", "if set, enables basic authentication")
	serverFlagSet.StringVar(&realm, "realm", "Yolo", "authentication Realm")
	serverFlagSet.StringVar(&bearerSecretKey, "bearer-secretkey", "", "optional Bearer.sh Secret Key")

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

			// service workers
			var bkc *buildkite.Client
			if buildkiteToken != "" {
				bkc, err = buildkiteClientFromArgs(buildkiteToken)
				if err != nil {
					return err
				}
				opts := yolosvc.BuildkiteWorkerOpts{Logger: logger, MaxBuilds: maxBuilds}
				gr.Add(func() error { return yolosvc.BuildkiteWorker(ctx, db, bkc, dbSchema, opts) }, func(_ error) { cancel() })
			}
			var ccc *circleci.Client
			if circleciToken != "" {
				ccc, err = circleciClientFromArgs(circleciToken)
				if err != nil {
					return err
				}
				opts := yolosvc.CircleciWorkerOpts{Logger: logger, MaxBuilds: maxBuilds}
				gr.Add(func() error { return yolosvc.CircleciWorker(ctx, db, ccc, dbSchema, opts) }, func(_ error) { cancel() })
			}
			var btc *bintray.Client
			if bintrayToken != "" {
				btc, err = bintrayClientFromArgs(bintrayUsername, bintrayToken)
				if err != nil {
					return err
				}
				opts := yolosvc.BintrayWorkerOpts{Logger: logger, MaxBuilds: maxBuilds}
				gr.Add(func() error { return yolosvc.BintrayWorker(ctx, db, btc, dbSchema, opts) }, func(_ error) { cancel() })
			}

			// server
			svc := yolosvc.NewService(db, dbSchema, yolosvc.ServiceOpts{
				Logger:          logger,
				BuildkiteClient: bkc,
				CircleciClient:  ccc,
				BintrayClient:   btc,
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
			})
			if err != nil {
				return err
			}
			gr.Add(func() error { return server.Start() }, func(_ error) { server.Stop() })

			return gr.Run()
		},
	}

	root := &ffcli.Command{
		ShortUsage:  `server [flags] <subcommand>`,
		FlagSet:     rootFlagSet,
		Subcommands: []*ffcli.Command{server},
		Options:     []ff.Option{ff.WithEnvVarNoPrefix()},
		Exec: func(_ context.Context, _ []string) error {
			return flag.ErrHelp
		},
	}

	if err := root.ParseAndRun(context.Background(), os.Args[1:]); err != nil {
		log.Fatalf("err: %+v", err)
	}
}

func bintrayClientFromArgs(username, token string) (*bintray.Client, error) {
	btc := bintray.New(username, token)
	return btc, nil
}

func circleciClientFromArgs(token string) (*circleci.Client, error) {
	httpclient := &http.Client{
		Timeout: time.Second * 1800,
	}
	ci := &circleci.Client{Token: token, HTTPClient: httpclient}
	return ci, nil
}

func buildkiteClientFromArgs(token string) (*buildkite.Client, error) {
	if token == "" {
		token = os.Getenv("BUILDKITE_TOKEN")
	}
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
