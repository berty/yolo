package yolo

import (
	"context"
	fmt "fmt"

	"github.com/cayleygraph/cayley"
	"github.com/cayleygraph/cayley/graph"
	"github.com/cayleygraph/cayley/schema"
)

func SchemaConfig() *schema.Config {
	// FIXME: temporarily forced to register it only once
	config := schema.NewConfig()
	schema.RegisterType("yolo:Build", Build{})
	schema.RegisterType("yolo:Artifact", Artifact{})
	return config
}

func saveBatches(ctx context.Context, db *cayley.Handle, batches []Batch, schema *schema.Config) error {
	tx := cayley.NewTransaction()
	dw := graph.NewTxWriter(tx, graph.Delete)
	iw := graph.NewTxWriter(tx, graph.Add)

	// FIXME: check if different instead of always deleting and inserting again

	for _, batch := range batches {
		for _, build := range batch.Builds {
			var working Build
			if err := schema.LoadTo(ctx, db, &working, build.ID); err == nil {
				_, _ = schema.WriteAsQuads(dw, working)
			}

			working = *build
			if _, err := schema.WriteAsQuads(iw, working); err != nil {
				return fmt.Errorf("write as quads: %w", err)
			}
		}
		for _, artifact := range batch.Artifacts {
			var working Artifact
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
