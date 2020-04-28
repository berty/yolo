package yolopb

func NewBatch() *Batch {
	return &Batch{
		Builds:        []*Build{},
		Projects:      []*Project{},
		MergeRequests: []*MergeRequest{},
		Artifacts:     []*Artifact{},
		Commits:       []*Commit{},
		Entities:      []*Entity{},
		Releases:      []*Release{},
	}
}

func (b *Batch) Empty() bool {
	return len(b.Projects) == 0 &&
		len(b.Artifacts) == 0 &&
		len(b.Builds) == 0 &&
		len(b.Releases) == 0 &&
		len(b.MergeRequests) == 0 &&
		len(b.Entities) == 0 &&
		len(b.Commits) == 0
}

func (b *Batch) Merge(n *Batch) {
	b.Projects = append(b.Projects, n.Projects...)
	b.Builds = append(b.Builds, n.Builds...)
	b.MergeRequests = append(b.MergeRequests, n.MergeRequests...)
	b.Artifacts = append(b.Artifacts, n.Artifacts...)
	b.Commits = append(b.Commits, n.Commits...)
	b.Entities = append(b.Entities, n.Entities...)
	b.Releases = append(b.Releases, n.Releases...)
}

func (b *Batch) Optimize() {
	uniqueProjects := map[string]*Project{}
	for _, project := range b.Projects {
		uniqueProjects[project.ID] = project
	}
	b.Projects = make([]*Project, len(uniqueProjects))
	i := 0
	for _, project := range uniqueProjects {
		b.Projects[i] = project
		i++
	}

	uniqueBuilds := map[string]*Build{}
	for _, build := range b.Builds {
		uniqueBuilds[build.ID] = build
	}
	b.Builds = make([]*Build, len(uniqueBuilds))
	i = 0
	for _, build := range uniqueBuilds {
		b.Builds[i] = build
		i++
	}

	uniqueReleases := map[string]*Release{}
	for _, release := range b.Releases {
		uniqueReleases[release.ID] = release
	}
	b.Releases = make([]*Release, len(uniqueReleases))
	i = 0
	for _, release := range uniqueReleases {
		b.Releases[i] = release
		i++
	}

	uniqueMergeRequests := map[string]*MergeRequest{}
	for _, mergeRequest := range b.MergeRequests {
		uniqueMergeRequests[mergeRequest.ID] = mergeRequest
	}
	b.MergeRequests = make([]*MergeRequest, len(uniqueMergeRequests))
	i = 0
	for _, mergeRequest := range uniqueMergeRequests {
		b.MergeRequests[i] = mergeRequest
		i++
	}

	uniqueArtifacts := map[string]*Artifact{}
	for _, artifact := range b.Artifacts {
		uniqueArtifacts[artifact.ID] = artifact
	}
	b.Artifacts = make([]*Artifact, len(uniqueArtifacts))
	i = 0
	for _, artifact := range uniqueArtifacts {
		b.Artifacts[i] = artifact
		i++
	}

	uniqueCommits := map[string]*Commit{}
	for _, commit := range b.Commits {
		uniqueCommits[commit.ID] = commit
	}
	b.Commits = make([]*Commit, len(uniqueCommits))
	i = 0
	for _, commit := range uniqueCommits {
		b.Commits[i] = commit
		i++
	}

	uniqueEntities := map[string]*Entity{}
	for _, entity := range b.Entities {
		uniqueEntities[entity.ID] = entity
	}
	b.Entities = make([]*Entity, len(uniqueEntities))
	i = 0
	for _, entity := range uniqueEntities {
		b.Entities[i] = entity
		i++
	}
}

func (b *Batch) AllObjects() []interface{} {
	all := []interface{}{}
	for _, object := range b.Entities {
		all = append(all, object)
	}
	for _, object := range b.Builds {
		all = append(all, object)
	}
	for _, object := range b.MergeRequests {
		all = append(all, object)
	}
	for _, object := range b.Artifacts {
		all = append(all, object)
	}
	for _, object := range b.Projects {
		all = append(all, object)
	}
	for _, object := range b.Releases {
		all = append(all, object)
	}
	for _, object := range b.Commits {
		all = append(all, object)
	}
	return all
}
