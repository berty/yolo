package yolostore

import (
	"crypto/sha256"
	"fmt"
	"strings"
	"testing"

	"berty.tech/yolo/v2/go/pkg/yolopb"
	"github.com/jinzhu/gorm"
	_ "github.com/mattn/go-sqlite3"
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

func TestingDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("init in-memory sqlite server: %v", err)
	}

	logger, _ := zap.NewProduction()

	db, err = initDB(db, logger)
	if err != nil {
		t.Fatalf("init in-memory db: %v", err)
	}

	TestingCreateEntities(t, db)

	return db
}

func TestingCreateEntities(t *testing.T, db *gorm.DB) {
	if err := db.Transaction(func(tx *gorm.DB) error {

		// create artifact
		var artifact *yolopb.Artifact
		artifact = &yolopb.Artifact{
			ID:          "artif1",
			YoloID:      "yolo1",
			FileSize:    80,
			LocalPath:   "js/packages/bla",
			DownloadURL: "https://api.buildkite.com",
			MimeType:    "application/octet-stream",
			State:       1,
			Kind:        2,
			Driver:      1,
			HasBuildID:  "https://buildkite.com/berty/berty/builds/2738",
		}
		if err := db.Create(artifact).Error; err != nil {
			t.Fatalf("create artifact: %v", err)
		}
		// create build
		var build *yolopb.Build
		build = &yolopb.Build{
			ID:                "https://buildkite.com/berty/berty/builds/2738",
			YoloID:            "yolo1",
			State:             1,
			Message:           "feat: tests",
			Branch:            "feat/tests",
			Driver:            1,
			ShortID:           "1000",
			HasCommitID:       "commit1",
			HasProjectID:      "https://github.com/berty/berty",
			HasMergerequestID: "https://github.com/berty/berty/pull/2438",
		}
		if err := db.Create(build); err != nil {
			t.Fatalf("create build: %v", err)
		}

		return nil
	}); err != nil {
		t.Fatalf("create testing entities: %v", err)
	}
}
