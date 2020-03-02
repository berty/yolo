package yolosvc

import (
	"context"
	"fmt"
	"time"

	"berty.tech/yolo/v2/pkg/yolopb"
	"github.com/cayleygraph/cayley"
	"github.com/cayleygraph/cayley/graph"
	cayleypath "github.com/cayleygraph/cayley/query/path"
	"github.com/cayleygraph/cayley/schema"
	"github.com/cayleygraph/quad"
)

func SchemaConfig() *schema.Config {
	// FIXME: temporarily forced to register it only once
	config := schema.NewConfig()
	schema.RegisterType("yolo:Build", yolopb.Build{})
	schema.RegisterType("yolo:Artifact", yolopb.Artifact{})
	return config
}

func saveBatches(ctx context.Context, db *cayley.Handle, batches []yolopb.Batch, schema *schema.Config) error {
	tx := cayley.NewTransaction()
	dw := graph.NewTxWriter(tx, graph.Delete)
	iw := graph.NewTxWriter(tx, graph.Add)

	// FIXME: check if different instead of always deleting and inserting again

	for _, batch := range batches {
		for _, build := range batch.Builds {
			var working yolopb.Build
			if err := schema.LoadTo(ctx, db, &working, build.ID); err == nil {
				_, _ = schema.WriteAsQuads(dw, working)
			}

			working = *build
			if _, err := schema.WriteAsQuads(iw, working); err != nil {
				return fmt.Errorf("write as quads: %w", err)
			}
		}
		for _, artifact := range batch.Artifacts {
			var working yolopb.Artifact
			if err := schema.LoadTo(ctx, db, &working, artifact.ID); err == nil {
				_, _ = schema.WriteAsQuads(dw, working)
			}

			working = *artifact
			if _, err := schema.WriteAsQuads(iw, working); err != nil {
				return fmt.Errorf("write as quads: %w", err)
			}
		}
	}

	if err := db.ApplyTransaction(tx); err != nil {
		return fmt.Errorf("apply tx: %w", err)
	}

	return nil
}

func lastBuildCreatedTime(ctx context.Context, db *cayley.Handle, driver yolopb.Driver) (time.Time, error) {
	// FIXME: find a better approach
	chain := cayleypath.StartPath(db).
		Both().
		Has(quad.IRI("rdf:type"), quad.IRI("yolo:Build"))
	if driver != yolopb.Driver_UnknownDriver {
		chain = chain.Has(quad.IRI("schema:driver"), quad.Int(driver))
	}
	chain = chain.Out(quad.IRI("schema:finishedAt"))

	values, err := chain.Iterate(ctx).Paths(false).AllValues(db)
	if err != nil {
		return time.Time{}, fmt.Errorf("chain.Iterate: %w", err)
	}

	since := time.Time{}
	for _, value := range values {
		typed := quad.NativeOf(value).(time.Time)
		if since.Before(typed) {
			since = typed
		}
	}

	if !since.IsZero() {
		since = since.Add(time.Second) // in order to skip the last one
	}
	return since, nil
}
