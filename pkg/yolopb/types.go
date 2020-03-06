package yolopb

import (
	"net/url"

	"github.com/stretchr/signature"
)

// Cleanup cleans unnecessary info that can lead to infinite loop
func (b *Build) Cleanup() {
	for _, artifact := range b.HasArtifacts {
		artifact.HasBuild = nil
	}
}

// AddSignedURLs adds new fields containing URLs with a signature
func (b *Build) AddSignedURLs(key string) error {
	for _, artifact := range b.HasArtifacts {
		if err := artifact.AddSignedURLs(key); err != nil {
			return err
		}
	}

	return nil
}

// Cleanup cleans unnecessary info that can lead to infinite loop
func (a *Artifact) Cleanup() {
	a.HasBuild.HasArtifacts = nil
}

// AddSignedURLs adds new fields containing URLs with a signature
func (a *Artifact) AddSignedURLs(key string) error {

	var err error
	a.DLArtifactSignedURL, err = signature.GetSignedURL("GET", "/api/artifact-dl/"+string(a.ID), "", key)
	if err != nil {
		return err
	}
	if a.Kind == Artifact_IPA {
		a.PListSignedURL, err = signature.GetSignedURL("GET", "/api/plist-gen/"+string(a.ID)+".plist", "", key)
		if err != nil {
			return nil
		}
		a.PListSignedURL = url.QueryEscape(a.PListSignedURL)
	}
	return nil
}
