package yolosvc

import (
	"context"

	"berty.tech/yolo/v2/go/pkg/yolopb"
)

func (svc *service) Ping(ctx context.Context, req *yolopb.Ping_Request) (*yolopb.Ping_Response, error) {
	return &yolopb.Ping_Response{}, nil
}
