package yolostore

import (
	"fmt"

	"berty.tech/yolo/v2/go/pkg/yolopb"
	"github.com/jinzhu/gorm"
	"go.uber.org/zap"
)

type Store interface {
	// artifacts store
	GetArtifactByID(id string) (*yolopb.Artifact, error)
	GetAllArtifactsWithoutBundleID() ([]*yolopb.Artifact, error)
	SaveArtifact(artifact *yolopb.Artifact) error

	// build store
	GetBuildListFilters() (*BuildListFilters, error)
	GetLastBuild(driver yolopb.Driver) (*yolopb.Build, error)
	GetBuildList(bl GetBuildListOpts) ([]*yolopb.Build, error)

	// batch store
	GetBatchWithPreloading() (*yolopb.Batch, error)
	GetBatch() (*yolopb.Batch, error)
	SaveBatch(batch *yolopb.Batch) error

	// download store
	GetDumpWithPreloading() ([]*yolopb.Download, error)
	CreateDownload(download *yolopb.Download) error

	// internal
	DB() *gorm.DB
}

type store struct {
	db *gorm.DB
}

func NewStore(db *gorm.DB, logger *zap.Logger) (Store, error) {
	db, err := initDB(db, logger)
	if err != nil {
		return nil, err
	}

	return &store{
		db: db,
	}, nil
}

func (s *store) DB() *gorm.DB { return s.db }

func (s *store) GetArtifactByID(id string) (*yolopb.Artifact, error) {
	var artifact yolopb.Artifact
	err := s.db.
		Preload("HasBuild").
		Preload("HasBuild.HasProject").
		Preload("HasBuild.HasProject.HasOwner").
		First(&artifact, "ID = ?", id).
		Error
	if err != nil {
		return nil, fmt.Errorf("store: GetArtifactByID :%w", err)
	}

	return &artifact, nil
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

func (s *store) GetDumpWithPreloading() ([]*yolopb.Download, error) {
	var downloads []*yolopb.Download

	err := s.db.Find(&downloads).Error
	if err != nil {
		return nil, fmt.Errorf("store: GetDumpWithPreloading: find Downloads: %w", err)
	}

	return downloads, nil
}

func (s *store) CreateDownload(download *yolopb.Download) error {
	return s.db.Create(download).Error
}

// GetLastBuild returns last finished build with driver filter
func (s *store) GetLastBuild(driver yolopb.Driver) (*yolopb.Build, error) {
	build := yolopb.Build{Driver: driver}

	err := s.db.Order("finished_at desc").Where(&build).Select("finished_at").First(&build).Error
	if err != nil {
		return nil, err
	}
	return &build, err
}

func (s *store) GetAllArtifactsWithoutBundleID() ([]*yolopb.Artifact, error) {
	var artifacts []*yolopb.Artifact
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

type GetBuildListOpts struct {
	ArtifactID           []string
	ArtifactKinds        []yolopb.Artifact_Kind
	WithArtifact         bool
	BuildID              []string
	BuildState           []yolopb.Build_State
	BuildDriver          []yolopb.Driver
	ProjectID            []string
	MergeRequestID       []string
	MergeRequestAuthorID []string
	MergeRequestState    []yolopb.MergeRequest_State
	Branch               []string
	Limit                int32
}

func (s *store) GetBuildList(bl GetBuildListOpts) ([]*yolopb.Build, error) {
	var builds []*yolopb.Build

	noMoreFilters := false
	withMergeRequest := false

	query := s.db.Model(builds)

	switch {
	case len(bl.ArtifactID) > 0:
		query = query.
			Joins("JOIN artifact ON artifact.has_build_id = build.id AND (artifact.id IN (?) OR artifact.yolo_id IN (?))", bl.ArtifactID, bl.ArtifactID).
			Preload("HasArtifacts")
		noMoreFilters = true
	case len(bl.ArtifactKinds) > 0:
		query = query.
			Joins("JOIN artifact ON artifact.has_build_id = build.id AND artifact.kind IN (?)", bl.ArtifactKinds).
			Preload("HasArtifacts", "kind IN (?)", bl.ArtifactKinds)
	case bl.WithArtifact:
		query = query.
			Joins("JOIN artifact ON artifact.has_build_id = build.id", bl.ArtifactKinds).
			Preload("HasArtifacts")
	default:
		query = query.
			Preload("HasArtifacts")
	}

	if !noMoreFilters {
		if len(bl.BuildID) > 0 {
			query = query.Where("build.id IN (?) OR build.yolo_id IN (?)", bl.BuildID, bl.BuildID)
		}
		if len(bl.BuildState) > 0 {
			query = query.Where("build.state IN (?)", bl.BuildState)
		}
		if len(bl.BuildDriver) > 0 {
			query = query.Where("build.driver IN (?)", bl.BuildDriver)
		}
		if len(bl.ProjectID) > 0 {
			query = query.Joins("JOIN project ON project.id = build.has_project_id AND (project.id IN (?) OR project.yolo_id IN (?))", bl.ProjectID, bl.ProjectID)
		}
		if len(bl.MergeRequestID) > 0 {
			query = query.Where("build.has_mergerequest_id IN (?)", bl.MergeRequestID)
		}

		if len(bl.MergeRequestAuthorID) > 0 || len(bl.MergeRequestState) > 0 {
			withMergeRequest = true
		}
		if withMergeRequest {
			query = query.Joins("JOIN merge_request ON merge_request.id = build.has_mergerequest_id")
		}
		if len(bl.MergeRequestAuthorID) > 0 {
			query = query.Where("merge_request.has_author_id IN (?)", bl.MergeRequestAuthorID)
		}
		if len(bl.MergeRequestState) > 0 {
			query = query.Where("merge_request.state IN (?)", bl.MergeRequestState)
		}
		if !withMergeRequest {
			query = query.Where("build.has_mergerequest_id IS NOT NULL AND build.has_mergerequest_id != ''")
		}
		if len(bl.Branch) > 0 {
			if withMergeRequest {
				query = query.Where("merge_request.branch IN (?) OR build.branch IN (?)", bl.Branch, bl.Branch)
			} else {
				query = query.Where("build.branch IN (?)", bl.Branch)
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
		Limit(bl.Limit).
		Order("created_at desc")

	err := query.Find(&builds).Error
	if err != nil {
		return nil, fmt.Errorf("store: GetBuildList: find builds: %w", err)
	}

	// compute download stats
	artifactMap := map[string]int64{}
	for _, build := range builds {
		for _, artifact := range build.HasArtifacts {
			artifactMap[artifact.ID] = 0
		}
	}
	if len(artifactMap) > 0 {
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
			return nil, fmt.Errorf("store: GetBuildList: find download: %w", err)
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
	}

	for _, build := range builds {
		for _, artifact := range build.HasArtifacts {
			if count, found := artifactMap[artifact.ID]; found {
				artifact.DownloadsCount = count
			}
		}
	}

	return builds, nil
}

func (s *store) SaveBatch(batch *yolopb.Batch) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		// FIXME: use this for Entities (users, orgs): db.Model(&entity).Update(&entity)?
		for _, object := range batch.AllObjects() {
			if err := tx.Set("gorm:association_autocreate", true).Save(object).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
