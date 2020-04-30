package yolosvc

import (
	"context"
	"crypto/sha256"
	"fmt"
	"strings"
	"time"

	"berty.tech/yolo/v2/go/pkg/yolopb"
	"github.com/jinzhu/gorm"
	"github.com/mr-tron/base58"
	"go.uber.org/zap"
	"moul.io/zapgorm"
)

func initDB(db *gorm.DB, logger *zap.Logger) (*gorm.DB, error) {
	db.SetLogger(zapgorm.New(logger))
	db.Callback().Create().Remove("gorm:update_time_stamp")
	db.Callback().Update().Remove("gorm:update_time_stamp")
	db.Callback().Create().Before("gorm:create").Register("yolo_before_create", beforeCreate)
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

func beforeCreate(scope *gorm.Scope) {
	if !scope.HasColumn("yolo_id") {
		return
	}

	field, found := scope.FieldByName("id")
	if !found {
		return
	}

	table := scope.TableName()
	id := field.Field.String()
	hash := sha256.Sum256([]byte(id))
	encoded := base58.Encode(hash[:])
	prefix := strings.ToLower(table[:1])
	yoloID := fmt.Sprintf("%s:%s", prefix, encoded)
	err := scope.SetColumn("yolo_id", yoloID)
	if err != nil {
		panic(err)
	}
}
