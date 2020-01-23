package yolo

import (
	"context"
	"fmt"
	"net/http"
	"path"
	"sort"
	"time"

	"berty.tech/yolo/pkg/plistgen"
	"github.com/buildkite/go-buildkite/buildkite"
	"github.com/cayleygraph/cayley"
	cayleypath "github.com/cayleygraph/cayley/graph/path"
	"github.com/cayleygraph/cayley/schema"
	"github.com/cayleygraph/quad"
	"github.com/go-chi/chi"
	"go.uber.org/zap"
)

type Service interface {
	YoloServiceServer
	PlistGenerator(w http.ResponseWriter, r *http.Request)
	ArtifactDownloader(w http.ResponseWriter, r *http.Request)
}

type service struct {
	startTime time.Time
	db        *cayley.Handle
	logger    *zap.Logger
	schema    *schema.Config
	bkc       *buildkite.Client
}

type ServiceOpts struct {
	BuildkiteClient *buildkite.Client
	Logger          *zap.Logger
}

func NewService(db *cayley.Handle, schema *schema.Config, opts ServiceOpts) Service {
	if opts.Logger == nil {
		opts.Logger = zap.NewNop()
	}
	return &service{
		startTime: time.Now(),
		db:        db,
		logger:    opts.Logger,
		schema:    schema,
		bkc:       opts.BuildkiteClient,
	}
}

func (svc service) Ping(ctx context.Context, req *Ping_Request) (*Ping_Response, error) {
	return &Ping_Response{}, nil
}

func (svc service) Status(ctx context.Context, req *Status_Request) (*Status_Response, error) {
	resp := Status_Response{
		Uptime: int32(time.Since(svc.startTime).Seconds()),
	}

	// db
	stats, err := svc.db.Stats(ctx, false)
	if err == nil {
		resp.DbNodes = stats.Nodes.Size
		resp.DbQuads = stats.Quads.Size
	} else {
		resp.DbErr = err.Error()
	}

	return &resp, nil
}

func (svc service) BuildList(ctx context.Context, req *BuildList_Request) (*BuildList_Response, error) {
	resp := BuildList_Response{}

	p := cayleypath.StartPath(svc.db).
		Both().
		Has(quad.IRI("rdf:type"), quad.IRI("yolo:Build")).
		Limit(300)

	builds := []Build{}
	if err := svc.schema.LoadPathTo(ctx, svc.db, &builds, p); err != nil {
		return nil, fmt.Errorf("load builds: %w", err)
	}

	resp.Builds = make([]*Build, len(builds))
	for i := range builds {
		resp.Builds[i] = &builds[i]
	}

	sort.Slice(resp.Builds[:], func(i, j int) bool {
		return resp.Builds[i].CreatedAt.After(*resp.Builds[j].CreatedAt)
	})

	return &resp, nil
}

func (svc service) ArtifactList(ctx context.Context, req *ArtifactList_Request) (*ArtifactList_Response, error) {
	resp := ArtifactList_Response{}

	p := cayleypath.StartPath(svc.db).
		Has(quad.IRI("rdf:type"), quad.IRI("yolo:Artifact"))
	if req.Kind != 0 {
		p = p.Has(quad.IRI("schema:kind"), quad.Int(req.Kind))
	}
	p = p.Limit(300)

	artifacts := []Artifact{}
	if err := svc.schema.LoadPathTo(ctx, svc.db, &artifacts, p); err != nil {
		return nil, fmt.Errorf("load artifacts: %w", err)
	}

	resp.Artifacts = make([]*Artifact, len(artifacts))
	for i := range artifacts {
		resp.Artifacts[i] = &artifacts[i]
	}

	sort.Slice(resp.Artifacts[:], func(i, j int) bool {
		return resp.Artifacts[i].CreatedAt.After(*resp.Artifacts[j].CreatedAt)
	})

	return &resp, nil
}

func (svc service) PlistGenerator(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "artifactID")

	p := cayleypath.
		StartPath(svc.db, quad.IRI(id)).
		Has(quad.IRI("rdf:type"), quad.IRI("yolo:Artifact"))
	var artifact Artifact
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
		url      = baseURL + "/api/artifact-dl?id=" + id
	)

	b, err := plistgen.Release(bundleID, version, title, url)
	if err != nil {
		http.Error(w, fmt.Sprintf("err: %v", err), http.StatusInternalServerError)
		return
	}
	w.Header().Add("Content-Type", "application/x-plist")
	w.Write(b)
}

func (svc service) ArtifactDownloader(w http.ResponseWriter, r *http.Request) {
	id := r.FormValue("id")

	p := cayleypath.
		StartPath(svc.db, quad.IRI(id)).
		Has(quad.IRI("rdf:type"), quad.IRI("yolo:Artifact"))
	var artifact Artifact
	if err := svc.schema.LoadPathTo(r.Context(), svc.db, &artifact, p); err != nil {
		http.Error(w, fmt.Sprintf("err: %v", err), http.StatusInternalServerError)
		return
	}

	base := path.Base(artifact.LocalPath)
	// FIXME: support multiple drivers
	// FIXME: add content-type
	// FIXME: add file size
	w.Header().Add("Content-Disposition", fmt.Sprintf("inline; filename=%s", base))
	_, err := svc.bkc.Artifacts.DownloadArtifactByURL(artifact.DownloadUrl, w)
	if err != nil {
		http.Error(w, fmt.Sprintf("err: %v", err), http.StatusInternalServerError)
		return
	}
}
