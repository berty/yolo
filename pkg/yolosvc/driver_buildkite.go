package yolosvc

import (
	"context"
	"fmt"
	"math"
	"strings"
	"time"

	"berty.tech/yolo/v2/pkg/yolopb"
	"github.com/buildkite/go-buildkite/buildkite"
	"github.com/cayleygraph/cayley"
	"github.com/cayleygraph/cayley/schema"
	"github.com/cayleygraph/quad"
	"go.uber.org/zap"
)

type BuildkiteWorkerOpts struct {
	Logger    *zap.Logger
	MaxBuilds int
	LoopAfter time.Duration
	Once      bool
}

// BuildkiteWorker goals is to manage the buildkite update routine, it should try to support as much errors as possible by itself
func BuildkiteWorker(ctx context.Context, db *cayley.Handle, bkc *buildkite.Client, schema *schema.Config, opts BuildkiteWorkerOpts) error {
	opts.applyDefaults()

	var (
		logger   = opts.Logger
		maxPages = int(math.Ceil(float64(opts.MaxBuilds) / 30))
	)

	for {
		since, err := lastBuildCreatedTime(ctx, db, yolopb.Driver_Buildkite)
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

		if opts.Once {
			return nil
		}

		select {
		case <-ctx.Done():
			return nil
		case <-time.After(opts.LoopAfter):
		}
	}
}

func fetchBuildkite(bkc *buildkite.Client, since time.Time, maxPages int, logger *zap.Logger) ([]yolopb.Batch, error) {
	batches := []yolopb.Batch{}
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
			batches = append(batches, buildkiteBuildsToBatch(builds, logger))
		}
		if resp.NextPage == 0 {
			break
		}
		callOpts.Page = resp.NextPage
	}
	return batches, nil
}

func buildkiteBuildsToBatch(builds []buildkite.Build, logger *zap.Logger) yolopb.Batch {
	batch := yolopb.Batch{}
	for _, build := range builds {
		newBuild := yolopb.Build{
			ID:        quad.IRI(*build.WebURL),
			CreatedAt: &build.CreatedAt.Time,
			Message:   *build.Message,
			HasCommit: &yolopb.Commit{ID: quad.IRI(*build.Commit)},
			Branch:    *build.Branch,
			Driver:    yolopb.Driver_Buildkite,
			// FIXME: Creator: build.Creator...
		}

		switch provider := build.Pipeline.Provider.ID; provider {
		case "github":
			cloneURL := *build.Pipeline.Repository
			parts := strings.Split(cloneURL, ":")
			projectName := strings.TrimRight(parts[1], ".git")
			projectURL := "https://github.com/" + projectName
			newBuild.HasProject = &yolopb.Project{ID: quad.IRI(projectURL)}
			// FIXME: CommitURL

			if build.PullRequest != nil {
				prURL := projectURL + "/pull/" + *build.PullRequest.ID
				newBuild.HasMergerequest = &yolopb.MergeRequest{ID: quad.IRI(prURL)}
				// FIXME: CommitURL based on forked repo
			}
		default:
			logger.Warn("unknown pipeline provider", zap.String("provider", provider))
		}

		if build.FinishedAt != nil {
			newBuild.FinishedAt = &build.FinishedAt.Time
		}
		if build.StartedAt != nil {
			newBuild.StartedAt = &build.StartedAt.Time
		}
		switch *build.State {
		case "running":
			newBuild.State = yolopb.Build_Running
		case "failed":
			newBuild.State = yolopb.Build_Failed
		case "passed":
			newBuild.State = yolopb.Build_Passed
		case "not_run":
			newBuild.State = yolopb.Build_NotRun
		case "skipped":
			newBuild.State = yolopb.Build_Skipped
		case "canceled":
			newBuild.State = yolopb.Build_Canceled
		case "scheduled":
			newBuild.State = yolopb.Build_Scheduled
		default:
			fmt.Println("unknown state: ", *build.State)
		}
		batch.Builds = append(batch.Builds, &newBuild)
	}
	return batch
}

func buildkiteArtifactsToBatch(artifacts []buildkite.Artifact, build buildkite.Build) yolopb.Batch {
	batch := yolopb.Batch{}
	for _, artifact := range artifacts {
		id := "buildkite_" + md5Sum(*artifact.DownloadURL)
		newArtifact := yolopb.Artifact{
			ID:          quad.IRI(id),
			CreatedAt:   &build.CreatedAt.Time,
			FileSize:    *artifact.FileSize,
			LocalPath:   *artifact.Path,
			DownloadURL: *artifact.DownloadURL,
			HasBuild:    &yolopb.Build{ID: quad.IRI(*build.WebURL)},
			// FIXME: hasRelease
			Driver:   yolopb.Driver_Buildkite,
			Kind:     artifactKindByPath(*artifact.Path),
			MimeType: mimetypeByPath(*artifact.Path), // *artifact.MimeType,
			// FIXME: Sha1Sum:     *artifact.Sha1Sum,
		}
		switch *artifact.State {
		case "finished":
			newArtifact.State = yolopb.Artifact_Finished
		case "new":
			newArtifact.State = yolopb.Artifact_New
		case "error":
			newArtifact.State = yolopb.Artifact_Error
		case "deleted":
			newArtifact.State = yolopb.Artifact_Deleted
		default:
			newArtifact.State = yolopb.Artifact_UnknownState
			fmt.Println("unknown state: ", *artifact.State)
		}
		batch.Artifacts = append(batch.Artifacts, &newArtifact)
	}
	return batch
}

func (o *BuildkiteWorkerOpts) applyDefaults() {
	if o.Logger == nil {
		o.Logger = zap.NewNop()
	}
	if o.MaxBuilds == 0 {
		o.MaxBuilds = 100
	}
	if o.LoopAfter == 0 {
		o.LoopAfter = 10 * time.Second
	}
}
