package yolosvc

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"path/filepath"
	"regexp"

	"berty.tech/yolo/v2/go/pkg/yolopb"
)

var githubMasterMerge = regexp.MustCompile(`Merge pull request #([0-9]+) from (.*)`)

func artifactKindByPath(path string) yolopb.Artifact_Kind {
	switch filepath.Ext(path) {
	case ".ipa", ".unsigned-ipa", ".dummy-signed-ipa":
		return yolopb.Artifact_IPA
	case ".dmg", ".unsigned-dmg", ".dummy-signed-dmg":
		return yolopb.Artifact_DMG
	case ".apk":
		return yolopb.Artifact_APK
	}
	return yolopb.Artifact_UnknownKind
}

func mimetypeByPath(path string) string {
	switch filepath.Ext(path) {
	case ".ipa", ".unsigned-ipa", ".dummy-signed-ipa":
		return "application/octet-stream"
	case ".apk":
		return "application/vnd.android.package-archive"
	case ".dmg", ".unsigned-dmg", ".dummy-signed-dmg":
		return "application/x-apple-diskimage"
	case ".jar":
		return "application/java-archive"
	case ".txt":
		return "text/plain"
	case ".json":
		return "application/json"
	case ".zip":
		return "application/zip"
	case ".plist":
		return "application/x-plist"
	}
	return "application/octet-stream"
}

func md5Sum(input []byte) string {
	hasher := md5.New()
	_, _ = hasher.Write(input)
	return hex.EncodeToString(hasher.Sum(nil))
}

func guessMissingBuildInfo(build *yolopb.Build) {
	// try to guess the PR for GitHub builds based on commit message
	if build.HasMergerequestID == "" && build.Branch == "master" && build.HasProjectID != "" {
		// FIXME: check if the build.project.driver is GitHub
		matches := githubMasterMerge.FindAllStringSubmatch(build.Message, -1)
		if len(matches) == 1 && len(matches[0]) == 3 {
			pr := matches[0][1]
			build.HasMergerequestID = fmt.Sprintf("%s/pull/%s", build.HasProjectID, pr)
		}
	}
	if build.VCSTagURL == "" && build.VCSTag != "" && build.HasProjectID != "" {
		// FIXME: check if the build.project.driver is GitHub
		build.VCSTagURL = fmt.Sprintf("%s/tree/%s", build.HasProjectID, build.VCSTag)
	}
}
