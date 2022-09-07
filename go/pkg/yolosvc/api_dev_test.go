package yolosvc

import (
	"context"
	"testing"

	"berty.tech/yolo/v2/go/pkg/testutil"
	"berty.tech/yolo/v2/go/pkg/yolopb"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestServiceDevDumpObjects(t *testing.T) {
	svc, cleanup := TestingService(t, ServiceOpts{Logger: testutil.Logger(t)})
	defer cleanup()

	resp, err := svc.DevDumpObjects(context.Background(), &yolopb.DevDumpObjects_Request{})
	require.NoError(t, err)

	expectedBuilds := []*yolopb.Build{
		{
			ID:                "https://buildkite.com/berty/berty/builds/2738",
			YoloID:            "b:n5SDir9UzvDbis4sYVB97f1EiAdnv784AAGWwZHWWkN",
			State:             1,
			Message:           "feat: tests",
			Branch:            "feat/tests",
			Driver:            1,
			ShortID:           "1000",
			HasCommitID:       "commit1",
			HasProjectID:      "https://github.com/berty/berty",
			HasMergerequestID: "https://github.com/berty/berty/pull/2438",
		},
	}
	expectedArtifacts := []*yolopb.Artifact{
		{
			YoloID:      "a:Hvi3qw8dU8boJzNfsoBX6i92NomXAAy2JLt3SJ9zydc7",
			ID:          "artif1",
			FileSize:    80,
			LocalPath:   "js/packages/bla",
			DownloadURL: "https://api.buildkite.com",
			MimeType:    "application/octet-stream",
			State:       1,
			Kind:        2,
			Driver:      1,
			HasBuildID:  "https://buildkite.com/berty/berty/builds/2738",
		},
	}
	expectedDownloads := []*yolopb.Download{
		{
			ID:            1,
			HasArtifactID: "artif1",
		},
	}
	expectedEntities := []*yolopb.Entity{
		{
			ID:          "https://github.com/berty",
			YoloID:      "e:8oXfGsnFJiPXZ4uDPwMJ7SmNUTNSuQvkg5dkDq51j9Pj",
			Name:        "berty",
			Driver:      1,
			AvatarURL:   "https://avatars1.githubusercontent.com/u/22157871?v=4",
			Kind:        1,
			Description: "",
		},
	}
	expectedProjects := []*yolopb.Project{
		{
			ID:          "https://github.com/berty/berty",
			YoloID:      "p:GG9RMxYQk1oVptrTJZ8JQCeBhzLmHDzQSuXfx8MydCT6",
			Driver:      1,
			Name:        "berty",
			Description: "Berty is a secure peer-to-peer messaging app that works with or without internet access, cellular data or trust in the network",
			HasOwnerID:  "https://github.com/berty",
		},
	}
	expectedCommits := []*yolopb.Commit{
		{
			YoloID:  "c:GKot5hBsd81kMupNCXHaqbhv3huEbxAFMLnpcX2hniwn",
			Message: "fix: test",
			Driver:  1,
			Branch:  "chore/tests",
		},
	}
	expectedMergeRequests := []*yolopb.MergeRequest{
		{
			YoloID:       "m:GKot5hBsd81kMupNCXHaqbhv3huEbxAFMLnpcX2hniwn",
			Title:        "Storage Interface",
			Message:      "Implement Storage Interface",
			Driver:       1,
			Branch:       "Name/feat/storage-interface",
			State:        3,
			CommitURL:    "https://github.com/berty/berty/commit/0831f0e0c65f431976f1307757484ec8e6ae7feb",
			BranchURL:    "",
			ShortID:      "2413",
			IsWIP:        false,
			HasProjectID: "https://github.com/berty/berty",
			HasAuthor:    nil,
			HasAuthorID:  "https://github.com/Dzalevski",
			HasCommitID:  "\x01",
		},
	}
	expectedRelases := []*yolopb.Release{
		{
			YoloID:    "r:GKot5hBsd81kMupNCXHaqbhv3huEbxAFMLnpcX2hniwn",
			Message:   "Implemented Storage Interface",
			Driver:    1,
			CommitURL: "https://github.com/berty/berty/commit/0831f0e0c65f431976f1307757484ec8e6ae7feb",
			ShortID:   "2341",
		},
	}

	expectedBatch := &yolopb.Batch{
		Builds:        expectedBuilds,
		Artifacts:     expectedArtifacts,
		Projects:      expectedProjects,
		Entities:      expectedEntities,
		Releases:      expectedRelases,
		Commits:       expectedCommits,
		MergeRequests: expectedMergeRequests,
	}

	assert.Equal(t, expectedDownloads, resp.Downloads)
	assert.Equal(t, expectedBatch, resp.Batch)
}

func TestServiceDevDumpObjects_withPreloading(t *testing.T) {
	svc, cleanup := TestingService(t, ServiceOpts{Logger: testutil.Logger(t)})
	defer cleanup()

	resp, err := svc.DevDumpObjects(context.Background(), &yolopb.DevDumpObjects_Request{WithPreloading: true})
	require.NoError(t, err)

	expectedDownloads := []*yolopb.Download{
		{
			ID:            1,
			HasArtifactID: "artif1",
		},
	}

	projectWithoutEntity := &yolopb.Project{
		ID:          "https://github.com/berty/berty",
		YoloID:      "p:GG9RMxYQk1oVptrTJZ8JQCeBhzLmHDzQSuXfx8MydCT6",
		Driver:      1,
		Name:        "berty",
		Description: "Berty is a secure peer-to-peer messaging app that works with or without internet access, cellular data or trust in the network",
		HasOwnerID:  "https://github.com/berty",
	}

	entity := &yolopb.Entity{
		ID:          "https://github.com/berty",
		YoloID:      "e:8oXfGsnFJiPXZ4uDPwMJ7SmNUTNSuQvkg5dkDq51j9Pj",
		Name:        "berty",
		Driver:      1,
		AvatarURL:   "https://avatars1.githubusercontent.com/u/22157871?v=4",
		Kind:        1,
		Description: "",
	}
	expectedEntities := []*yolopb.Entity{entity}
	project := &yolopb.Project{
		ID:          "https://github.com/berty/berty",
		YoloID:      "p:GG9RMxYQk1oVptrTJZ8JQCeBhzLmHDzQSuXfx8MydCT6",
		Driver:      1,
		Name:        "berty",
		Description: "Berty is a secure peer-to-peer messaging app that works with or without internet access, cellular data or trust in the network",
		HasOwnerID:  "https://github.com/berty",
		HasOwner:    entity,
	}
	build := &yolopb.Build{
		ID:                "https://buildkite.com/berty/berty/builds/2738",
		YoloID:            "b:n5SDir9UzvDbis4sYVB97f1EiAdnv784AAGWwZHWWkN",
		State:             1,
		Message:           "feat: tests",
		Branch:            "feat/tests",
		Driver:            1,
		ShortID:           "1000",
		HasCommitID:       "commit1",
		HasProjectID:      "https://github.com/berty/berty",
		HasMergerequestID: "https://github.com/berty/berty/pull/2438",
		HasProject:        projectWithoutEntity,
	}
	expectedBuilds := []*yolopb.Build{build}

	expectedProjects := []*yolopb.Project{project}
	commit := &yolopb.Commit{
		YoloID:  "c:GKot5hBsd81kMupNCXHaqbhv3huEbxAFMLnpcX2hniwn",
		Message: "fix: test",
		Driver:  1,
		Branch:  "chore/tests",
	}
	expectedCommits := []*yolopb.Commit{commit}
	mergeRequest := &yolopb.MergeRequest{
		YoloID:       "m:GKot5hBsd81kMupNCXHaqbhv3huEbxAFMLnpcX2hniwn",
		Title:        "Storage Interface",
		Message:      "Implement Storage Interface",
		Driver:       1,
		Branch:       "Name/feat/storage-interface",
		State:        3,
		CommitURL:    "https://github.com/berty/berty/commit/0831f0e0c65f431976f1307757484ec8e6ae7feb",
		BranchURL:    "",
		ShortID:      "2413",
		IsWIP:        false,
		HasProjectID: "https://github.com/berty/berty",
		HasAuthor:    nil,
		HasAuthorID:  "https://github.com/Dzalevski",
		HasCommitID:  "\x01",
		HasProject:   projectWithoutEntity,
	}
	expectedMergeRequests := []*yolopb.MergeRequest{mergeRequest}
	expectedRelases := []*yolopb.Release{
		{
			YoloID:    "r:GKot5hBsd81kMupNCXHaqbhv3huEbxAFMLnpcX2hniwn",
			Message:   "Implemented Storage Interface",
			Driver:    1,
			CommitURL: "https://github.com/berty/berty/commit/0831f0e0c65f431976f1307757484ec8e6ae7feb",
			ShortID:   "2341",
		},
	}

	expectedArtifacts := []*yolopb.Artifact{
		{
			YoloID:      "a:Hvi3qw8dU8boJzNfsoBX6i92NomXAAy2JLt3SJ9zydc7",
			ID:          "artif1",
			FileSize:    80,
			LocalPath:   "js/packages/bla",
			DownloadURL: "https://api.buildkite.com",
			MimeType:    "application/octet-stream",
			State:       1,
			Kind:        2,
			Driver:      1,
			HasBuildID:  "https://buildkite.com/berty/berty/builds/2738",
			HasBuild:    build,
		},
	}

	expectedBatch := &yolopb.Batch{
		Builds:        expectedBuilds,
		Artifacts:     expectedArtifacts,
		Projects:      expectedProjects,
		Entities:      expectedEntities,
		Releases:      expectedRelases,
		Commits:       expectedCommits,
		MergeRequests: expectedMergeRequests,
	}

	assert.Equal(t, expectedDownloads, resp.Downloads)
	assert.Equal(t, expectedBatch, resp.Batch)
}
