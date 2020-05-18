package yolosvc

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path"
	"path/filepath"

	"berty.tech/yolo/v2/go/pkg/bintray"
	"berty.tech/yolo/v2/go/pkg/yolopb"
	"github.com/go-chi/chi"
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
	w.Header().Add("Content-Disposition", fmt.Sprintf("inline; filename=%s", base))
	if artifact.FileSize > 0 {
		w.Header().Add("Content-Length", fmt.Sprintf("%d", artifact.FileSize))
	}
	if artifact.MimeType != "" {
		w.Header().Add("Content-Type", artifact.MimeType)
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
		err = svc.artifactDownloadFromProvider(&artifact, w)
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

	err = svc.artifactDownloadFromProvider(artifact, out)
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

func (svc *service) artifactDownloadFromProvider(artifact *yolopb.Artifact, w io.Writer) error {
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
	}
	return fmt.Errorf("download not supported for this driver")
}
