package yolosvc

import (
	"fmt"
	"net/http/httptest"
	"testing"

	"berty.tech/yolo/v2/go/pkg/testutil"
)

func TestArtifactGetFile(t *testing.T) {
	svc, cleanup := TestingService(t, ServiceOpts{Logger: testutil.Logger(t)})
	defer cleanup()

	path := "/artifact-get-file/%s"

	w := httptest.NewRecorder()
	r := httptest.NewRequest("GET", fmt.Sprintf(path, "artif1"), nil)
	svc.ArtifactGetFile(w, r)

	fmt.Println(w.Body.String())

}
