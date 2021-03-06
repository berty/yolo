package yolosvc

import (
	"context"
	"testing"

	"berty.tech/yolo/v2/go/pkg/testutil"
	"berty.tech/yolo/v2/go/pkg/yolopb"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestServiceBuildList(t *testing.T) {
	svc, cleanup := TestingService(t, ServiceOpts{Logger: testutil.Logger(t)})
	defer cleanup()

	resp, err := svc.BuildList(context.Background(), &yolopb.BuildList_Request{
		Limit:              1,
		ArtifactKinds:      nil,
		WithArtifacts:      true,
		WithMergerequest:   false,
		WithNoMergerequest: false,
	})
	require.NoError(t, err)

	// artifact from data insert
	artifact := &yolopb.Artifact{
		ID:                  "artif1",
		YoloID:              "a:Hvi3qw8dU8boJzNfsoBX6i92NomXAAy2JLt3SJ9zydc7",
		FileSize:            80,
		LocalPath:           "js/packages/bla",
		MimeType:            "application/octet-stream",
		State:               1,
		Kind:                2,
		Driver:              1,
		HasBuildID:          "https://buildkite.com/berty/berty/builds/2738",
		DLArtifactSignedURL: "/api/artifact-dl/artif1?sign=08998d42d07339b70870e0e39043844c31831419",
		DownloadURL:         "https://api.buildkite.com",
		DownloadsCount:      1,
	}
	var artifacts []*yolopb.Artifact
	artifacts = append(artifacts, artifact)

	// entity expected data
	entity := &yolopb.Entity{
		ID:          "https://github.com/berty",
		YoloID:      "e:8oXfGsnFJiPXZ4uDPwMJ7SmNUTNSuQvkg5dkDq51j9Pj",
		Name:        "berty",
		Driver:      1,
		AvatarURL:   "https://avatars1.githubusercontent.com/u/22157871?v=4",
		Kind:        1,
		Description: "",
	}

	// project expected data
	project := &yolopb.Project{
		ID:          "https://github.com/berty/berty",
		YoloID:      "p:GG9RMxYQk1oVptrTJZ8JQCeBhzLmHDzQSuXfx8MydCT6",
		Driver:      1,
		Name:        "berty",
		Description: "Berty is a secure peer-to-peer messaging app that works with or without internet access, cellular data or trust in the network",
		HasOwnerID:  "https://github.com/berty",
		HasOwner:    entity,
	}

	// build from data insert
	build := &yolopb.Build{
		ID:                "https://buildkite.com/berty/berty/builds/2738",
		YoloID:            "b:n5SDir9UzvDbis4sYVB97f1EiAdnv784AAGWwZHWWkN",
		State:             1,
		Message:           "feat: tests",
		Branch:            "feat/tests",
		Driver:            1,
		ShortID:           "1000",
		HasArtifacts:      artifacts,
		HasCommitID:       "commit1",
		HasProjectID:      "https://github.com/berty/berty",
		HasMergerequestID: "https://github.com/berty/berty/pull/2438",
		HasProject:        project,
	}

	assert.Equal(t, 1, len(resp.Builds))
	assert.Equal(t, resp.Builds[0], build)
}
