package plistgen

import (
	"howett.net/plist"
)

func Release(bundleID, version, title, url string) ([]byte, error) {
	release := &ApplePlistRelease{
		Items: []*ApplePlistItem{
			{
				Assets: []*ApplePlistAsset{
					{
						Kind: "software-package",
						URL:  url,
					},
				},
				Metadata: &ApplePlistMetadata{
					BundleIdentifier: bundleID,
					BundleVersion:    version,
					Kind:             "software",
					Title:            title,
				},
			},
		},
	}
	return plist.MarshalIndent(release, plist.XMLFormat, "\t")
}

type ApplePlistRelease struct {
	Items []*ApplePlistItem `plist:"items"`
}

type ApplePlistAsset struct {
	Kind string `plist:"kind"`
	URL  string `plist:"url"` // kind, url
}

type ApplePlistMetadata struct {
	BundleIdentifier string `plist:"bundle-identifier"`
	BundleVersion    string `plist:"bundle-version"`
	Kind             string `plist:"kind"`
	Title            string `plist:"title"`
}

type ApplePlistItem struct {
	Assets   []*ApplePlistAsset  `plist:"assets"`
	Metadata *ApplePlistMetadata `plist:"metadata"`
}
