package yolosvc

import (
	"context"
	"fmt"
	"time"

	"berty.tech/yolo/v2/go/pkg/yolopb"
	"github.com/tevino/abool"
	"go.uber.org/zap"
	"moul.io/godev"
)

type PkgmanWorkerOpts struct {
	Logger     *zap.Logger
	LoopAfter  time.Duration
	ClearCache *abool.AtomicBool
	Once       bool
}

// PkgmanWorker goals is to manage the github update routine, it should try to support as much errors as possible by itself
func (svc *service) PkgmanWorker(ctx context.Context, opts PkgmanWorkerOpts) error {
	opts.applyDefaults()

	// FIXME: handle pkgman version to recompute already computed artifacts
	// FIXME: handle "since"

	var (
		logger = opts.Logger
	)
	for iteration := 0; ; iteration++ {
		var artifacts []yolopb.Artifact
		err := svc.db.Find(&artifacts).Error
		if err != nil {
			logger.Warn("get artifacts", zap.Error(err))
		}

		for _, artifact := range artifacts {
			// if artifact is available locally -> handle it and update db
			// FIXME: create URL to fetch the ipa image
			fmt.Println(godev.PrettyJSON(artifact))
		}

		if opts.Once {
			return nil
		}
		select {
		case <-ctx.Done():
			return nil
		case <-time.After(opts.LoopAfter):
		}
	}

	return nil
}

func (o *PkgmanWorkerOpts) applyDefaults() {
	if o.Logger == nil {
		o.Logger = zap.NewNop()
	}
	if o.LoopAfter == 0 {
		o.LoopAfter = 10 * time.Second
	}
	if o.ClearCache == nil {
		o.ClearCache = abool.New()
	}
}
