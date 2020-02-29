package yolo

// cleanup cleans unnecessary info that can lead to infinite loop
func (b *Build) cleanup() {
	for _, artifact := range b.HasArtifacts {
		artifact.HasBuild = nil
	}
}

// cleanup cleans unnecessary info that can lead to infinite loop
func (a *Artifact) cleanup() {
	a.HasBuild.HasArtifacts = nil
}
