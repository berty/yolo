package yolosvc

import (
	"context"

	"berty.tech/yolo/v2/go/pkg/yolopb"
)

func (svc *service) BuildListFilters(ctx context.Context, req *yolopb.BuildListFilters_Request) (*yolopb.BuildListFilters_Response, error) {
	// FIXME: limit most recent entities
	// FIXME: sort entries by "popularity" or "freshness"
	// FIXME: add available branches

	blFilters, err := svc.store.GetBuildListFilters()
	if err != nil {
		return nil, err
	}

	return &yolopb.BuildListFilters_Response{
		Entities: blFilters.Entities,
		Projects: blFilters.Projects,
	}, nil
}
