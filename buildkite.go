package yolo

import (
	"context"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/buildkite/go-buildkite/buildkite"
	"github.com/cayleygraph/cayley"
	"github.com/cayleygraph/cayley/schema"
	"github.com/cayleygraph/quad"
	"go.uber.org/zap"
)

type BuildkiteWorkerOpts struct {
	Logger    *zap.Logger
	MaxBuilds int
}

// BuildkiteWorker goals is to manage the buildkite update routine, it should try to support as much errors as possible by itself
func BuildkiteWorker(ctx context.Context, db *cayley.Handle, bkc *buildkite.Client, schema *schema.Config, opts BuildkiteWorkerOpts) error {
	if opts.Logger == nil {
		opts.Logger = zap.NewNop()
	}
	if opts.MaxBuilds == 0 {
		opts.MaxBuilds = 100
	}
	logger := opts.Logger
	maxPages := int(math.Ceil(float64(opts.MaxBuilds) / 30))

	for {
		since, err := lastBuildCreatedTime(ctx, db, Driver_Buildkite)
		if err != nil {
			logger.Warn("get last buildkite build created time", zap.Error(err))
			since = time.Time{}
		}
		logger.Debug("buildkite: refresh", zap.Time("since", since))
		// FIXME: only fetch builds since most recent known
		batches, err := fetchBuildkite(bkc, since, maxPages, logger)
		if err != nil {
			logger.Warn("fetch buildkite", zap.Error(err))
		} else {
			if err := saveBatches(ctx, db, batches, schema); err != nil {
				logger.Warn("save batches", zap.Error(err))
			}
		}
		// FIXME: fetch artifacts for builds with job that are successful and have a not empty artifact path

		select {
		case <-ctx.Done():
			return nil
		case <-time.After(5 * time.Second):
		}
	}
	return nil
}

func fetchBuildkite(bkc *buildkite.Client, since time.Time, maxPages int, logger *zap.Logger) ([]Batch, error) {
	batches := []Batch{}
	total := 0
	callOpts := &buildkite.BuildsListOptions{
		FinishedFrom: since,
	}
	for i := 0; i < maxPages; i++ {
		before := time.Now()
		builds, resp, err := bkc.Builds.List(callOpts)
		if err != nil {
			return nil, fmt.Errorf("buildkite.Builds.List: %w", err)
		}
		total += len(builds)
		logger.Debug("buildkite.Builds.List", zap.Int("total", total), zap.Duration("duration", time.Since(before)))
		for _, build := range builds {
			hasArtifacts := false
			for _, job := range build.Jobs {
				if job.State != nil && job.ArtifactPaths != nil && *job.ArtifactPaths != "" && *job.State == "passed" {
					hasArtifacts = true
					break
				}
			}
			if hasArtifacts {
				parts := strings.Split(*build.WebURL, "/")
				artifacts, _, err := bkc.Artifacts.ListByBuild(
					parts[3], // org
					parts[4], // pipeline
					fmt.Sprintf("%d", *build.Number),
					&buildkite.ArtifactListOptions{},
				)
				if err != nil {
					return nil, fmt.Errorf("buildkite.Artifacts.ListByBuild: %w", err)
				}
				logger.Debug("buildkite.Artifacts.List", zap.Int("len", len(artifacts)))
				batches = append(batches, buildkiteArtifactsToBatch(artifacts, build))
			}
		}
		if len(builds) > 0 {
			batches = append(batches, buildkiteBuildsToBatch(builds))
		}
		if resp.NextPage == 0 {
			break
		}
		callOpts.Page = resp.NextPage
	}
	return batches, nil
}

func buildkiteBuildsToBatch(builds []buildkite.Build) Batch {
	batch := Batch{}
	for _, build := range builds {
		newBuild := Build{
			ID:        quad.IRI(*build.WebURL),
			CreatedAt: &build.CreatedAt.Time,
			Message:   *build.Message,
			Commit:    *build.Commit,
			Branch:    *build.Branch,
			Driver:    Driver_Buildkite,
			// FIXME: Creator: build.Creator...
		}
		if build.FinishedAt != nil {
			newBuild.FinishedAt = &build.FinishedAt.Time
		}
		if build.StartedAt != nil {
			newBuild.StartedAt = &build.StartedAt.Time
		}
		switch *build.State {
		case "running":
			newBuild.State = Build_Running
		case "failed":
			newBuild.State = Build_Failed
		case "passed":
			newBuild.State = Build_Passed
		case "not_run":
			newBuild.State = Build_NotRun
		case "skipped":
			newBuild.State = Build_Skipped
		case "canceled":
			newBuild.State = Build_Canceled
		case "scheduled":
			newBuild.State = Build_Scheduled
		default:
			fmt.Println("unknown state: ", *build.State)
		}
		batch.Builds = append(batch.Builds, &newBuild)
	}
	return batch
}

func buildkiteArtifactsToBatch(artifacts []buildkite.Artifact, build buildkite.Build) Batch {
	batch := Batch{}
	for _, artifact := range artifacts {
		id := "buildkite_" + md5Sum(*artifact.DownloadURL)
		newArtifact := Artifact{
			ID:          quad.IRI(id),
			CreatedAt:   &build.CreatedAt.Time,
			FileSize:    *artifact.FileSize,
			LocalPath:   *artifact.Path,
			DownloadURL: *artifact.DownloadURL,
			HasBuild:    &Build{ID: quad.IRI(*build.WebURL)},
			Driver:      Driver_Buildkite,
			Kind:        artifactKindByPath(*artifact.Path),
			MimeType:    mimetypeByPath(*artifact.Path), // *artifact.MimeType,
			// FIXME: Sha1Sum:     *artifact.Sha1Sum,
		}
		switch *artifact.State {
		case "finished":
			newArtifact.State = Artifact_Finished
		case "new":
			newArtifact.State = Artifact_New
		case "error":
			newArtifact.State = Artifact_Error
		case "deleted":
			newArtifact.State = Artifact_Deleted
		default:
			newArtifact.State = Artifact_UnknownState
			fmt.Println("unknown state: ", *artifact.State)
		}
		batch.Artifacts = append(batch.Artifacts, &newArtifact)
	}
	return batch
}
