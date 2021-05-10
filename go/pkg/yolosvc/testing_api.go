package yolosvc

import (
	"testing"

	"berty.tech/yolo/v2/go/pkg/yolopb"
	"berty.tech/yolo/v2/go/pkg/yolostore"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

func TestingService(t *testing.T, opts ServiceOpts) (Service, func()) {
	t.Helper()

	if opts.Logger == nil {
		opts.Logger = zap.NewNop()
	}

	db := yolostore.TestingDB(t)

	api, err := NewService(db, opts)
	if err != nil {
		t.Fatalf("init api: %v", err)
	}

	cleanup := func() {
		db.Close()
	}

	return api, cleanup
}

func testingBuilds(t *testing.T, svc Service) []*yolopb.Build {
	store := testingSvcDB(t, svc)
	var build yolopb.Build
	var builds []*yolopb.Build
	err := store.DB().Preload("HasArtifacts").Find(&build).Error
	assert.Nil(t, err)
	builds = append(builds, &build)
	return builds
}

func testingSvcDB(t *testing.T, svc Service) yolostore.Store {
	t.Helper()

	typed := svc.(*service)
	return typed.store
}
