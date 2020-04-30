package yolosvc

import (
	"context"
	"fmt"

	"berty.tech/yolo/v2/go/pkg/yolopb"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (svc service) DevDumpObjects(ctx context.Context, req *yolopb.DevDumpObjects_Request) (*yolopb.DevDumpObjects_Response, error) {
	if !svc.devMode {
		return nil, status.Error(codes.PermissionDenied, "Permission Denied")
	}

	batch := yolopb.NewBatch()

	db := svc.db
	if req.WithPreloading {
		fmt.Println("####################", true)
		db = db.Set("gorm:auto_preload", true)
	} else {
		fmt.Println("####################", false)
	}

	if err := db.Find(&batch.Projects).Error; err != nil {
		return nil, err
	}
	if err := db.Find(&batch.Entities).Error; err != nil {
		return nil, err
	}
	if err := db.Find(&batch.Builds).Error; err != nil {
		return nil, err
	}
	if err := db.Find(&batch.Artifacts).Error; err != nil {
		return nil, err
	}
	if err := db.Find(&batch.MergeRequests).Error; err != nil {
		return nil, err
	}
	if err := db.Find(&batch.Releases).Error; err != nil {
		return nil, err
	}
	if err := db.Find(&batch.Commits).Error; err != nil {
		return nil, err
	}

	resp := yolopb.DevDumpObjects_Response{
		Batch: batch,
	}
	return &resp, nil
}
