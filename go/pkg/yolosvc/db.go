package yolosvc

import (
	"context"
	"time"

	"berty.tech/yolo/v2/go/pkg/yolopb"
	"berty.tech/yolo/v2/go/pkg/yolostore"
	"go.uber.org/zap"
)

func (svc *service) saveBatch(ctx context.Context, batch *yolopb.Batch) error {
	if batch.Empty() {
		return nil
	}
	batch.Optimize() // remove duplicates

	{
		log := svc.logger.With()
		if l := len(batch.Projects); l > 0 {
			log = log.With(zap.Int("projects", l))
		}
		if l := len(batch.Releases); l > 0 {
			log = log.With(zap.Int("releases", l))
		}
		if l := len(batch.MergeRequests); l > 0 {
			log = log.With(zap.Int("merge_requests", l))
		}
		if l := len(batch.Artifacts); l > 0 {
			log = log.With(zap.Int("artifacts", l))
		}
		if l := len(batch.Builds); l > 0 {
			log = log.With(zap.Int("builds", l))
		}
		if l := len(batch.Commits); l > 0 {
			log = log.With(zap.Int("commits", l))
		}
		if l := len(batch.Entities); l > 0 {
			log = log.With(zap.Int("entities", l))
		}
		log.Debug("saveBatch")
	}

	err := svc.store.SaveBatch(batch)
	if err != nil {
		return err
	}

	svc.clearCache.Set()

	return nil
}

func lastBuildCreatedTime(ctx context.Context, store yolostore.Store, driver yolopb.Driver) (time.Time, error) {

	build, err := store.GetLastBuild()
	if err != nil {
		return time.Time{}, err
	}
	build.Driver = driver

	if build.FinishedAt == nil {
		return time.Time{}, nil
	}

	since := *build.FinishedAt
	if !since.IsZero() {
		since = since.Add(time.Second) // in order to skip the last one
	}
	return since, nil
}
