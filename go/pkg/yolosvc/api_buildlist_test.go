package yolosvc

import (
	"context"
	"testing"

	"berty.tech/yolo/v2/go/pkg/testutil"
	"berty.tech/yolo/v2/go/pkg/yolopb"
	"github.com/stretchr/testify/assert"
)

func TestBuildList(t *testing.T) {
	svc, cleanup := TestingService(t, ServiceOpts{Logger: testutil.Logger(t)})
	defer cleanup()

	resp, err := svc.BuildList(context.Background(), nil)
	assert.Nil(t, err)

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
	}
	var artifacts []*yolopb.Artifact
	artifacts = append(artifacts, artifact)

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
	}

	assert.Equal(t, len(resp.Builds), 1)
	assert.Equal(t, resp.Builds[0], build)
}
