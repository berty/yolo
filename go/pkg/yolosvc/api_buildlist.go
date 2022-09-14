package yolosvc

import (
	"context"
	"fmt"

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
	resp := yolopb.BuildList_Response{}
	opts := yolostore.GetBuildListOpts{
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
		SortByCommitDate:     req.SortByCommitDate,
	}

	var err error
	resp.Builds, err = svc.store.GetBuildList(opts)
	if err != nil {
		return nil, err
	}

	// prepare response
	for _, build := range resp.Builds {
		if err := build.PrepareOutput(svc.authSalt); err != nil {
			return nil, fmt.Errorf("failed preparing output")
		}
	}

	return &resp, nil
}
