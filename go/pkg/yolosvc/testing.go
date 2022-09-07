package yolosvc

import (
	"fmt"
	"testing"

	"berty.tech/yolo/v2/go/pkg/testutil"
	"berty.tech/yolo/v2/go/pkg/yolopb"
	"berty.tech/yolo/v2/go/pkg/yolostore"

	"github.com/jinzhu/gorm"
	"go.uber.org/zap"
)

func TestingService(t *testing.T, opts ServiceOpts) (Service, func()) {
	t.Helper()

	opts.DevMode = true

	if opts.Logger == nil {
		opts.Logger = zap.NewNop()
	}

	db := testingDB(t)

	api, err := NewService(db, opts)
	if err != nil {
		t.Fatalf("init api: %v", err)
	}

	cleanup := func() {
		db.Close()
	}

	return api, cleanup
}

func testingDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open("sqlite3", "file::memory:?cache=shared")
	if err != nil {
		t.Fatalf("init in-memory sqlite server: %v", err)
	}

	logger := testutil.Logger(t)

	store, err := yolostore.NewStore(db, logger)
	if err != nil {
		t.Fatalf("init in-memory db: %v", err)
	}
	db = store.DB()
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
		err := tx.Create(artifact).Error
		if err != nil {
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
		err = tx.Create(build).Error
		if err != nil {
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
		err = tx.Create(entity).Error
		if err != nil {
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
		err = tx.Create(project).Error
		if err != nil {
			return fmt.Errorf("failed to create project %w", err)
		}

		download := &yolopb.Download{
			HasArtifact: artifact,
		}
		err = tx.Create(download).Error
		if err != nil {
			return fmt.Errorf("failed to create download %w", err)
		}

		commit := &yolopb.Commit{
			Message:    "fix: test",
			Driver:     1,
			Branch:     "chore/tests",
			HasBuilds:  append([]*yolopb.Build{}, build),
			HasProject: project,
			HasAuthor:  entity,
		}
		err = tx.Create(commit).Error
		if err != nil {
			return fmt.Errorf("failed to create commit %w", err)
		}

		mergerequest := &yolopb.MergeRequest{
			Title:        "Storage Interface",
			Message:      "Implement Storage Interface",
			Driver:       1,
			Branch:       "Name/feat/storage-interface",
			State:        3,
			CommitURL:    "https://github.com/berty/berty/commit/0831f0e0c65f431976f1307757484ec8e6ae7feb",
			BranchURL:    "",
			ShortID:      "2413",
			IsWIP:        false,
			HasBuilds:    append([]*yolopb.Build{}, build),
			HasAssignees: append([]*yolopb.Entity{}, entity),
			HasReviewers: append([]*yolopb.Entity{}, entity),
			HasProject:   project,
			HasProjectID: "https://github.com/berty/berty",
			HasAuthor:    nil,
			HasAuthorID:  "https://github.com/Dzalevski",
			HasCommit:    commit,
			HasCommitID:  "578800a41fce965b4e1af28f42412b053238da34",
		}
		err = tx.Create(mergerequest).Error
		if err != nil {
			return fmt.Errorf("failed to create merge request %w", err)
		}

		relase := &yolopb.Release{
			Message:         "Implemented Storage Interface",
			Driver:          1,
			CommitURL:       "https://github.com/berty/berty/commit/0831f0e0c65f431976f1307757484ec8e6ae7feb",
			ShortID:         "2341",
			HasArtifacts:    append([]*yolopb.Artifact{}, artifact),
			HasCommit:       commit,
			HasProject:      project,
			HasMergerequest: mergerequest,
		}

		err = tx.Create(relase).Error
		if err != nil {
			return fmt.Errorf("failed to create relase %w", err)
		}

		return nil
	}); err != nil {
		t.Fatalf("create testing entities: %v", err)
	}
}
