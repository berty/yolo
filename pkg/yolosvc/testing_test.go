package yolosvc

import (
	"bytes"
	"context"
	"fmt"
	"io/ioutil"
	"testing"

	"berty.tech/yolo/v2/pkg/testutil"
	"github.com/cayleygraph/cayley/graph"
	"github.com/cayleygraph/cayley/schema"
	"github.com/cayleygraph/quad"
	"github.com/stretchr/testify/assert"
)

var schemaConfig *schema.Config

func init() {
	schemaConfig = SchemaConfig()
}

func TestTestingGoldenStore(t *testing.T) {
	store, close := TestingGoldenStore(t, "berty-all")
	assert.NotNil(t, store)
	defer close()

	ctx := context.Background()
	it := store.QuadsAllIterator().Iterate()
	count := 0
	for it.Next(ctx) {
		count++
	}

	// FIXME: check if it contains some specific data
	assert.Greater(t, count, 0)
}

func TestPullAndSave(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping slow test (--short)")
	}
	store, close := TestingStore(t)
	defer close()

	var (
		svc    = TestingAuthenticatedService(t, store, schemaConfig)
		ctx    = context.Background()
		logger = testutil.Logger(t)
		err    error
	)

	err = BintrayWorker(ctx, svc.db, svc.btc, svc.schema, BintrayWorkerOpts{Logger: logger, Once: true})
	assert.NoError(t, err)
	err = GithubWorker(ctx, svc.db, svc.ghc, svc.schema, GithubWorkerOpts{Logger: logger, Once: true})
	assert.NoError(t, err)
	err = BuildkiteWorker(ctx, svc.db, svc.bkc, svc.schema, BuildkiteWorkerOpts{Logger: logger, Once: true})
	assert.NoError(t, err)
	err = CircleciWorker(ctx, svc.db, svc.ccc, svc.schema, CircleciWorkerOpts{Logger: logger, Once: true})
	assert.NoError(t, err)

	var b bytes.Buffer
	qr := graph.NewQuadStoreReader(store.QuadStore)
	assert.NotNil(t, qr)
	defer qr.Close()

	format := quad.FormatByName("pquads")
	assert.NotNil(t, format)

	qw := format.Writer(&b)
	assert.NotNil(t, qw)
	defer qw.Close()

	n, err := quad.Copy(qw, qr)
	assert.Greater(t, n, 0)
	assert.NoError(t, err)

	gp := TestingGoldenDumpPath(t, "berty-all")
	if testutil.UpdateGolden() {
		t.Logf("update golden file: %s", gp)
		err := ioutil.WriteFile(gp, b.Bytes(), 0644)
		assert.NoError(t, err)
	}

	g, err := ioutil.ReadFile(gp)
	assert.NoError(t, err)
	assert.Equal(t, string(g), b.String())

	fmt.Println(svc)
}
