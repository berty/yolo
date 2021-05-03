package yolosvc

import (
	"fmt"
	"net/http"
	"path/filepath"

	"github.com/go-chi/chi"
	"google.golang.org/grpc/codes"
	"moul.io/pkgman/pkg/ipa"
	"moul.io/u"
)

func (svc *service) ArtifactGetFile(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "artifactID")
	filePath := chi.URLParam(r, "*")
	fmt.Println("id", id, "path", filePath)

	artifact, err := svc.store.GetArtifactByID(id)
	if err != nil {
		httpError(w, err, codes.InvalidArgument)
		return
	}

	artifactPath := filepath.Join(svc.artifactsCachePath, artifact.ID)
	if !u.FileExists(artifactPath) {
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
