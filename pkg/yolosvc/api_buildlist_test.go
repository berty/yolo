package yolosvc

import (
	"context"
	"fmt"
	"io/ioutil"
	"testing"

	"berty.tech/yolo/v2/pkg/testutil"
	"berty.tech/yolo/v2/pkg/yolopb"
	"github.com/stretchr/testify/assert"
	"moul.io/godev"
)

func TestServiceBuildList(t *testing.T) {
	tests := []struct {
		golden      string
		name        string
		filters     *yolopb.BuildList_Request
		expectedErr error
	}{
		{"berty-all", "no-filter", &yolopb.BuildList_Request{}, nil},
		{"berty-all", "artifact-kind-ipa", &yolopb.BuildList_Request{ArtifactKind: yolopb.Artifact_IPA}, nil},
		{"berty-all", "artifact-kind-apk", &yolopb.BuildList_Request{ArtifactKind: yolopb.Artifact_APK}, nil},
	}

	alreadySeen := map[string]bool{}
	for _, testptr := range tests {
		test := testptr
		name := fmt.Sprintf("%s/%s", test.golden, test.name)
		gp := TestingGoldenJSONPath(t, name)
		if _, found := alreadySeen[gp]; found {
			t.Fatalf("duplicate key: %q (golden files conflict)", gp)
		}

		t.Run(name, func(t *testing.T) {
			t.Parallel()
			store, close := TestingGoldenStore(t, "berty-all")
			defer close()
			svc := TestingService(t, store, schemaConfig)

			ret, err := svc.BuildList(context.Background(), test.filters)
			assert.Equal(t, test.expectedErr, err, name)
			if err != nil {
				return
			}

			actual := godev.JSON(test.filters) + "\n"
			for _, build := range ret.Builds {
				actual += godev.JSON(build) + "\n"
			}

			if testutil.UpdateGolden() {
				t.Logf("update golden file: %s", gp)
				err := ioutil.WriteFile(gp, []byte(actual), 0644)
				assert.NoError(t, err, name)
			}

			// check for duplicate builds
			{
				duplicateMap := map[string]int{}
				hasDuplicates := false
				for _, build := range ret.Builds {
					if _, found := duplicateMap[string(build.ID)]; !found {
						duplicateMap[string(build.ID)] = 0
					} else {
						hasDuplicates = true
					}
					duplicateMap[string(build.ID)]++
				}
				if !assert.False(t, hasDuplicates) {
					fmt.Println(godev.PrettyJSON(duplicateMap))
				}
			}

			// check artifact kind filter
			if test.filters.ArtifactKind != yolopb.Artifact_UnknownKind {
				for _, build := range ret.Builds {
					for _, artifact := range build.HasArtifacts {
						assert.Equal(t,
							artifact.Kind,
							test.filters.ArtifactKind,
							name+"/"+string(artifact.ID),
						)
					}
				}
			}

			g, err := ioutil.ReadFile(gp)
			assert.NoError(t, err, name)
			assert.Equal(t, len(string(g)), len(actual), gp)
			assert.Equal(t, string(g), actual)
		})
	}
}
