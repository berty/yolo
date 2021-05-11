package yolostore

import (
	"crypto/sha256"
	"fmt"
	"strings"
	"testing"

	"berty.tech/yolo/v2/go/pkg/testutil"
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
	t.Helper()

	db, err := gorm.Open("sqlite3", "file::memory:?cache=shared")
	if err != nil {
		t.Fatalf("init in-memory sqlite server: %v", err)
	}

	logger := testutil.Logger(t)

	db, err = initDB(db, logger)
	if err != nil {
		t.Fatalf("init in-memory db: %v", err)
	}

	testingCreateEntities(t, db)

	return db
}

func testingCreateEntities(t *testing.T, db *gorm.DB) {
	t.Helper()

	if err := db.Transaction(func(tx *gorm.DB) error {

		// create artifact
		artifact := &yolopb.Artifact{
			ID:          "artif1",
			FileSize:    80,
			LocalPath:   "js/packages/bla",
			DownloadURL: "https://api.buildkite.com",
			MimeType:    "application/octet-stream",
			State:       1,
			Kind:        2,
			Driver:      1,
			HasBuildID:  "https://buildkite.com/berty/berty/builds/2738",
		}
		if err := tx.Create(artifact).Error; err != nil {
			return fmt.Errorf("failed to create artifact %w", err)
		}
		// create build
		build := &yolopb.Build{
			ID:                "https://buildkite.com/berty/berty/builds/2738",
			State:             1,
			Message:           "feat: tests",
			Branch:            "feat/tests",
			Driver:            1,
			ShortID:           "1000",
			HasCommitID:       "commit1",
			HasProjectID:      "https://github.com/berty/berty",
			HasMergerequestID: "https://github.com/berty/berty/pull/2438",
		}
		if err := tx.Create(build).Error; err != nil {
			return fmt.Errorf("failed to create build %w", err)
		}
		entity := &yolopb.Entity{
			ID:          "https://github.com/berty",
			YoloID:      "",
			Name:        "berty",
			Driver:      1,
			AvatarURL:   "https://avatars1.githubusercontent.com/u/22157871?v=4",
			Kind:        1,
			Description: "",
		}
		if err := tx.Create(entity).Error; err != nil {
			return fmt.Errorf("failed to create entity %w", err)
		}
		project := &yolopb.Project{
			ID:          "https://github.com/berty/berty",
			YoloID:      "",
			Driver:      1,
			Name:        "berty",
			Description: "Berty is a secure peer-to-peer messaging app that works with or without internet access, cellular data or trust in the network",
			HasOwnerID:  "https://github.com/berty",
		}
		if err := tx.Create(project).Error; err != nil {
			return fmt.Errorf("failed to create project %w", err)
		}
		return nil
	}); err != nil {
		t.Fatalf("create testing entities: %v", err)
	}
}
