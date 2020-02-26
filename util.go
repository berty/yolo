package yolo

import (
	"crypto/md5"
	"encoding/hex"
	"path/filepath"
)

func artifactKindByPath(path string) Artifact_Kind {
	switch filepath.Ext(path) {
	case ".ipa":
		return Artifact_IPA
	case ".dmg":
		return Artifact_DMG
	case ".apk":
		return Artifact_APK
	}
	return Artifact_UnknownKind
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
