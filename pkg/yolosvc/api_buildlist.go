package yolosvc

import (
	"context"
	"fmt"
	"reflect"
	"sort"

	"berty.tech/yolo/v2/pkg/yolopb"
	cayleypath "github.com/cayleygraph/cayley/query/path"
	"github.com/cayleygraph/quad"
)

func (svc service) BuildList(ctx context.Context, req *yolopb.BuildList_Request) (*yolopb.BuildList_Response, error) {
	if req == nil {
		req = &yolopb.BuildList_Request{}
	}

	resp := yolopb.BuildList_Response{}

	p := cayleypath.StartPath(svc.db).
		Has(quad.IRI("rdf:type"), quad.IRI("yolo:Build"))
	if req.ArtifactKind > 0 {
		// this will filter builds with at least one artifact of the good kind
		// but I don't know how to filter them during loading, so I will cleanup
		// the result later, feel free to help me making things in a smarter way
		p = p.HasPath(
			cayleypath.StartMorphism().
				In(quad.IRI("schema:hasBuild")).
				Has(quad.IRI("schema:kind"), quad.Int(req.ArtifactKind)),
		)
	}
	p = p.Limit(300)
	// FIXME: sort by latest and limit to ~30
	iterator, _ := p.BuildIterator(ctx).Optimize(ctx)

	builds := []yolopb.Build{}
	if err := svc.schema.LoadIteratorToDepth(ctx, svc.db, reflect.ValueOf(&builds), -1, iterator); err != nil {
		return nil, fmt.Errorf("load builds: %w", err)
	}

	// clean up the result and add signed URLs
	for idx, build := range builds {
		build.FilterBuildList()
		// cleanup artifact with invalid requested type (see comment above)
		if req.ArtifactKind > 0 {
			n := 0
			for _, artifact := range build.HasArtifacts {
				if artifact.Kind == req.ArtifactKind {
					build.HasArtifacts[n] = artifact
					n++
				}
			}
			builds[idx].HasArtifacts = build.HasArtifacts[:n]
		}
		if err := build.AddSignedURLs(svc.authSalt); err != nil {
			return nil, fmt.Errorf("sign URLs")
		}
	}

	resp.Builds = make([]*yolopb.Build, len(builds))
	for i := range builds {
		resp.Builds[i] = &builds[i]
	}

	sort.Slice(resp.Builds[:], func(i, j int) bool {
		if resp.Builds[j] == nil || resp.Builds[j].CreatedAt == nil {
			return true
		}
		if resp.Builds[i] == nil || resp.Builds[i].CreatedAt == nil {
			return false
		}
		return resp.Builds[i].CreatedAt.After(*resp.Builds[j].CreatedAt)
	})

	return &resp, nil
}
