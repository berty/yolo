package yolosvc

import (
	"context"

	"berty.tech/yolo/v2/go/pkg/yolopb"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (svc *service) DevDumpObjects(ctx context.Context, req *yolopb.DevDumpObjects_Request) (*yolopb.DevDumpObjects_Response, error) {
	if req == nil {
		req = &yolopb.DevDumpObjects_Request{}
	}
	if !svc.devMode {
		return nil, status.Error(codes.PermissionDenied, "Permission Denied")
	}
	var (
		batch *yolopb.Batch
		err   error
	)

	resp := yolopb.DevDumpObjects_Response{}

	if req.WithPreloading {
		batch, err = svc.store.GetBatchWithPreloading()
		if err != nil {
			return nil, err
		}
	} else {
		batch, err = svc.store.GetBatch()
		if err != nil {
			return nil, err
		}

	}
	resp.Downloads, err = svc.store.GetDumpWithPreloading()
	if err != nil {
		return nil, err
	}

	resp.Batch = batch
	return &resp, nil
}
