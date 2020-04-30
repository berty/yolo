package yolopb

import (
	"net/url"

	"github.com/stretchr/signature"
)

// AddSignedURLs adds new fields containing URLs with a signature
func (b *Build) AddSignedURLs(key string) error {
	for _, artifact := range b.HasArtifacts {
		if err := artifact.AddSignedURLs(key); err != nil {
			return err
		}
	}

	return nil
}

// AddSignedURLs adds new fields containing URLs with a signature
func (a *Artifact) AddSignedURLs(key string) error {

	var err error
	a.DLArtifactSignedURL, err = signature.GetSignedURL("GET", "/api/artifact-dl/"+a.ID, "", key)
	if err != nil {
		return err
	}
	if a.Kind == Artifact_IPA {
		a.PListSignedURL, err = signature.GetSignedURL("GET", "/api/plist-gen/"+a.ID+".plist", "", key)
		if err != nil {
			return nil
		}
		a.PListSignedURL = url.QueryEscape(a.PListSignedURL)
	}
	return nil
}
