package server

import "howett.net/plist"

var ApplePlistHeader = `
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
//"http://www.apple.com/DTDs/PropertyList-1.0.dtd">
`

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

type ApplePlistRelease struct {
	Items []*ApplePlistItem
}

func NewPlistRelease(bundle, version, title, url string) ([]byte, error) {
	meta := &ApplePlistMetadata{
		BundleIdentifier: bundle,
		BundleVersion:    version,
		Kind:             "software",
		Title:            title,
	}

	assets := []*ApplePlistAsset{
		&ApplePlistAsset{
			Kind: "software-package",
			URL:  url,
		},
	}

	items := []*ApplePlistItem{
		&ApplePlistItem{
			Assets:   assets,
			Metadata: meta,
		},
	}

	release := &ApplePlistRelease{
		Items: items,
	}

	return plist.MarshalIndent(release, plist.XMLFormat, "\t")
}
