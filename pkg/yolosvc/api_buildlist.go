package yolosvc

import (
	"context"
	"fmt"

	"berty.tech/yolo/v2/pkg/yolopb"
)

func (svc service) BuildList(ctx context.Context, req *yolopb.BuildList_Request) (*yolopb.BuildList_Response, error) {
	if req == nil {
		req = &yolopb.BuildList_Request{}
	}
	if req.Limit == 0 {
		req.Limit = 30
	}
	if !req.WithArtifacts {
		req.WithArtifacts = len(req.ArtifactKinds) > 0
	}

	resp := yolopb.BuildList_Response{}

	query := svc.db.
		Model(&yolopb.Build{}).
		Limit(req.Limit).
		Order("created_at desc")

	switch {
	case len(req.ArtifactKinds) > 0:
		query = query.
			Joins("JOIN artifact ON artifact.has_build_id = build.id AND artifact.kind IN (?)", req.ArtifactKinds).
			Preload("HasArtifacts", "kind IN (?)", req.ArtifactKinds)
	case req.WithArtifacts:
		query = query.
			Joins("JOIN artifact ON artifact.has_build_id = build.id", req.ArtifactKinds).
			Preload("HasArtifacts")
	default:
		query = query.
			Preload("HasArtifacts")
	}

	err := query.Find(&resp.Builds).Error
	if err != nil {
		return nil, err
	}

	for _, build := range resp.Builds {
		if err := build.AddSignedURLs(svc.authSalt); err != nil {
			return nil, fmt.Errorf("sign URLs")
		}
	}

	return &resp, nil
}
