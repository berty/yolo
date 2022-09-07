package yolosvc

import (
	"context"
	"fmt"
	"strings"
	"time"

	"berty.tech/yolo/v2/go/pkg/bintray"
	"berty.tech/yolo/v2/go/pkg/yolopb"
	"github.com/tevino/abool"
	"go.uber.org/zap"
)

type BintrayWorkerOpts struct {
	Logger     *zap.Logger
	LoopAfter  time.Duration
	ClearCache *abool.AtomicBool
	Once       bool
}

// BintrayWorker goals is to manage the github update routine, it should try to support as much errors as possible by itself
func (svc *service) BintrayWorker(ctx context.Context, opts BintrayWorkerOpts) error {
	opts.applyDefaults()

	logger := opts.Logger.Named("btry")

	for iteration := 0; ; iteration++ {
		logger.Debug("bintray: refresh", zap.Int("iteration", iteration))
		// FIXME: only fetch builds since most recent known
		batch, err := fetchBintray(svc.btc, logger)
		if err != nil {
			logger.Warn("fetch bintray", zap.Error(err))
		} else {
			if err := svc.saveBatch(ctx, batch); err != nil {
				logger.Warn("save batch", zap.Error(err))
			}
		}

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

func fetchBintray(btc *bintray.Client, logger *zap.Logger) (*yolopb.Batch, error) {
	batch := yolopb.NewBatch()

	// FIXME: support pagination
	user, err := btc.GetUser(btc.Subject())
	if err != nil {
		return nil, fmt.Errorf("bintray.GetUser: %w", err)
	}
	logger.Debug("bintray.GetUser", zap.Any("user", user))

	for _, orgName := range user.Organizations {
		repos, err := btc.GetRepositories(orgName)
		if err != nil {
			return nil, fmt.Errorf("bintray.GetRepositories: %w", err)
		}
		logger.Debug("bintray.GetRepositories", zap.Any("repos", repos))

		for _, repo := range repos {
			pkgs, err := btc.GetPackages(orgName, repo.Name)
			if err != nil {
				return nil, fmt.Errorf("bintray.GetPackages: %w", err)
			}
			logger.Debug("bintray.GetPackages", zap.Any("pkgs", pkgs))

			for _, pkg := range pkgs {
				metadata, err := btc.GetPackage(orgName, repo.Name, pkg.Name)
				if err != nil {
					return nil, fmt.Errorf("bintray.GetPackage: %w", err)
				}

				version, err := btc.GetVersion(orgName, repo.Name, pkg.Name, "_latest")
				if err != nil {
					return nil, fmt.Errorf("bintray.GetVersion: %w", err)
				}

				logger.Debug("bintray.GetVersion", zap.Any("version", version))
				batch.Merge(bintrayVersionToBatch(version, metadata))

				files, err := btc.GetPackageFiles(orgName, repo.Name, pkg.Name)
				if err != nil {
					return nil, fmt.Errorf("bintray.GetPackageFiles: %w", err)
				}

				logger.Debug("bintray.GetPackageFiles", zap.Any("files", files))
				batch.Merge(bintrayFilesToBatch(files))
			}
		}
	}

	// FIXME: only call saveBatches when there are actual changes, but for now,
	//        it's not a problem since bintray is very rarely updated
	return batch, nil
}

func bintrayVersionToBatch(version bintray.GetVersionResponse, pkg bintray.GetPackageResponse) *yolopb.Batch {
	batch := yolopb.NewBatch()

	if version.Owner == "" {
		return batch
	}

	id := fmt.Sprintf("https://bintray.com/%s/%s/%s/%s", version.Owner, version.Repo, version.Package, version.Name)
	newBuild := yolopb.Build{
		ID:        id,
		ShortID:   version.Name,
		CreatedAt: &version.Created,
		UpdatedAt: &version.Updated,
		Message:   strings.TrimSpace(version.Desc + "\n\n" + version.GithubReleaseNotesFile),
		VCSTag:    version.VcsTag,
		Driver:    yolopb.Driver_Bintray,
	}
	if pkg.VcsURL != "" {
		projectID := pkg.VcsURL
		projectID = strings.TrimRight(projectID, ".git")
		newBuild.HasProjectID = projectID
	}
	// FIXME: support monorepos with multiple subprojects.
	//        i.e., take pkg.Repo as sub-project
	switch {
	case version.Published:
		newBuild.State = yolopb.Build_Passed
	default:
		fmt.Println("unknown state")
	}

	guessMissingBuildInfo(&newBuild)
	batch.Builds = append(batch.Builds, &newBuild)

	return batch
}

func bintrayFilesToBatch(files bintray.GetPackageFilesResponse) *yolopb.Batch {
	batch := yolopb.NewBatch()

	for _, file := range files {
		buildID := fmt.Sprintf("https://bintray.com/%s/%s/%s/%s", file.Owner, file.Repo, file.Package, file.Version)
		downloadURL := fmt.Sprintf("https://dl.bintray.com/%s/%s/%s", file.Owner, file.Repo, file.Path)
		id := fmt.Sprintf("bintray_%s", md5Sum([]byte(downloadURL)))
		newArtifact := yolopb.Artifact{
			ID:          id,
			CreatedAt:   &file.Created,
			FileSize:    int64(file.Size),
			LocalPath:   file.Path,
			DownloadURL: downloadURL,
			HasBuildID:  buildID,
			Sha1Sum:     file.Sha1,
			Sha256Sum:   file.Sha256,
			State:       yolopb.Artifact_Finished,
			Driver:      yolopb.Driver_Bintray,
			Kind:        artifactKindByPath(file.Path),
			MimeType:    mimetypeByPath(file.Path),
		}
		batch.Artifacts = append(batch.Artifacts, &newArtifact)
	}
	return batch
}

func (o *BintrayWorkerOpts) applyDefaults() {
	if o.Logger == nil {
		o.Logger = zap.NewNop()
	}
	if o.LoopAfter == 0 {
		o.LoopAfter = 1200 * time.Second
	}
	if o.ClearCache == nil {
		o.ClearCache = abool.New()
	}
}
