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
	stats, err := svc.db.Stats(ctx, false)
	if err == nil {
		ret.DbNodes = stats.Nodes.Value
		ret.DbQuads = stats.Quads.Value
	} else {
		ret.DbErr = err.Error()
	}

	if svc.devMode {
		resp, err := svc.DevDumpObjects(ctx, nil)
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
