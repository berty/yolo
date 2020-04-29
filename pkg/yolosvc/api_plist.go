package yolosvc

import (
	"fmt"
	"net/http"

	"berty.tech/yolo/v2/pkg/plistgen"
	"berty.tech/yolo/v2/pkg/yolopb"
	"github.com/go-chi/chi"
	"github.com/stretchr/signature"
	"google.golang.org/grpc/codes"
)

func (svc service) PlistGenerator(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "artifactID")

	var artifact yolopb.Artifact
	err := svc.db.First(&artifact, "ID = ?", id).Error
	if err != nil {
		httpError(w, err, codes.InvalidArgument)
		return
	}

	scheme := r.Header.Get("X-Forwarded-Proto")
	if scheme == "" {
		scheme = "http"
	}
	baseURL := fmt.Sprintf("%s://%s", scheme, r.Host)
	var (
		bundleID = "tech.berty.ios" // FIXME: change me
		title    = "YOLO"           // FIXME: use random emojis :)
		version  = "v0.0.1"         // FIXME: change me
		url      = "/api/artifact-dl/" + id
	)

	url, err = signature.GetSignedURL("GET", url, "", svc.authSalt)
	if err != nil {
		httpError(w, err, codes.Internal)
		return
	}

	url = baseURL + url // prepend baseURL _after_ computing the signature

	b, err := plistgen.Release(bundleID, version, title, url)
	if err != nil {
		httpError(w, err, codes.Internal)
		return
	}
	w.Header().Add("Content-Type", "application/x-plist")
	_, _ = w.Write(b)
}
