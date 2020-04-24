package yolosvc

import (
	"net/http"
	"time"

	"berty.tech/yolo/v2/pkg/bintray"
	"berty.tech/yolo/v2/pkg/yolopb"
	"github.com/buildkite/go-buildkite/buildkite"
	"github.com/cayleygraph/cayley"
	"github.com/cayleygraph/cayley/schema"
	"github.com/google/go-github/v31/github"
	circleci "github.com/jszwedko/go-circleci"
	"go.uber.org/zap"
)

type Service interface {
	yolopb.YoloServiceServer
	PlistGenerator(w http.ResponseWriter, r *http.Request)
	ArtifactDownloader(w http.ResponseWriter, r *http.Request)
}

type service struct {
	startTime time.Time
	db        *cayley.Handle
	logger    *zap.Logger
	schema    *schema.Config
	bkc       *buildkite.Client
	btc       *bintray.Client
	ccc       *circleci.Client
	ghc       *github.Client
	authSalt  string
	devMode   bool
}

type ServiceOpts struct {
	BuildkiteClient *buildkite.Client
	CircleciClient  *circleci.Client
	BintrayClient   *bintray.Client
	GithubClient    *github.Client
	Logger          *zap.Logger
	AuthSalt        string
	DevMode         bool
}

func NewService(db *cayley.Handle, schema *schema.Config, opts ServiceOpts) Service {
	if opts.Logger == nil {
		opts.Logger = zap.NewNop()
	}
	return &service{
		startTime: time.Now(),
		db:        db,
		logger:    opts.Logger,
		schema:    schema,
		bkc:       opts.BuildkiteClient,
		btc:       opts.BintrayClient,
		ccc:       opts.CircleciClient,
		authSalt:  opts.AuthSalt,
		devMode:   opts.DevMode,
	}
}
