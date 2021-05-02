package yolosvc

import (
	"context"
	"fmt"

	"berty.tech/yolo/v2/go/pkg/yolopb"
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

	resp.Builds, err = svc.store.GetBuildList(req.ArtifactID, req.ArtifactKinds, req.WithArtifacts, req.BuildID, req.BuildState, req.BuildDriver, req.ProjectID, req.MergeRequestID, req.MergeRequestAuthorID, req.MergerequestState, req.Branch, req.Limit)
	if err != nil {
		return nil, err
	}
	// compute download stats
	artifactMap := map[string]int64{}
	for _, build := range resp.Builds {
		for _, artifact := range build.HasArtifacts {
			artifactMap[artifact.ID] = 0
		}
	}
	if len(artifactMap) > 0 {
		artifactMap, err = svc.store.GetArtifactDownload(artifactMap)
		if err != nil {
			return nil, err
		}
	}

	// prepare response
	for _, build := range resp.Builds {
		if err := build.PrepareOutput(svc.authSalt); err != nil {
			return nil, fmt.Errorf("failed preparing output")
		}
		for _, artifact := range build.HasArtifacts {
			if count, found := artifactMap[artifact.ID]; found {
				artifact.DownloadsCount = count
			}
		}
	}

	return &resp, nil
}
