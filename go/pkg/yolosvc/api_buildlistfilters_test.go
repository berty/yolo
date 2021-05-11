package yolosvc

import (
	"context"
	"testing"

	"berty.tech/yolo/v2/go/pkg/testutil"
	"berty.tech/yolo/v2/go/pkg/yolopb"
	"github.com/stretchr/testify/assert"
)

func TestBuildListFilters(t *testing.T) {
	svc, cleanup := TestingService(t, ServiceOpts{Logger: testutil.Logger(t)})
	defer cleanup()

	resp, err := svc.BuildListFilters(context.Background(), nil)
	assert.Nil(t, err)

	var entities []*yolopb.Entity
	entity := &yolopb.Entity{
		ID:          "https://github.com/berty",
		YoloID:      "e:8oXfGsnFJiPXZ4uDPwMJ7SmNUTNSuQvkg5dkDq51j9Pj",
		Name:        "berty",
		Driver:      1,
		AvatarURL:   "https://avatars1.githubusercontent.com/u/22157871?v=4",
		Kind:        1,
		Description: "",
	}
	var projects []*yolopb.Project
	project := &yolopb.Project{
		ID:          "https://github.com/berty/berty",
		YoloID:      "p:GG9RMxYQk1oVptrTJZ8JQCeBhzLmHDzQSuXfx8MydCT6",
		Driver:      1,
		Name:        "berty",
		Description: "Berty is a secure peer-to-peer messaging app that works with or without internet access, cellular data or trust in the network",
		HasOwnerID:  "https://github.com/berty",
		HasOwner:    entity,
	}
	expResp := &yolopb.BuildListFilters_Response{
		Entities: append(entities, entity),
		Projects: append(projects, project),
	}

	assert.Equal(t, expResp, resp)
}
