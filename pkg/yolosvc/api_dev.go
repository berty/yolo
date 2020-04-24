package yolosvc

import (
	"context"
	"fmt"

	"berty.tech/yolo/v2/pkg/yolopb"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"moul.io/godev"
)

func (svc service) DevDumpQuads(ctx context.Context, req *yolopb.DevDumpQuads_Request) (*yolopb.DevDumpQuads_Response, error) {
	if !svc.devMode {
		return nil, status.Error(codes.PermissionDenied, "Permission Denied")
	}

	resp := yolopb.DevDumpQuads_Response{
		Quads: []string{},
	}

	it := svc.db.QuadsAllIterator().Iterate()
	for it.Next(ctx) {
		q := svc.db.Quad(it.Result())
		line := fmt.Sprintf(
			"%v -- %v -> %v",
			q.Subject,
			q.Predicate,
			q.Object,
		)
		resp.Quads = append(resp.Quads, line)
	}

	return &resp, nil
}

func (svc service) DevDumpObjects(ctx context.Context, req *yolopb.DevDumpObjects_Request) (*yolopb.DevDumpObjects_Response, error) {
	if !svc.devMode {
		return nil, status.Error(codes.PermissionDenied, "Permission Denied")
	}

	entities := []yolopb.Entity{}
	if err := svc.schema.LoadTo(ctx, svc.db, &entities); err != nil {
		return nil, fmt.Errorf("load entities: %w", err)
	}
	projects := []yolopb.Project{}
	if err := svc.schema.LoadTo(ctx, svc.db, &projects); err != nil {
		return nil, fmt.Errorf("load projects: %w", err)
	}
	commits := []yolopb.Commit{}
	if err := svc.schema.LoadTo(ctx, svc.db, &commits); err != nil {
		return nil, fmt.Errorf("load commits: %w", err)
	}
	artifacts := []yolopb.Artifact{}
	if err := svc.schema.LoadTo(ctx, svc.db, &artifacts); err != nil {
		return nil, fmt.Errorf("load artifacts: %w", err)
	}
	releases := []yolopb.Release{}
	if err := svc.schema.LoadTo(ctx, svc.db, &releases); err != nil {
		return nil, fmt.Errorf("load releases: %w", err)
	}
	mergeRequests := []yolopb.MergeRequest{}
	if err := svc.schema.LoadTo(ctx, svc.db, &mergeRequests); err != nil {
		return nil, fmt.Errorf("load mergeRequests: %w", err)
	}
	builds := []yolopb.Build{}
	if err := svc.schema.LoadTo(ctx, svc.db, &builds); err != nil {
		return nil, fmt.Errorf("load builds: %w", err)
	}

	batch := yolopb.Batch{
		Entities:      make([]*yolopb.Entity, len(entities)),
		Projects:      make([]*yolopb.Project, len(projects)),
		Commits:       make([]*yolopb.Commit, len(commits)),
		Artifacts:     make([]*yolopb.Artifact, len(artifacts)),
		Releases:      make([]*yolopb.Release, len(releases)),
		MergeRequests: make([]*yolopb.MergeRequest, len(mergeRequests)),
		Builds:        make([]*yolopb.Build, len(builds)),
	}
	for idx, object := range entities {
		clone := object
		clone.Cleanup()
		batch.Entities[idx] = &clone
	}
	for idx, object := range projects {
		clone := object
		clone.Cleanup()
		batch.Projects[idx] = &clone
	}
	for idx, object := range commits {
		clone := object
		clone.Cleanup()
		batch.Commits[idx] = &clone
	}
	for idx, object := range artifacts {
		clone := object
		clone.Cleanup()
		batch.Artifacts[idx] = &clone
	}
	for idx, object := range releases {
		clone := object
		clone.Cleanup()
		batch.Releases[idx] = &clone
	}
	for idx, object := range mergeRequests {
		clone := object
		clone.Cleanup()
		batch.MergeRequests[idx] = &clone
	}
	for idx, object := range builds {
		clone := object
		clone.Cleanup()
		batch.Builds[idx] = &clone
	}

	resp := yolopb.DevDumpObjects_Response{
		Batch: &batch,
	}
	fmt.Println(len(godev.JSON(resp)))
	return &resp, nil
}
