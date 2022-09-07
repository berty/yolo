package yolosvc

import (
	"fmt"
	"math/rand"
	"net/http"
	"strings"

	"berty.tech/yolo/v2/go/pkg/plistgen"
	"github.com/go-chi/chi"
	"github.com/stretchr/signature"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"
	"google.golang.org/grpc/codes"
)

func (svc *service) PlistGenerator(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "artifactID")

	artifact, err := svc.store.GetArtifactByID(id)
	if err != nil {
		httpError(w, err, codes.InvalidArgument)
		return
	}

	scheme := r.Header.Get("X-Forwarded-Proto")
	if scheme == "" {
		scheme = "http"
	}
	baseURL := fmt.Sprintf("%s://%s", scheme, r.Host)
	var (
		bundleID      = "tech.berty.yolo"
		title         = ""
		subtitle      = ""
		version       = ""
		displayImage  = baseURL + "/bundle-57x57.png"
		fullSizeImage = baseURL + "/bundle-512x512.png"
		url           = "/api/artifact-dl/" + id
	)
	if artifact.HasBuild != nil && artifact.HasBuild.HasProject != nil {
		c := cases.Title(language.Und)
		title = c.String(artifact.HasBuild.HasProject.Name)
		if artifact.HasBuild.HasProject.HasOwner != nil {
			subtitle = c.String(artifact.HasBuild.HasProject.HasOwner.Name)
		}
	}
	pkgURL, err := signature.GetSignedURL("GET", url, "", svc.authSalt)
	if err != nil {
		httpError(w, err, codes.Internal)
		return
	}

	// override with extracted data from artifact
	if artifact.BundleID != "" {
		bundleID = artifact.BundleID
	}
	if artifact.BundleName != "" {
		title = artifact.BundleName
	}
	if artifact.BundleIcon != "" {
		displayImageURL := "/api/artifact-icon/" + artifact.BundleIcon
		signedURL, err := signature.GetSignedURL("GET", displayImageURL, "", svc.authSalt)
		if err != nil {
			httpError(w, err, codes.Internal)
			return
		}
		displayImage = baseURL + signedURL
	}

	// append random emojis
	title = strings.TrimSpace(title + " " + randEmoji())
	subtitle = strings.TrimSpace(subtitle + " " + randEmoji())

	plist := plistgen.Release(bundleID, baseURL+pkgURL)
	plist.SetTitle(title)
	plist.SetSubtitle(subtitle)
	plist.SetDisplayImage(displayImage, false)
	plist.SetFullSizeImage(fullSizeImage, false)
	plist.SetVersion(version)
	b, err := plist.Marshal()
	if err != nil {
		httpError(w, err, codes.Internal)
		return
	}
	w.Header().Add("Content-Type", "application/x-plist")
	_, _ = w.Write(b)
}

func randEmoji() string {
	list := []string{"😱", "🤡", "🧚‍♀️", "🥰", "🙌"}
	return list[rand.Intn(len(list))]
}
