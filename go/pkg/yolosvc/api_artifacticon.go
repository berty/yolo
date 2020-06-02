package yolosvc

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

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

	cacheUntil := time.Now().AddDate(1, 0, 0).Format(http.TimeFormat)
	w.Header().Add("Cache-Control", "public,max-age=31536000,immutable")
	w.Header().Add("Expires", cacheUntil)
	w.Header().Add("Content-Type", "image/png")
	_, err = io.Copy(w, f)
	if err != nil {
		httpError(w, err, codes.Internal)
	}
}
