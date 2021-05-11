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
		ID:          "entity1",
		YoloID:      "e:GYFZKgji4FRAFgDzrvD6gQiwfJubQsVTq653yGjGYP9d",
		Name:        "entity1",
		Driver:      1,
		AvatarURL:   "url",
		Kind:        1,
		Description: "description",
	}
	var projects []*yolopb.Project
	project := &yolopb.Project{
		ID:          "proj1",
		YoloID:      "p:CmRc5SFoS5ebh8g5USzMBBRzAToku7mit2F8qSbN6nxe",
		Driver:      1,
		Name:        "proj1",
		Description: "description",
		HasOwnerID:  "1",
	}
	expResp := &yolopb.BuildListFilters_Response{
		Entities: append(entities, entity),
		Projects: append(projects, project),
	}

	assert.Equal(t, expResp, resp)
}
