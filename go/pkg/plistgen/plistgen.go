package plistgen

import (
	"howett.net/plist"
)

const (
	KindSoftwarePackage = "software-package"
	KindSoftware        = "software"
	KindDisplayImage    = "display-image"
	KindFullSizeImage   = "full-size-image"
)

func Release(bundleID, ipaURL string) ApplePlistRelease {
	return ApplePlistRelease{
		Items: []*ApplePlistItem{
			{
				Assets: []*ApplePlistAsset{
					{
						Kind: KindSoftwarePackage,
						URL:  ipaURL,
					},
				},
				Metadata: &ApplePlistMetadata{
					BundleIdentifier: bundleID,
					Kind:             KindSoftware,
					Title:            "YOLO",
					Subtitle:         "YOLO",
				},
			},
		},
	}
}

type ApplePlistRelease struct {
	Items []*ApplePlistItem `plist:"items"`
}

func (r *ApplePlistRelease) SetTitle(title string) {
	r.Items[0].Metadata.Title = title
}

func (r *ApplePlistRelease) SetSubtitle(subtitle string) {
	r.Items[0].Metadata.Subtitle = subtitle
}

func (r *ApplePlistRelease) SetVersion(version string) {
	r.Items[0].Metadata.BundleVersion = version
}

func (r *ApplePlistRelease) SetDisplayImage(url string, needsShine bool) {
	// FIXME: check if existing
	r.Items[0].Assets = append(
		r.Items[0].Assets,
		&ApplePlistAsset{
			Kind:       KindDisplayImage,
			URL:        url,
			NeedsShine: needsShine,
		},
	)
}

func (r *ApplePlistRelease) SetFullSizeImage(url string, needsShine bool) {
	// FIXME: check if existing
	r.Items[0].Assets = append(
		r.Items[0].Assets,
		&ApplePlistAsset{
			Kind:       KindFullSizeImage,
			URL:        url,
			NeedsShine: needsShine,
		},
	)
}

func (r *ApplePlistRelease) Marshal() ([]byte, error) {
	return plist.MarshalIndent(r, plist.XMLFormat, "\t")
}

type ApplePlistAsset struct {
	Kind       string   `plist:"kind"`
	URL        string   `plist:"url"`
	MD5        string   `plist:"md5,omitempty"`
	MD5Size    int      `plist:"md5-size,omitempty"`
	MD5s       []string `plist:"md5s,omitempty"`
	NeedsShine bool     `plist:"needs-shine,omitempty"`
}

type ApplePlistMetadata struct {
	BundleIdentifier string `plist:"bundle-identifier"`
	BundleVersion    string `plist:"bundle-version"`
	Kind             string `plist:"kind"`
	Title            string `plist:"title"`
	Subtitle         string `plist:"subtitle,omitempty"`
}

type ApplePlistItem struct {
	Assets   []*ApplePlistAsset  `plist:"assets"`
	Metadata *ApplePlistMetadata `plist:"metadata"`
}
