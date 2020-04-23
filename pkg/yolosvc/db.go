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
	schema.RegisterType("yolo:Commit", yolopb.Commit{})
	schema.RegisterType("yolo:Release", yolopb.Release{})
	schema.RegisterType("yolo:MergeRequest", yolopb.MergeRequest{})
	schema.RegisterType("yolo:Project", yolopb.Project{})
	schema.RegisterType("yolo:Entity", yolopb.Entity{})
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
		for _, entity := range batch.Entities {
			var working yolopb.Entity
			if err := schema.LoadTo(ctx, db, &working, entity.ID); err == nil {
				_, _ = schema.WriteAsQuads(dw, working)
			}

			working = *entity
			if _, err := schema.WriteAsQuads(iw, working); err != nil {
				return fmt.Errorf("write as quads: %w", err)
			}
		}
		for _, project := range batch.Projects {
			var working yolopb.Project
			if err := schema.LoadTo(ctx, db, &working, project.ID); err == nil {
				_, _ = schema.WriteAsQuads(dw, working)
			}

			working = *project
			if _, err := schema.WriteAsQuads(iw, working); err != nil {
				return fmt.Errorf("write as quads: %w", err)
			}
		}
		for _, release := range batch.Releases {
			var working yolopb.Release
			if err := schema.LoadTo(ctx, db, &working, release.ID); err == nil {
				_, _ = schema.WriteAsQuads(dw, working)
			}

			working = *release
			if _, err := schema.WriteAsQuads(iw, working); err != nil {
				return fmt.Errorf("write as quads: %w", err)
			}
		}
		for _, commit := range batch.Commits {
			var working yolopb.Commit
			if err := schema.LoadTo(ctx, db, &working, commit.ID); err == nil {
				_, _ = schema.WriteAsQuads(dw, working)
			}

			working = *commit
			if _, err := schema.WriteAsQuads(iw, working); err != nil {
				return fmt.Errorf("write as quads: %w", err)
			}
		}
		for _, mergeRequest := range batch.MergeRequests {
			var working yolopb.MergeRequest
			if err := schema.LoadTo(ctx, db, &working, mergeRequest.ID); err == nil {
				_, _ = schema.WriteAsQuads(dw, working)
			}

			working = *mergeRequest
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
