package yolosvc

import (
	"context"
	"time"

	"berty.tech/yolo/v2/pkg/yolopb"
	"github.com/jinzhu/gorm"
	"go.uber.org/zap"
	"moul.io/zapgorm"
)

func initDB(db *gorm.DB, logger *zap.Logger) (*gorm.DB, error) {
	db.SetLogger(zapgorm.New(logger))
	db.Callback().Create().Remove("gorm:update_time_stamp")
	db.Callback().Update().Remove("gorm:update_time_stamp")
	db = db.Set("gorm:auto_preload", false)
	db = db.Set("gorm:association_autoupdate", false)
	db.BlockGlobalUpdate(true)
	db.SingularTable(true)
	db.LogMode(true)
	if err := db.AutoMigrate(yolopb.AllModels()...).Error; err != nil {
		return nil, err
	}
	return db, nil
}

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

	err := svc.db.Transaction(func(tx *gorm.DB) error {
		// FIXME: use this for Entities (users, orgs): db.Model(&entity).Update(&entity)?
		for _, object := range batch.AllObjects() {
			if err := tx.Set("gorm:association_autocreate", true).Save(object).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return err
	}

	svc.clearCache.Set()

	return nil
}

func lastBuildCreatedTime(ctx context.Context, db *gorm.DB, driver yolopb.Driver) (time.Time, error) {
	build := yolopb.Build{
		Driver: driver,
	}
	err := db.Order("finished_at desc").Where(&build).Select("finished_at").First(&build).Error
	if err != nil {
		return time.Time{}, err
	}

	since := *build.FinishedAt
	if !since.IsZero() {
		since = since.Add(time.Second) // in order to skip the last one
	}
	return since, nil
}
