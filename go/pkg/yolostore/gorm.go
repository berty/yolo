package yolostore

import (
	"fmt"

	"berty.tech/yolo/v2/go/pkg/yolopb"
	"github.com/jinzhu/gorm"
)

type Store interface {

	// artifacts store
	GetArtifactAndBuildByID(id string) (*yolopb.Artifact, error)
	GetArtifactByID(id string) (*yolopb.Artifact, error)
	GetAllArtifacts() ([]yolopb.Artifact, error)
	SaveArtifact(artifact *yolopb.Artifact) error

	// build store
	GetBuildListFilters() (*BuildListFilters, error)
	GetLastBuild() (*yolopb.Build, error)
	GetBuildList(artifactID []string,
		artifactKinds []yolopb.Artifact_Kind,
		withArtifact bool,
		buildID []string,
		buildState []yolopb.Build_State,
		buildDriver []yolopb.Driver,
		projectID []string,
		mergeRequestID []string,
		mergeRequestAuthorID []string,
		mergeRequestState []yolopb.MergeRequest_State,
		branch []string,
		limit int32,
	) ([]*yolopb.Build, error)

	// batch store
	GetBatchWithPreloading() (*yolopb.Batch, error)
	GetBatch() (*yolopb.Batch, error)

	// download store
	GetDevDumpObjectDownloads() ([]*yolopb.Download, error)
	CreateDownload(download *yolopb.Download) error
	GetArtifactDownload(artifactMap map[string]int64) (map[string]int64, error)
}

type store struct {
	db *gorm.DB
}

func NewStore(db *gorm.DB) Store {
	return &store{
		db: db,
	}
}

func (s *store) GetArtifactAndBuildByID(id string) (*yolopb.Artifact, error) {
	var artifact *yolopb.Artifact
	err := s.db.
		Preload("HasBuild").
		Preload("HasBuild.HasProject").
		Preload("HasBuild.HasProject.HasOwner").
		First(&artifact, "ID = ?", id).
		Error
	if err != nil {
		return nil, fmt.Errorf("store: GetArtifactByID :%w", err)
	}

	return artifact, nil
}

func (s *store) GetArtifactByID(id string) (*yolopb.Artifact, error) {
	var artifact *yolopb.Artifact
	err := s.db.First(&artifact, "ID = ?", id).Error
	if err != nil {
		return nil, fmt.Errorf("store: GetArtifactByID :%w", err)
	}

	return artifact, nil
}

type BuildListFilters struct {
	Entities []*yolopb.Entity
	Projects []*yolopb.Project
}

func (s *store) GetBuildListFilters() (*BuildListFilters, error) {
	blFilters := BuildListFilters{}

	err := s.db.Find(&blFilters.Entities).Error
	if err != nil {
		return nil, fmt.Errorf("store: GetBuildListFilters: find: %w", err)
	}

	err = s.db.Preload("HasOwner").Find(&blFilters.Projects).Error
	if err != nil {
		return nil, fmt.Errorf("store: GetBuildListFilters: preload has owner: %w", err)
	}

	return &blFilters, nil
}

func (s *store) GetBatchWithPreloading() (*yolopb.Batch, error) {
	batch := yolopb.NewBatch()

	err := s.db.
		Preload("HasOwner").
		Find(&batch.Projects).Error
	if err != nil {
		return nil, fmt.Errorf("store: GetBatchWithPreloading: preload HasOwner: %w", err)
	}
	err = s.db.
		// FIXME: TODO
		Find(&batch.Entities).Error
	if err != nil {
		return nil, fmt.Errorf("store: GetBatchWithPreloading: find entities: %w", err)
	}
	err = s.db.
		Preload("HasCommit").
		Preload("HasProject").
		Preload("HasMergerequest").
		Preload("HasMergerequest.HasProject").
		Preload("HasMergerequest.HasProject.HasOwner").
		Preload("HasMergerequest.HasAuthor").
		Preload("HasMergerequest.HasCommit").
		Find(&batch.Builds).Error
	if err != nil {
		return nil, fmt.Errorf("store: GetBatchWithPreloading: preload HasCommit,HasProject,HasMergerequest: %w", err)
	}
	err = s.db.
		Preload("HasBuild").
		Preload("HasBuild.HasProject").
		Preload("HasBuild.HasMergerequest").
		Preload("HasBuild.HasMergerequest.HasProject").
		Preload("HasBuild.HasMergerequest.HasAuthor").
		Preload("HasBuild.HasMergerequest.HasCommit").
		Preload("HasBuild.HasCommit").
		Find(&batch.Artifacts).Error
	if err != nil {
		return nil, fmt.Errorf("store: GetBatchWithPreloading: preload HasBuild: %w", err)
	}
	err = s.db.
		Preload("HasCommit").
		Preload("HasProject").
		Preload("HasAuthor").
		Find(&batch.MergeRequests).Error
	if err != nil {
		return nil, fmt.Errorf("store: GetBatchWithPreloading: MergeRequest: %w", err)
	}
	err = s.db.
		// FIXME: TODO
		Find(&batch.Releases).Error
	if err != nil {
		return nil, fmt.Errorf("store: GetBatchWithPreloading: find Relases: %w", err)
	}
	err = s.db.
		// FIXME: TODO
		Find(&batch.Commits).Error
	if err != nil {
		return nil, fmt.Errorf("store: GetBatchWithPreloading: find Commits: %w", err)
	}

	return batch, nil
}

func (s *store) GetBatch() (*yolopb.Batch, error) {
	batch := yolopb.NewBatch()

	err := s.db.Find(&batch.Projects).Error
	if err != nil {
		return nil, fmt.Errorf("store: GetBatch: find Projects :%w", err)
	}
	err = s.db.Find(&batch.Entities).Error
	if err != nil {
		return nil, fmt.Errorf("store: GetBatch: find Entities :%w", err)
	}
	err = s.db.Find(&batch.Builds).Error
	if err != nil {
		return nil, fmt.Errorf("store: GetBatch: find Builds :%w", err)
	}
	err = s.db.Find(&batch.Artifacts).Error
	if err != nil {
		return nil, fmt.Errorf("store: GetBatch: find Artifacts :%w", err)
	}
	err = s.db.Find(&batch.MergeRequests).Error
	if err != nil {
		return nil, fmt.Errorf("store: GetBatch: find MergeRequests :%w", err)
	}
	err = s.db.Find(&batch.Releases).Error
	if err != nil {
		return nil, fmt.Errorf("store: GetBatch: find Relases :%w", err)
	}
	err = s.db.Find(&batch.Commits).Error
	if err != nil {
		return nil, fmt.Errorf("store: GetBatch: find Commits :%w", err)
	}

	return batch, nil
}

func (s *store) GetDevDumpObjectDownloads() ([]*yolopb.Download, error) {
	resp := yolopb.DevDumpObjects_Response{}

	err := s.db.Find(&resp.Downloads).Error
	if err != nil {
		return nil, fmt.Errorf("store: GetDevDumpObjectDownloads: find Downloads: %w", err)
	}

	return resp.Downloads, nil
}

func (s *store) CreateDownload(download *yolopb.Download) error {
	return s.db.Create(download).Error
}

// GetLastBuild returns last finished build
func (s *store) GetLastBuild() (*yolopb.Build, error) {
	var build *yolopb.Build

	err := s.db.Order("finished_at desc").Where(build).Select("finished_at").First(build).Error
	if err != nil {
		return nil, err
	}
	return build, err
}

// GetAllArtifacts fixme: better naming -- since it's all artifacts where bundle id is null or empty
func (s *store) GetAllArtifacts() ([]yolopb.Artifact, error) {
	var artifacts []yolopb.Artifact
	err := s.db.
		Where("bundle_id IS NULL OR bundle_id = ''").
		Find(&artifacts).
		Error
	if err != nil {
		return nil, err
	}
	return artifacts, nil
}

func (s *store) SaveArtifact(artifact *yolopb.Artifact) error {
	return s.db.Save(artifact).Error
}

func (s *store) GetBuildList(artifactID []string,
	artifactKinds []yolopb.Artifact_Kind,
	withArtifact bool,
	buildID []string,
	buildState []yolopb.Build_State,
	buildDriver []yolopb.Driver,
	projectID []string,
	mergeRequestID []string,
	mergeRequestAuthorID []string,
	mergeRequestState []yolopb.MergeRequest_State,
	branch []string,
	limit int32,
) ([]*yolopb.Build, error) {

	var builds []*yolopb.Build

	noMoreFilters := false
	withMergeRequest := false

	query := s.db.Model(builds)

	switch {
	case len(artifactID) > 0:
		query = query.
			Joins("JOIN artifact ON artifact.has_build_id = build.id AND (artifact.id IN (?) OR artifact.yolo_id IN (?))", artifactID, artifactID).
			Preload("HasArtifacts")
		noMoreFilters = true
	case len(artifactKinds) > 0:
		query = query.
			Joins("JOIN artifact ON artifact.has_build_id = build.id AND artifact.kind IN (?)", artifactKinds).
			Preload("HasArtifacts", "kind IN (?)", artifactKinds)
	case withArtifact:
		query = query.
			Joins("JOIN artifact ON artifact.has_build_id = build.id", artifactKinds).
			Preload("HasArtifacts")
	default:
		query = query.
			Preload("HasArtifacts")
	}

	if !noMoreFilters {
		if len(buildID) > 0 {
			query = query.Where("build.id IN (?) OR build.yolo_id IN (?)", buildID, buildID)
		}
		if len(buildState) > 0 {
			query = query.Where("build.state IN (?)", buildState)
		}
		if len(buildDriver) > 0 {
			query = query.Where("build.driver IN (?)", buildDriver)
		}
		if len(projectID) > 0 {
			query = query.Joins("JOIN project ON project.id = build.has_project_id AND (project.id IN (?) OR project.yolo_id IN (?))", projectID, projectID)
		}
		if len(mergeRequestID) > 0 {
			query = query.Where("build.has_mergerequest_id IN (?)", mergeRequestID)
		}

		if len(mergeRequestAuthorID) > 0 || len(mergeRequestState) > 0 {
			withMergeRequest = true
		}
		if withMergeRequest {
			query = query.Joins("JOIN merge_request ON merge_request.id = build.has_mergerequest_id")
		}
		if len(mergeRequestAuthorID) > 0 {
			query = query.Where("merge_request.has_author_id IN (?)", mergeRequestAuthorID)
		}
		if len(mergeRequestState) > 0 {
			query = query.Where("merge_request.state IN (?)", mergeRequestState)
		}
		if !withMergeRequest {
			query = query.Where("build.has_mergerequest_id IS NOT NULL AND build.has_mergerequest_id != ''")
		}
		if len(branch) > 0 {
			if withMergeRequest {
				query = query.Where("merge_request.branch IN (?) OR build.branch IN (?)", branch, branch)
			} else {
				query = query.Where("build.branch IN (?)", branch)
			}
		}
	}

	query = query.
		Preload("HasCommit").
		Preload("HasProject").
		Preload("HasProject.HasOwner").
		Preload("HasMergerequest").
		Preload("HasMergerequest.HasProject").
		Preload("HasMergerequest.HasAuthor").
		Preload("HasMergerequest.HasCommit").
		Limit(limit).
		Order("created_at desc")

	err := query.Find(builds).Error
	if err != nil {
		return nil, err
	}

	return builds, nil

}

func (s *store) GetArtifactDownload(artifactMap map[string]int64) (map[string]int64, error) {

	artifactIDs := make([]string, len(artifactMap))
	idx := 0
	for id := range artifactMap {
		artifactIDs[idx] = id
		idx++
	}
	rows, err := s.db.
		Model(&yolopb.Download{}).
		Group("has_artifact_id").
		Select("has_artifact_id, count(id)").
		Where("has_artifact_id IN (?)", artifactIDs).
		Rows()
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var (
			artifactID string
			count      int64
		)
		if err := rows.Scan(&artifactID, &count); err != nil {
			return nil, err
		}
		artifactMap[artifactID] = count
	}
	return artifactMap, nil
}
