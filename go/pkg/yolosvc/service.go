package yolosvc

import (
	"context"
	"net/http"
	"sync"
	"time"

	"berty.tech/yolo/v2/go/pkg/bintray"
	"berty.tech/yolo/v2/go/pkg/yolopb"
	"github.com/buildkite/go-buildkite/buildkite"
	"github.com/google/go-github/v32/github"
	"github.com/jinzhu/gorm"
	circleci "github.com/jszwedko/go-circleci"
	"github.com/tevino/abool"
	"go.uber.org/zap"
)

type Service interface {
	yolopb.YoloServiceServer
	PlistGenerator(w http.ResponseWriter, r *http.Request)
	ArtifactDownloader(w http.ResponseWriter, r *http.Request)
	ArtifactIcon(w http.ResponseWriter, r *http.Request)
	ArtifactGetFile(w http.ResponseWriter, r *http.Request)

	GitHubWorker(ctx context.Context, opts GithubWorkerOpts) error
	BuildkiteWorker(ctx context.Context, opts BuildkiteWorkerOpts) error
	CircleciWorker(ctx context.Context, opts CircleciWorkerOpts) error
	BintrayWorker(ctx context.Context, opts BintrayWorkerOpts) error
	PkgmanWorker(ctx context.Context, opts PkgmanWorkerOpts) error
}

type service struct {
	startTime           time.Time
	db                  *gorm.DB
	logger              *zap.Logger
	bkc                 *buildkite.Client
	btc                 *bintray.Client
	ccc                 *circleci.Client
	ghc                 *github.Client
	authSalt            string
	devMode             bool
	clearCache          *abool.AtomicBool
	artifactsCachePath  string
	artifactsCacheMutex sync.Mutex
}

type ServiceOpts struct {
	BuildkiteClient    *buildkite.Client
	CircleciClient     *circleci.Client
	BintrayClient      *bintray.Client
	GithubClient       *github.Client
	Logger             *zap.Logger
	AuthSalt           string
	DevMode            bool
	ClearCache         *abool.AtomicBool
	ArtifactsCachePath string
}

func NewService(db *gorm.DB, opts ServiceOpts) (Service, error) {
	opts.applyDefaults()

	db, err := initDB(db, opts.Logger)
	if err != nil {
		return nil, err
	}

	return &service{
		startTime:          time.Now(),
		db:                 db,
		logger:             opts.Logger,
		bkc:                opts.BuildkiteClient,
		btc:                opts.BintrayClient,
		ccc:                opts.CircleciClient,
		ghc:                opts.GithubClient,
		authSalt:           opts.AuthSalt,
		devMode:            opts.DevMode,
		clearCache:         opts.ClearCache,
		artifactsCachePath: opts.ArtifactsCachePath,
	}, nil
}

func (o *ServiceOpts) applyDefaults() {
	if o.Logger == nil {
		o.Logger = zap.NewNop()
	}
	if o.ClearCache == nil {
		o.ClearCache = abool.New()
	}
}
