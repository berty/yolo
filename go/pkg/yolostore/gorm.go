package yolostore

import (
	"crypto/sha256"
	"fmt"
	"strings"

	"berty.tech/yolo/v2/go/pkg/yolopb"
	"github.com/jinzhu/gorm"
	"github.com/mr-tron/base58"
	"go.uber.org/zap"
	"moul.io/zapgorm"
)


func initDB(db *gorm.DB, logger *zap.Logger) (*gorm.DB, error) {
	db.SetLogger(zapgorm.New(logger.Named("gorm")))
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
