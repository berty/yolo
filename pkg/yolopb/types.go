package yolopb

// Cleanup cleans unnecessary info that can lead to infinite loop
func (b *Build) Cleanup() {
	for _, artifact := range b.HasArtifacts {
		artifact.HasBuild = nil
	}
}

// Cleanup cleans unnecessary info that can lead to infinite loop
func (a *Artifact) Cleanup() {
	a.HasBuild.HasArtifacts = nil
}
