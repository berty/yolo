package yolosvc

import (
	"crypto/md5"
	"encoding/hex"
	"path/filepath"

	"berty.tech/yolo/v2/pkg/yolopb"
)

func artifactKindByPath(path string) yolopb.Artifact_Kind {
	switch filepath.Ext(path) {
	case ".ipa":
		return yolopb.Artifact_IPA
	case ".dmg":
		return yolopb.Artifact_DMG
	case ".apk":
		return yolopb.Artifact_APK
	}
	return yolopb.Artifact_UnknownKind
}

func mimetypeByPath(path string) string {
	switch filepath.Ext(path) {
	case ".ipa":
		return "application/octet-stream"
	case ".apk":
		return "application/vnd.android.package-archive"
	case ".dmg":
		return "application/x-apple-diskimage"
	case ".jar":
		return "application/java-archive"
	case ".txt":
		return "text/plain"
	case ".json":
		return "application/json"
	case ".zip":
		return "application/zip"
	}
	return "application/octet-stream"
}

func md5Sum(input string) string {
	hasher := md5.New()
	_, _ = hasher.Write([]byte(input))
	return hex.EncodeToString(hasher.Sum(nil))
}
