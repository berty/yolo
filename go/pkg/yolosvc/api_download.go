package yolosvc

import (
	"fmt"
	"net/http"
	"path"

	"berty.tech/yolo/v2/go/pkg/bintray"
	"berty.tech/yolo/v2/go/pkg/yolopb"
	"github.com/go-chi/chi"
	"google.golang.org/grpc/codes"
)

func (svc service) ArtifactDownloader(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "artifactID")

	var artifact yolopb.Artifact
	err := svc.db.First(&artifact, "ID = ?", id).Error
	if err != nil {
		httpError(w, err, codes.InvalidArgument)
		return
	}

	base := path.Base(artifact.LocalPath)
	w.Header().Add("Content-Disposition", fmt.Sprintf("inline; filename=%s", base))
	if artifact.FileSize > 0 {
		w.Header().Add("Content-Length", fmt.Sprintf("%d", artifact.FileSize))
	}
	if artifact.MimeType != "" {
		w.Header().Add("Content-Type", artifact.MimeType)
	}

	switch artifact.Driver {
	case yolopb.Driver_Buildkite:
		if svc.bkc == nil {
			err = fmt.Errorf("buildkite token required")
		} else {
			_, err = svc.bkc.Artifacts.DownloadArtifactByURL(artifact.DownloadURL, w)
		}
	case yolopb.Driver_Bintray:
		err = bintray.DownloadContent(artifact.DownloadURL, w)
	// case Driver_CircleCI:
	default:
		err = fmt.Errorf("download not supported for this driver")
	}
	if err != nil {
		httpError(w, err, codes.Internal)
	}
}
