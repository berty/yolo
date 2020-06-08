package yolosvc

import (
	"fmt"
	"net/http"
	"path/filepath"

	"berty.tech/yolo/v2/go/pkg/yolopb"
	"github.com/go-chi/chi"
	"google.golang.org/grpc/codes"
	"moul.io/pkgman/pkg/ipa"
)

func (svc *service) ArtifactGetFile(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "artifactID")
	filePath := chi.URLParam(r, "*")
	fmt.Println("id", id, "path", filePath)

	var artifact yolopb.Artifact
	err := svc.db.
		Preload("HasBuild").
		Preload("HasBuild.HasProject").
		Preload("HasBuild.HasProject.HasOwner").
		First(&artifact, "ID = ?", id).
		Error
	if err != nil {
		httpError(w, err, codes.InvalidArgument)
		return
	}

	artifactPath := filepath.Join(svc.artifactsCachePath, artifact.ID)
	if !fileExists(artifactPath) {
		httpError(w, err, codes.NotFound)
		return
	}

	pkg, err := ipa.Open(artifactPath)
	if err != nil {
		httpError(w, err, codes.NotFound)
		return
	}
	defer pkg.Close()

	b, err := pkg.FileBytes(filePath)
	if err != nil {
		httpError(w, err, codes.NotFound)
		return
	}

	contentType := mimetypeByPath(filePath)
	w.Header().Add("Content-Type", contentType)

	_, err = w.Write(b)
	if err != nil {
		httpError(w, err, codes.Internal)
	}
}
