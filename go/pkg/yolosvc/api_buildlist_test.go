package yolosvc

import (
	"context"
	"testing"

	"berty.tech/yolo/v2/go/pkg/testutil"
	"github.com/stretchr/testify/assert"
)

func TestBuildList(t *testing.T) {
	svc, cleanup := TestingService(t, ServiceOpts{Logger: testutil.Logger(t)})
	defer cleanup()

	resp, err := svc.BuildList(context.Background(), nil)
	assert.Nil(t, err)
	builds := testingBuilds(t, svc)

	assert.Equal(t, builds[0].ID, resp.Builds[0].ID)
	assert.Equal(t, builds[0].Driver, resp.Builds[0].Driver)
	assert.Equal(t, builds[0].CommitURL, resp.Builds[0].CommitURL)
}
