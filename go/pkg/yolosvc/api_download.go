package yolosvc

import (
	"archive/zip"
	"bytes"
	"context"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"berty.tech/yolo/v2/go/pkg/bintray"
	"berty.tech/yolo/v2/go/pkg/yolopb"
	"github.com/go-chi/chi"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
)

func (svc *service) ArtifactDownloader(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "artifactID")
	var artifact yolopb.Artifact
	err := svc.db.First(&artifact, "ID = ?", id).Error
	if err != nil {
		httpError(w, err, codes.InvalidArgument)
		return
	}

	cache := filepath.Join(svc.artifactsCachePath, artifact.ID)
	// download missing cache
	if svc.artifactsCachePath != "" {
		svc.artifactsCacheMutex.Lock()
		if !fileExists(cache) {
			err := svc.artifactDownloadToFile(&artifact, cache)
			if err != nil {
				svc.artifactsCacheMutex.Unlock()
				httpError(w, err, codes.Internal)
				return
			}
		}
		svc.artifactsCacheMutex.Unlock()
	}

	base := path.Base(artifact.LocalPath)
	w.Header().Add("Content-Disposition", fmt.Sprintf("attachment; filename=%s", base))
	if artifact.FileSize > 0 {
		w.Header().Add("Content-Length", fmt.Sprintf("%d", artifact.FileSize))
	}
	if artifact.MimeType != "" {
		w.Header().Add("Content-Type", artifact.MimeType)
	}

	// save download
	now := time.Now()
	download := yolopb.Download{
		HasArtifactID: artifact.ID,
		CreatedAt:     &now,
		// FIXME: user agent for analytics?
	}
	err = svc.db.Create(&download).Error
	if err != nil {
		svc.logger.Warn("add download entry", zap.Error(err))
	}

	if svc.artifactsCachePath != "" {
		// send cache
		f, err := os.Open(cache)
		if err != nil {
			httpError(w, err, codes.Internal)
			return
		}
		defer f.Close()
		_, err = io.Copy(w, f)
		if err != nil {
			httpError(w, err, codes.Internal)
		}
	} else {
		// proxy
		ctx := context.Background()
		err = svc.artifactDownloadFromProvider(ctx, &artifact, w)
		if err != nil {
			httpError(w, err, codes.Internal)
		}
	}
}

func (svc *service) artifactDownloadToFile(artifact *yolopb.Artifact, dest string) error {
	out, err := os.Create(dest + ".tmp")
	if err != nil {
		return err
	}

	ctx := context.Background()
	err = svc.artifactDownloadFromProvider(ctx, artifact, out)
	if err != nil {
		out.Close()
		return err
	}

	out.Close()

	err = os.Rename(dest+".tmp", dest)
	if err != nil {
		return err
	}

	// FIXME: parse file and update the db with new metadata

	return nil
}

func (svc *service) artifactDownloadFromProvider(ctx context.Context, artifact *yolopb.Artifact, w io.Writer) error {
	switch artifact.Driver {
	case yolopb.Driver_Buildkite:
		if svc.bkc == nil {
			return fmt.Errorf("buildkite token required")
		}
		_, err := svc.bkc.Artifacts.DownloadArtifactByURL(artifact.DownloadURL, w)
		return err
	case yolopb.Driver_Bintray:
		return bintray.DownloadContent(artifact.DownloadURL, w)
		// case Driver_CircleCI:
	case yolopb.Driver_GitHub:
		if svc.ghc == nil {
			return fmt.Errorf("github token required")
		}

		// get artifact archive (.zip)
		var zipContent []byte
		{
			// FIXME: if cachePath != nil -> cache the zip
			u, err := url.Parse(artifact.GetDownloadURL())
			if err != nil {
				return err
			}
			parts := strings.Split(u.Path, "/")
			if len(parts) != 8 || parts[5] != "artifacts" || parts[7] != "zip" {
				return fmt.Errorf("unsupported download URL: %q", u)
			}
			owner, repo := parts[2], parts[3]
			artifactID, err := strconv.Atoi(parts[6])
			if err != nil {
				return fmt.Errorf("invalid download URL: %w", err)
			}
			dlurl, _, err := svc.ghc.Actions.DownloadArtifact(ctx, owner, repo, int64(artifactID), true)
			if err != nil {
				return fmt.Errorf("failed to generate download URL: %w", err)
			}
			resp, err := http.Get(dlurl.String())
			if err != nil {
				return fmt.Errorf("failed to download artifact: %w", err)
			}
			defer resp.Body.Close()
			zipContent, err = ioutil.ReadAll(resp.Body)
			if err != nil {
				return fmt.Errorf("failed to download artifact stream: %w", err)
			}
		}

		// extract file from archive
		{
			bytesReader := bytes.NewReader(zipContent)
			zipReader, err := zip.NewReader(bytesReader, int64(len(zipContent)))
			if err != nil {
				return fmt.Errorf("failed to open artifact archive: %w", err)
			}
			if len(zipReader.File) != 1 {
				return fmt.Errorf("artifact archive should only have 1 file")
			}
			for _, f := range zipReader.File {
				fd, err := f.Open()
				if err != nil {
					return fmt.Errorf("failed to read file from archive: %w", err)
				}
				defer fd.Close()
				_, err = io.Copy(w, fd)
				if err != nil {
					return fmt.Errorf("io error while sending content of the artifact: %w", err)
				}
			}
		}

		return nil
	}
	return fmt.Errorf("download not supported for this driver")
}
