package yolosvc

import (
	"testing"

	"berty.tech/yolo/v2/go/pkg/yolostore"
	"go.uber.org/zap"
)

func TestingService(t *testing.T, opts ServiceOpts) (Service, func()) {
	t.Helper()

	opts.DevMode = true

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
