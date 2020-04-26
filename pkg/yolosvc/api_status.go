package yolosvc

import (
	"context"
	"time"

	"berty.tech/yolo/v2/pkg/yolopb"
)

func (svc service) Status(ctx context.Context, req *yolopb.Status_Request) (*yolopb.Status_Response, error) {
	ret := yolopb.Status_Response{
		Uptime: int32(time.Since(svc.startTime).Seconds()),
	}

	// db
	// FIXME: check if db is available
	// FIXME: check if CI clients are set, if they can connect, and if they are rate limited
	if svc.devMode {
		resp, err := svc.DevDumpObjects(ctx, &yolopb.DevDumpObjects_Request{})
		if err != nil {
			return nil, err
		}
		ret.NbEntities = int32(len(resp.Batch.Entities))
		ret.NbProjects = int32(len(resp.Batch.Projects))
		ret.NbCommits = int32(len(resp.Batch.Commits))
		ret.NbReleases = int32(len(resp.Batch.Releases))
		ret.NbMergeRequests = int32(len(resp.Batch.MergeRequests))
		ret.NbBuilds = int32(len(resp.Batch.Builds))
	}

	return &ret, nil
}
