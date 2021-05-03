package yolosvc

import (
	"context"

	"berty.tech/yolo/v2/go/pkg/yolopb"
	"berty.tech/yolo/v2/go/pkg/yolostore"
)

func (svc *service) BuildList(ctx context.Context, req *yolopb.BuildList_Request) (*yolopb.BuildList_Response, error) {
	if req == nil {
		req = &yolopb.BuildList_Request{}
	}
	if req.Limit == 0 {
		req.Limit = 50
	}
	if !req.WithArtifacts {
		req.WithArtifacts = len(req.ArtifactKinds) > 0
	}
	var err error
	resp := yolopb.BuildList_Response{}
	bl := yolostore.GetBuildListOpts{
		ArtifactID:           req.ArtifactID,
		ArtifactKinds:        req.ArtifactKinds,
		WithArtifact:         req.WithArtifacts,
		BuildID:              req.BuildID,
		BuildState:           req.BuildState,
		BuildDriver:          req.BuildDriver,
		ProjectID:            req.ProjectID,
		MergeRequestID:       req.MergeRequestID,
		MergeRequestAuthorID: req.MergeRequestAuthorID,
		MergeRequestState:    req.MergerequestState,
		Branch:               req.Branch,
		Limit:                req.Limit,
	}

	resp.Builds, err = svc.store.GetBuildList(bl, svc.authSalt)
	if err != nil {
		return nil, err
	}

	return &resp, nil
}
