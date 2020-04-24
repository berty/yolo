package yolosvc

import (
	"context"
	fmt "fmt"
	"time"

	"berty.tech/yolo/v2/pkg/yolopb"
	"github.com/cayleygraph/cayley"
	"github.com/cayleygraph/cayley/schema"
	"github.com/cayleygraph/quad"
	circleci "github.com/jszwedko/go-circleci"
	"go.uber.org/zap"
)

type CircleciWorkerOpts struct {
	Logger    *zap.Logger
	MaxBuilds int
	LoopAfter time.Duration
	Once      bool
}

const circleciMaxPerPage = 30

// CircleciWorker goals is to manage the circleci update routine, it should try to support as much errors as possible by itself
func CircleciWorker(ctx context.Context, db *cayley.Handle, ccc *circleci.Client, schema *schema.Config, opts CircleciWorkerOpts) error {
	opts.applyDefaults()

	logger := opts.Logger
	for {
		since, err := lastBuildCreatedTime(ctx, db, yolopb.Driver_CircleCI)
		if err != nil {
			logger.Warn("get last circleci build created time", zap.Error(err))
			since = time.Time{}
		}
		logger.Debug("circleci: refresh", zap.Time("since", since))
		// FIXME: only fetch builds since most recent known
		batches, err := fetchCircleci(ccc, since, opts.MaxBuilds, logger)
		if err != nil {
			logger.Warn("fetch circleci", zap.Error(err))
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

func fetchCircleci(ccc *circleci.Client, since time.Time, maxBuilds int, logger *zap.Logger) ([]yolopb.Batch, error) {
	batches := []yolopb.Batch{}
	if since.IsZero() { // initial fetch
		// FIXME: handle circleciMaxPerPage
		before := time.Now()
		builds, err := ccc.ListRecentBuilds(maxBuilds, 0)
		if err != nil {
			return nil, fmt.Errorf("list recent builds: %w", err)
		}
		logger.Debug("circleci.ListRecentBuilds", zap.Int("builds", len(builds)), zap.Duration("duration", time.Since(before)))
		batch, err := handleCircleciBuilds(ccc, builds, logger)
		if err != nil {
			return nil, fmt.Errorf("handle circle builds: %w", err)
		}
		batches = append(batches, batch)
	} else { // only recents
		perPage := maxBuilds
		if perPage > circleciMaxPerPage {
			perPage = circleciMaxPerPage
		}
		offset := 0

		for {
			before := time.Now()
			builds, err := ccc.ListRecentBuilds(perPage, offset)
			if err != nil {
				return nil, fmt.Errorf("list recent builds: %w", err)
			}
			newBuilds := make([]*circleci.Build, len(builds))
			i := 0
			for _, build := range builds {
				if build.AuthorDate != nil && build.AuthorDate.After(since) {
					newBuilds[i] = build
					i++
				}
			}
			logger.Debug("circleci.ListRecentBuilds", zap.Int("builds", len(builds)), zap.Int("new builds", i), zap.Duration("duration", time.Since(before)))
			if i > 0 {
				batch, err := handleCircleciBuilds(ccc, newBuilds, logger)
				if err != nil {
					return nil, fmt.Errorf("handle circle builds: %w", err)
				}
				batches = append(batches, batch)
			}
			if i == 0 || i < perPage {
				break
			}
			offset += perPage
		}
	}

	return batches, nil
}

func handleCircleciBuilds(ccc *circleci.Client, builds []*circleci.Build, logger *zap.Logger) (yolopb.Batch, error) {
	batch := yolopb.Batch{Builds: []*yolopb.Build{}}
	for _, build := range builds {
		if build == nil {
			continue
		}
		b := circleciBuildToBatch(build)
		batch.Builds = append(batch.Builds, &b)

		artifacts, err := ccc.ListBuildArtifacts(build.Username, build.Reponame, build.BuildNum)
		if err != nil {
			return batch, fmt.Errorf("list build artifacts: %w", err)
		}
		logger.Debug("circleci.ListBuildArtifacts", zap.Int("len", len(artifacts)))
		if len(artifacts) > 0 {
			artifactsBatch := circleciArtifactsToBatch(artifacts, build)
			batch.Artifacts = append(batch.Artifacts, artifactsBatch.Artifacts...)
		}
	}
	return batch, nil
}

func circleciBuildToBatch(build *circleci.Build) yolopb.Build {
	newBuild := yolopb.Build{
		ID:         quad.IRI(build.BuildURL),
		Driver:     yolopb.Driver_CircleCI,
		CreatedAt:  build.AuthorDate,
		FinishedAt: build.StopTime,
		StartedAt:  build.StartTime,
		Branch:     build.Branch,
		Message:    build.Body,
		HasCommit:  &yolopb.Commit{ID: quad.IRI(build.VcsRevision)},
		// FIXME: CommitURL
		// duration
	}
	// FIXME: Creator: build.Creator...
	switch build.Status {
	case "failed":
		newBuild.State = yolopb.Build_Failed
	case "success":
		newBuild.State = yolopb.Build_Passed
	// case "retried":
	case "canceled":
		newBuild.State = yolopb.Build_Canceled
	case "infrastructure_fail":
		newBuild.State = yolopb.Build_Failed
	case "timedout":
		newBuild.State = yolopb.Build_Timedout
	case "not_run":
		newBuild.State = yolopb.Build_NotRun
	case "running":
		newBuild.State = yolopb.Build_Running
	case "queued":
		newBuild.State = yolopb.Build_Scheduled
	case "scheduled":
		newBuild.State = yolopb.Build_Scheduled
	case "not_running":
		newBuild.State = yolopb.Build_NotRun
	case "no_tests":
		newBuild.State = yolopb.Build_Skipped
	case "fixed":
		newBuild.State = yolopb.Build_Passed
	default:
		fmt.Println("unknown state: ", build.Status)
	}
	return newBuild
}

func circleciArtifactsToBatch(artifacts []*circleci.Artifact, build *circleci.Build) yolopb.Batch {
	batch := yolopb.Batch{}
	for _, artifact := range artifacts {
		id := "circleci_" + md5Sum(artifact.URL)
		newArtifact := yolopb.Artifact{
			ID:          quad.IRI(id),
			CreatedAt:   build.AuthorDate,
			LocalPath:   artifact.PrettyPath,
			DownloadURL: artifact.URL,
			HasBuild:    &yolopb.Build{ID: quad.IRI(build.BuildURL)},
			Driver:      yolopb.Driver_CircleCI,
			Kind:        artifactKindByPath(artifact.PrettyPath),
			State:       yolopb.Artifact_Finished,
			MimeType:    mimetypeByPath(artifact.PrettyPath),
			// FIXME: Sha1Sum
			// FIXME: FileSize
		}
		batch.Artifacts = append(batch.Artifacts, &newArtifact)
	}
	return batch
}

func (o *CircleciWorkerOpts) applyDefaults() {
	if o.Logger == nil {
		o.Logger = zap.NewNop()
	}
	if o.MaxBuilds == 0 {
		o.MaxBuilds = 100
	}
	if o.LoopAfter == 0 {
		o.LoopAfter = time.Second * 10
	}
}
