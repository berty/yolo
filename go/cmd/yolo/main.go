package main

import (
	"context"
	"flag"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"time"

	"berty.tech/yolo/v2/go/pkg/bintray"
	"go.uber.org/zap"
	"golang.org/x/oauth2"
	"moul.io/hcfilters"
	"moul.io/zapconfig"

	"github.com/buildkite/go-buildkite/buildkite"
	"github.com/google/go-github/v32/github"
	"github.com/gregjones/httpcache"
	"github.com/gregjones/httpcache/diskcache"
	_ "github.com/grpc-ecosystem/grpc-gateway/protoc-gen-swagger/options" // required by protoc
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	circleci "github.com/jszwedko/go-circleci"
	"github.com/peterbourgon/diskv"
	ff "github.com/peterbourgon/ff/v2"
	"github.com/peterbourgon/ff/v2/ffcli"
)

var (
	verbose        bool
	logFormat      string
	dbStorePath    string
	withPreloading bool
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
	rootFlagSet := flag.NewFlagSet("yolo", flag.ExitOnError)
	rand.Seed(time.Now().UnixNano())
	rootFlagSet.SetOutput(os.Stderr)
	rootFlagSet.BoolVar(&verbose, "v", false, "increase log verbosity")
	rootFlagSet.StringVar(&logFormat, "log-format", "console", strings.Join(zapconfig.AvailablePresets, ", "))

	root := &ffcli.Command{
		ShortUsage: `server [flags] <subcommand>`,
		FlagSet:    rootFlagSet,
		Subcommands: []*ffcli.Command{
			serverCommand(),
			dumpObjectsCommand(),
			infoCommand(),
			treeCommand(),
		},
		Options: []ff.Option{ff.WithEnvVarNoPrefix()},
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

func loggerFromArgs(verbose bool, logFormat string) (*zap.Logger, error) {
	config := zapconfig.Configurator{}
	if verbose {
		config.SetLevel(zap.DebugLevel)
	} else {
		config.SetLevel(zap.InfoLevel)
	}
	if logFormat != "" {
		config.SetPreset(logFormat)
	}
	return config.Build()
}

func dbFromArgs(dbPath string, logger *zap.Logger) (*gorm.DB, error) {
	db, err := gorm.Open("sqlite3", dbPath)
	if err != nil {
		return nil, err
	}
	return db, nil
}

func roundTripperFromArgs(ctx context.Context, httpCachePath string, logger *zap.Logger) (http.RoundTripper, func()) {
	roundTripper := http.DefaultTransport
	closer := func() {}

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

	return roundTripper, closer
}
