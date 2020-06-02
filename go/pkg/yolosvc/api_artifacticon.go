package yolosvc

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi"
	"google.golang.org/grpc/codes"
)

func (svc *service) ArtifactIcon(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")
	name = strings.ReplaceAll(name, "/", string(os.PathSeparator))

	p := filepath.Join(svc.artifactsCachePath, "icons", name)
	if !fileExists(p) {
		httpError(w, fmt.Errorf("no such icon"), codes.InvalidArgument)
		return
	}

	f, err := os.Open(p)
	if err != nil {
		httpError(w, err, codes.Internal)
		return
	}
	defer f.Close()

	w.Header().Add("Content-Type", "image/png")
	_, err = io.Copy(w, f)
	if err != nil {
		httpError(w, err, codes.Internal)
	}
}
