package yolosvc

import (
	"context"
	"fmt"

	"berty.tech/yolo/v2/go/pkg/yolopb"
)

func (svc service) BuildList(ctx context.Context, req *yolopb.BuildList_Request) (*yolopb.BuildList_Response, error) {
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

	query := svc.db.
		Model(&yolopb.Build{})

	switch {
	case len(req.BuildID) > 0:
		query = query.
			Where("id IN (?) OR yolo_id IN (?)", req.BuildID, req.BuildID).
			Preload("HasArtifacts")
	case len(req.ArtifactID) > 0:
		query = query.
			Joins("JOIN artifact ON artifact.has_build_id = build.id AND (artifact.id IN (?) OR artifact.yolo_id IN (?))", req.ArtifactID, req.ArtifactID).
			Preload("HasArtifacts")
	default:
		switch {
		case len(req.ArtifactKinds) > 0:
			query = query.
				Joins("JOIN artifact ON artifact.has_build_id = build.id AND artifact.kind IN (?)", req.ArtifactKinds).
				Preload("HasArtifacts", "kind IN (?)", req.ArtifactKinds)
		case req.WithArtifacts:
			query = query.
				Joins("JOIN artifact ON artifact.has_build_id = build.id", req.ArtifactKinds).
				Preload("HasArtifacts")
		default:
			query = query.
				Preload("HasArtifacts")
		}

		if len(req.BuildState) > 0 {
			query = query.Where("state IN (?)", req.BuildState)
		}

		if len(req.BuildDriver) > 0 {
			query = query.Where("driver IN (?)", req.BuildDriver)
		}

		if len(req.ProjectID) > 0 {
			query = query.Joins("JOIN project ON project.id = build.has_project_id AND (project.id IN (?) OR project.yolo_id IN (?))", req.ProjectID, req.ProjectID)
		}

		if len(req.MergeRequestID) > 0 {
			query = query.Where("has_mergerequest_id IN (?)", req.MergeRequestID)
		}

		if len(req.MergeRequestAuthorID) > 0 ||
			len(req.MergerequestState) > 0 ||
			req.WithMergerequest {
			query = query.Joins("JOIN merge_request ON merge_request.id = build.has_mergerequest_id")
		}
		if len(req.MergeRequestAuthorID) > 0 {
			query = query.Where("merge_request.has_author_id IN (?)", req.MergeRequestAuthorID)
		}
		if len(req.MergerequestState) > 0 {
			query = query.Where("merge_request.state IN (?)", req.MergerequestState)
		}
	}

	query = query.
		Preload("HasCommit").
		Preload("HasProject").
		Preload("HasProject.HasOwner").
		Preload("HasMergerequest").
		Preload("HasMergerequest.HasProject").
		Preload("HasMergerequest.HasAuthor").
		Preload("HasMergerequest.HasCommit").
		Limit(req.Limit).
		Order("created_at desc")

	err := query.Find(&resp.Builds).Error
	if err != nil {
		return nil, err
	}

	for _, build := range resp.Builds {
		if err := build.AddSignedURLs(svc.authSalt); err != nil {
			return nil, fmt.Errorf("sign URLs")
		}
	}

	return &resp, nil
}
