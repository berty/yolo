package yolo

import (
	"context"
	"fmt"
	"time"

	"berty.tech/yolo/v2/pkg/bintray"
	"github.com/cayleygraph/cayley"
	"github.com/cayleygraph/cayley/schema"
	"github.com/cayleygraph/quad"
	"go.uber.org/zap"
)

type BintrayWorkerOpts struct {
	Logger    *zap.Logger
	MaxBuilds int
}

// BintrayWorker goals is to manage the bintray update routine, it should try to support as much errors as possible by itself
func BintrayWorker(ctx context.Context, db *cayley.Handle, btc *bintray.Client, schema *schema.Config, opts BintrayWorkerOpts) error {
	if opts.Logger == nil {
		opts.Logger = zap.NewNop()
	}

	logger := opts.Logger

	for {
		logger.Debug("bintray: refresh")

		batches, err := fetchBintray(btc, logger)
		if err != nil {
			logger.Warn("fetch bintray", zap.Error(err))
		} else {
			if err := saveBatches(ctx, db, batches, schema); err != nil {
				logger.Warn("save batches", zap.Error(err))
			}
		}

		select {
		case <-ctx.Done():
			return nil
		case <-time.After(300 * time.Second):
		}
	}
	return nil
}

func fetchBintray(btc *bintray.Client, logger *zap.Logger) ([]Batch, error) {
	batches := []Batch{}

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
				version, err := btc.GetVersion(orgName, repo.Name, pkg.Name, "_latest")
				if err != nil {
					return nil, fmt.Errorf("bintray.GetVersion: %w", err)
				}
				logger.Debug("bintray.GetVersion", zap.Any("version", version))
				batches = append(batches, bintrayVersionToBatch(version))

				files, err := btc.GetPackageFiles(orgName, repo.Name, pkg.Name)
				if err != nil {
					return nil, fmt.Errorf("bintray.GetPackageFiles: %w", err)
				}
				logger.Debug("bintray.GetPackageFiles", zap.Any("files", files))
				batches = append(batches, bintrayFilesToBatch(files))
			}
		}
	}

	return batches, nil
}

func bintrayVersionToBatch(version bintray.GetVersionResponse) Batch {
	batch := Batch{}

	if version.Owner == "" {
		return batch
	}

	id := fmt.Sprintf("https://bintray.com/%s/%s/%s/%s", version.Owner, version.Repo, version.Package, version.Name)
	newBuild := Build{
		ID:        quad.IRI(id),
		CreatedAt: &version.Created,
		UpdatedAt: &version.Updated,
		Message:   version.GithubReleaseNotesFile,
		Driver:    Driver_Bintray,
	}
	switch {
	case version.Published:
		newBuild.State = Build_Passed
	default:
		fmt.Println("unknown state")
	}
	batch.Builds = append(batch.Builds, &newBuild)
	return batch
}

func bintrayFilesToBatch(files bintray.GetPackageFilesResponse) Batch {
	batch := Batch{}

	for _, file := range files {
		buildID := fmt.Sprintf("https://bintray.com/%s/%s/%s/%s", file.Owner, file.Repo, file.Package, file.Version)
		downloadURL := fmt.Sprintf("https://dl.bintray.com/%s/%s/%s", file.Owner, file.Repo, file.Path)
		id := fmt.Sprintf("bintray_%s", md5Sum(downloadURL))
		newArtifact := Artifact{
			ID:          quad.IRI(id),
			CreatedAt:   &file.Created,
			FileSize:    int64(file.Size),
			LocalPath:   file.Path,
			DownloadURL: downloadURL,
			HasBuild:    &Build{ID: quad.IRI(buildID)},
			Sha1Sum:     file.Sha1,
			Sha256Sum:   file.Sha256,
			State:       Artifact_Finished,
			Driver:      Driver_Bintray,
			Kind:        artifactKindByPath(file.Path),
			MimeType:    mimetypeByPath(file.Path),
		}
		batch.Artifacts = append(batch.Artifacts, &newArtifact)
	}
	return batch
}
