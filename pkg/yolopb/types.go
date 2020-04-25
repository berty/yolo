package yolopb

import (
	"net/url"

	"github.com/stretchr/signature"
)

// Cleanup removes everything except ID for each relationships
func (b *Build) Cleanup() {
	for idx, rel := range b.HasArtifacts {
		b.HasArtifacts[idx] = &Artifact{ID: rel.ID}
	}
	if b.HasCommit != nil {
		b.HasCommit = &Commit{ID: b.HasCommit.ID}
	}
	if b.HasProject != nil {
		b.HasProject = &Project{ID: b.HasProject.ID}
	}
	if b.HasMergerequest != nil {
		b.HasMergerequest = &MergeRequest{ID: b.HasMergerequest.ID}
	}
}

// Cleanup removes everything except ID for each relationships
func (e *Entity) Cleanup() {
	for idx, rel := range e.HasProjects {
		e.HasProjects[idx] = &Project{ID: rel.ID}
	}
	for idx, rel := range e.HasCommits {
		e.HasCommits[idx] = &Commit{ID: rel.ID}
	}
	for idx, rel := range e.HasMergerequests {
		e.HasMergerequests[idx] = &MergeRequest{ID: rel.ID}
	}
}

// Cleanup removes everything except ID for each relationships
func (p *Project) Cleanup() {
	for idx, rel := range p.HasMergerequests {
		p.HasMergerequests[idx] = &MergeRequest{ID: rel.ID}
	}
	for idx, rel := range p.HasArtifacts {
		p.HasArtifacts[idx] = &Artifact{ID: rel.ID}
	}
	for idx, rel := range p.HasBuilds {
		p.HasBuilds[idx] = &Build{ID: rel.ID}
	}
	for idx, rel := range p.HasReleases {
		p.HasReleases[idx] = &Release{ID: rel.ID}
	}
	for idx, rel := range p.HasCommits {
		p.HasCommits[idx] = &Commit{ID: rel.ID}
	}
	if p.HasOwner != nil {
		p.HasOwner = &Entity{ID: p.HasOwner.ID}
	}
}

// Cleanup removes everything except ID for each relationships
func (c *Commit) Cleanup() {
	for idx, rel := range c.HasReleases {
		c.HasReleases[idx] = &Release{ID: rel.ID}
	}
	for idx, rel := range c.HasBuilds {
		c.HasBuilds[idx] = &Build{ID: rel.ID}
	}
	if c.HasAuthor != nil {
		c.HasAuthor = &Entity{ID: c.HasAuthor.ID}
	}
	if c.HasProject != nil {
		c.HasProject = &Project{ID: c.HasProject.ID}
	}
	if c.HasMergerequest != nil {
		c.HasMergerequest = &MergeRequest{ID: c.HasMergerequest.ID}
	}
}

// Cleanup removes everything except ID for each relationships
func (r *Release) Cleanup() {
	for idx, rel := range r.HasArtifacts {
		r.HasArtifacts[idx] = &Artifact{ID: rel.ID}
	}
	if r.HasCommit != nil {
		r.HasCommit = &Commit{ID: r.HasCommit.ID}
	}
	if r.HasProject != nil {
		r.HasProject = &Project{ID: r.HasProject.ID}
	}
	if r.HasMergerequest != nil {
		r.HasMergerequest = &MergeRequest{ID: r.HasMergerequest.ID}
	}
}

// Cleanup removes everything except ID for each relationships
func (mr *MergeRequest) Cleanup() {
	for idx, rel := range mr.HasReleases {
		mr.HasReleases[idx] = &Release{ID: rel.ID}
	}
	for idx, rel := range mr.HasBuilds {
		mr.HasBuilds[idx] = &Build{ID: rel.ID}
	}
	for idx, rel := range mr.HasAssignees {
		mr.HasAssignees[idx] = &Entity{ID: rel.ID}
	}
	for idx, rel := range mr.HasReviewers {
		mr.HasReviewers[idx] = &Entity{ID: rel.ID}
	}
	if mr.HasAuthor != nil {
		mr.HasAuthor = &Entity{ID: mr.HasAuthor.ID}
	}
	if mr.HasProject != nil {
		mr.HasProject = &Project{ID: mr.HasProject.ID}
	}
	if mr.HasCommit != nil {
		mr.HasCommit = &Commit{ID: mr.HasCommit.ID}
	}
}

func (b *Build) FilterBuildList() {
	for _, artifact := range b.HasArtifacts {
		artifact.HasBuild = nil
		artifact.Cleanup()
	}
	if b.HasCommit != nil {
		b.HasCommit.HasBuilds = nil
		b.HasCommit.Cleanup()
	}
	if b.HasProject != nil {
		b.HasProject.HasBuilds = nil
		b.HasProject.HasMergerequests = nil
		b.HasProject.Cleanup()
	}
	if b.HasMergerequest != nil {
		b.HasMergerequest.HasBuilds = nil
		for _, assignee := range b.HasMergerequest.HasAssignees {
			assignee.Cleanup()
		}
		for _, reviewer := range b.HasMergerequest.HasReviewers {
			reviewer.Cleanup()
		}
		b.HasMergerequest.Cleanup()
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

// Cleanup removes everything except ID for each relationships
func (a *Artifact) Cleanup() {
	if a.HasBuild != nil {
		a.HasBuild = &Build{ID: a.HasBuild.ID}
	}
	if a.HasRelease != nil {
		a.HasRelease = &Release{ID: a.HasRelease.ID}
	}
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
		uniqueProjects[string(project.ID)] = project
	}
	b.Projects = make([]*Project, len(uniqueProjects))
	i := 0
	for _, project := range uniqueProjects {
		b.Projects[i] = project
		i++
	}

	uniqueBuilds := map[string]*Build{}
	for _, build := range b.Builds {
		uniqueBuilds[string(build.ID)] = build
	}
	b.Builds = make([]*Build, len(uniqueBuilds))
	i = 0
	for _, build := range uniqueBuilds {
		b.Builds[i] = build
		i++
	}

	uniqueReleases := map[string]*Release{}
	for _, release := range b.Releases {
		uniqueReleases[string(release.ID)] = release
	}
	b.Releases = make([]*Release, len(uniqueReleases))
	i = 0
	for _, release := range uniqueReleases {
		b.Releases[i] = release
		i++
	}

	uniqueMergeRequests := map[string]*MergeRequest{}
	for _, mergeRequest := range b.MergeRequests {
		uniqueMergeRequests[string(mergeRequest.ID)] = mergeRequest
	}
	b.MergeRequests = make([]*MergeRequest, len(uniqueMergeRequests))
	i = 0
	for _, mergeRequest := range uniqueMergeRequests {
		b.MergeRequests[i] = mergeRequest
		i++
	}

	uniqueArtifacts := map[string]*Artifact{}
	for _, artifact := range b.Artifacts {
		uniqueArtifacts[string(artifact.ID)] = artifact
	}
	b.Artifacts = make([]*Artifact, len(uniqueArtifacts))
	i = 0
	for _, artifact := range uniqueArtifacts {
		b.Artifacts[i] = artifact
		i++
	}

	uniqueCommits := map[string]*Commit{}
	for _, commit := range b.Commits {
		uniqueCommits[string(commit.ID)] = commit
	}
	b.Commits = make([]*Commit, len(uniqueCommits))
	i = 0
	for _, commit := range uniqueCommits {
		b.Commits[i] = commit
		i++
	}

	uniqueEntities := map[string]*Entity{}
	for _, entity := range b.Entities {
		uniqueEntities[string(entity.ID)] = entity
	}
	b.Entities = make([]*Entity, len(uniqueEntities))
	i = 0
	for _, entity := range uniqueEntities {
		b.Entities[i] = entity
		i++
	}
}
