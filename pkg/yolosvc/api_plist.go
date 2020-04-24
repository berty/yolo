package yolosvc

import (
	"fmt"
	"net/http"

	"berty.tech/yolo/v2/pkg/plistgen"
	"berty.tech/yolo/v2/pkg/yolopb"
	cayleypath "github.com/cayleygraph/cayley/query/path"
	"github.com/cayleygraph/quad"
	"github.com/go-chi/chi"
	"github.com/stretchr/signature"
)

func (svc service) PlistGenerator(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "artifactID")

	p := cayleypath.
		StartPath(svc.db, quad.IRI(id)).
		Has(quad.IRI("rdf:type"), quad.IRI("yolo:Artifact"))
	var artifact yolopb.Artifact
	if err := svc.schema.LoadPathTo(r.Context(), svc.db, &artifact, p); err != nil {
		http.Error(w, fmt.Sprintf("err: %v", err), http.StatusInternalServerError)
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

	var err error
	url, err = signature.GetSignedURL("GET", url, "", svc.authSalt)
	if err != nil {
		http.Error(w, fmt.Sprintf("err: %v", err), http.StatusInternalServerError)
		return
	}

	url = baseURL + url // prepend baseURL _after_ computing the signature

	b, err := plistgen.Release(bundleID, version, title, url)
	if err != nil {
		http.Error(w, fmt.Sprintf("err: %v", err), http.StatusInternalServerError)
		return
	}
	w.Header().Add("Content-Type", "application/x-plist")
	_, _ = w.Write(b)
}
