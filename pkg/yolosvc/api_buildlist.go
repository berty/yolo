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

	resp := yolopb.BuildList_Response{}

	query := svc.db.Limit(req.Limit)
	if len(req.ArtifactKinds) > 0 {
		query = query.Preload("HasArtifacts", "kind IN (?)", req.ArtifactKinds)
	} else {
		query = query.Preload("HasArtifacts")
	}

	query = query.Order("created_at desc")

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
