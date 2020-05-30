package yolosvc

import (
	"context"

	"berty.tech/yolo/v2/go/pkg/yolopb"
)

func (svc *service) BuildListFilters(ctx context.Context, req *yolopb.BuildListFilters_Request) (*yolopb.BuildListFilters_Response, error) {
	resp := yolopb.BuildListFilters_Response{}

	// FIXME: limit most recent entities
	// FIXME: sort entries by "popularity" or "freshness"
	// FIXME: add available branches

	err := svc.db.Find(&resp.Entities).Error
	if err != nil {
		return nil, err
	}

	err = svc.db.Preload("HasOwner").Find(&resp.Projects).Error
	if err != nil {
		return nil, err
	}

	return &resp, nil
}
