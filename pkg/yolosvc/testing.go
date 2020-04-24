package yolosvc

import (
	"context"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"berty.tech/yolo/v2/pkg/bintray"
	"berty.tech/yolo/v2/pkg/testutil"
	"github.com/buildkite/go-buildkite/buildkite"
	"github.com/cayleygraph/cayley"
	"github.com/cayleygraph/cayley/graph"
	_ "github.com/cayleygraph/cayley/graph/kv/bolt" // required by cayley
	"github.com/cayleygraph/cayley/schema"
	"github.com/cayleygraph/quad"
	_ "github.com/cayleygraph/quad/pquads" // required by cayley
	"github.com/google/go-github/v31/github"
	circleci "github.com/jszwedko/go-circleci"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/oauth2"
)

func TestingGoldenDumpPath(t *testing.T, name string) string {
	return filepath.Join("..", "yolosvc", "testdata", "golden."+name+".pq")
}

func TestingGoldenJSONPath(t *testing.T, name string) string {
	nameWithoutSlashes := strings.Replace(name, "/", "_", -1)
	return filepath.Join("..", "yolosvc", "testdata", "golden."+nameWithoutSlashes+".json")
}

func TestingGoldenStore(t *testing.T, name string) (*cayley.Handle, func()) {
	t.Helper()

	store, closeFunc := TestingStore(t)

	gp := TestingGoldenDumpPath(t, name)
	f, err := os.Open(gp)
	require.NoError(t, err, name)
	defer f.Close()

	qw, err := store.NewQuadWriter()
	require.NoError(t, err, name)
	require.NotNil(t, qw, name)
	defer qw.Close()

	format := quad.FormatByName("pquads")
	assert.NotNil(t, format, name)

	qr := format.Reader(f)
	require.NotNil(t, format, name)
	defer qr.Close()

	n, err := quad.CopyBatch(qw, qr, quad.DefaultBatch)
	require.NoError(t, err, name)
	require.Greater(t, n, 0, name)

	return store, closeFunc
}

func TestingStore(t *testing.T) (store *cayley.Handle, close func()) {
	t.Helper()

	dir, err := ioutil.TempDir("", "yolo")
	require.NoError(t, err)

	err = graph.InitQuadStore("bolt", dir, nil)
	require.NoError(t, err)

	store, err = cayley.NewGraph("bolt", dir, nil)
	require.NoError(t, err)

	closeFunc := func() {
		if store != nil {
			_ = store.Close()
		}
		_ = os.RemoveAll(dir)
	}

	return store, closeFunc
}

func TestingService(t *testing.T, store *cayley.Handle, schemaConfig *schema.Config) *service {
	return &service{
		startTime: time.Now(),
		db:        store,
		logger:    testutil.Logger(t),
		schema:    schemaConfig,
		authSalt:  "testing",
		devMode:   true,
	}
}

func TestingAuthenticatedService(t *testing.T, store *cayley.Handle, schemaConfig *schema.Config) *service {
	var (
		githubToken     = os.Getenv("GITHUB_TOKEN")
		circleToken     = os.Getenv("CIRCLE_TOKEN")
		bintrayUsername = os.Getenv("BINTRAY_USERNAME")
		bintrayToken    = os.Getenv("BINTRAY_TOKEN")
		buildkiteToken  = os.Getenv("BUILDKITE_TOKEN")
	)

	if githubToken == "" || circleToken == "" || bintrayUsername == "" || bintrayToken == "" || buildkiteToken == "" {
		t.Skip("missing tokens, cannot initialize testing service")
	}

	var (
		btc          = bintray.New(bintrayUsername, bintrayToken)
		ccc          = &circleci.Client{Token: circleToken, HTTPClient: &http.Client{Timeout: time.Second * 1800}}
		ghc          = github.NewClient(oauth2.NewClient(context.Background(), oauth2.StaticTokenSource(&oauth2.Token{AccessToken: githubToken})))
		bkcConfig, _ = buildkite.NewTokenConfig(buildkiteToken, false)
		bkc          = buildkite.NewClient(bkcConfig.Client())
	)

	return &service{
		startTime: time.Now(),
		db:        store,
		logger:    testutil.Logger(t),
		schema:    schemaConfig,
		ghc:       ghc,
		bkc:       bkc,
		btc:       btc,
		ccc:       ccc,
		authSalt:  "testing",
		devMode:   true,
	}
}
