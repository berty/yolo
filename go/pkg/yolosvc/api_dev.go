package yolosvc

import (
	"context"

	"berty.tech/yolo/v2/go/pkg/yolopb"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (svc service) DevDumpObjects(ctx context.Context, req *yolopb.DevDumpObjects_Request) (*yolopb.DevDumpObjects_Response, error) {
	if req == nil {
		req = &yolopb.DevDumpObjects_Request{}
	}
	if !svc.devMode {
		return nil, status.Error(codes.PermissionDenied, "Permission Denied")
	}

	batch := yolopb.NewBatch()
	resp := yolopb.DevDumpObjects_Response{}

	if req.WithPreloading {
		if err := svc.db.
			Preload("HasOwner").
			Find(&batch.Projects).Error; err != nil {
			return nil, err
		}
		if err := svc.db.
			// FIXME: TODO
			Find(&batch.Entities).Error; err != nil {
			return nil, err
		}
		if err := svc.db.
			Preload("HasCommit").
			Preload("HasProject").
			Preload("HasMergerequest").
			Preload("HasMergerequest.HasProject").
			Preload("HasMergerequest.HasProject.HasOwner").
			Preload("HasMergerequest.HasAuthor").
			Preload("HasMergerequest.HasCommit").
			Find(&batch.Builds).Error; err != nil {
			return nil, err
		}
		if err := svc.db.
			Preload("HasBuild").
			Preload("HasBuild.HasProject").
			Preload("HasBuild.HasMergerequest").
			Preload("HasBuild.HasMergerequest.HasProject").
			Preload("HasBuild.HasMergerequest.HasAuthor").
			Preload("HasBuild.HasMergerequest.HasCommit").
			Preload("HasBuild.HasCommit").
			Find(&batch.Artifacts).Error; err != nil {
			return nil, err
		}
		if err := svc.db.
			Preload("HasCommit").
			Preload("HasProject").
			Preload("HasAuthor").
			Find(&batch.MergeRequests).Error; err != nil {
			return nil, err
		}
		if err := svc.db.
			// FIXME: TODO
			Find(&batch.Releases).Error; err != nil {
			return nil, err
		}
		if err := svc.db.
			// FIXME: TODO
			Find(&batch.Commits).Error; err != nil {
			return nil, err
		}
	} else {
		if err := svc.db.Find(&batch.Projects).Error; err != nil {
			return nil, err
		}
		if err := svc.db.Find(&batch.Entities).Error; err != nil {
			return nil, err
		}
		if err := svc.db.Find(&batch.Builds).Error; err != nil {
			return nil, err
		}
		if err := svc.db.Find(&batch.Artifacts).Error; err != nil {
			return nil, err
		}
		if err := svc.db.Find(&batch.MergeRequests).Error; err != nil {
			return nil, err
		}
		if err := svc.db.Find(&batch.Releases).Error; err != nil {
			return nil, err
		}
		if err := svc.db.Find(&batch.Commits).Error; err != nil {
			return nil, err
		}
	}
	if err := svc.db.Find(&resp.Downloads).Error; err != nil {
		return nil, err
	}

	resp.Batch = batch
	return &resp, nil
}
