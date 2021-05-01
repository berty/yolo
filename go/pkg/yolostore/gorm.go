package yolostore

import (
	"fmt"

	"berty.tech/yolo/v2/go/pkg/yolopb"
	"github.com/jinzhu/gorm"
)

type Store interface {
	GetArtifactAndBuildByID(id string) (*yolopb.Artifact, error)
	GetBuildListFilters() (*yolopb.BuildListFilters_Response, error)
	GetBatchWithPreloading() (*yolopb.Batch, error)
	GetBatch() (*yolopb.Batch, error)
	GetDevDumpObjectDownloads() ([]*yolopb.Download, error)
	GetArtifactByID(id string) (*yolopb.Artifact, error)
	CreateDownload(download *yolopb.Download) error
	GetLastBuild() (*yolopb.Build, error)
	GetAllArtifacts() ([]yolopb.Artifact, error)
	SaveArtifact(artifact *yolopb.Artifact) error
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

func (s *store) GetBuildListFilters() (*yolopb.BuildListFilters_Response, error) {
	blFilters := yolopb.BuildListFilters_Response{}

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
