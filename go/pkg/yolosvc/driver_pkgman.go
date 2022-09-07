package yolosvc

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"berty.tech/yolo/v2/go/pkg/yolopb"
	"github.com/tevino/abool"
	"go.uber.org/zap"
	"moul.io/pkgman/pkg/apk"
	"moul.io/pkgman/pkg/ipa"
	"moul.io/u"
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
	// FIXME: handle pkgman version to recompute already computed artifacts with new filters
	logger := opts.Logger.Named("pman")
	for iteration := 0; ; iteration++ {
		artifacts, err := svc.store.GetAllArtifactsWithoutBundleID()
		if err != nil {
			logger.Warn("get artifacts", zap.Error(err))
		}

		for _, artifact := range artifacts {
			cache := filepath.Join(svc.artifactsCachePath, artifact.ID)
			if !u.FileExists(cache) {
				continue
			}
			err = svc.pkgmanParseArtifactFile(artifact, cache)
			if err != nil {
				logger.Warn("failed to parse package", zap.String("path", cache), zap.Error(err))
			}
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
}

func (o *PkgmanWorkerOpts) applyDefaults() {
	if o.Logger == nil {
		o.Logger = zap.NewNop()
	}
	if o.LoopAfter == 0 {
		o.LoopAfter = 20 * time.Second
	}
	if o.ClearCache == nil {
		o.ClearCache = abool.New()
	}
}

func (svc *service) pkgmanParseArtifactFile(artifact *yolopb.Artifact, artifactPath string) error {
	switch artifact.Kind {
	case yolopb.Artifact_IPA:
		pkg, err := ipa.Open(artifactPath)
		if err != nil {
			return err
		}
		defer pkg.Close()
		apps := pkg.Apps()
		if len(apps) != 1 {
			return fmt.Errorf("pkgman: ipa should contain only 1 app, got %d", len(apps))
		}
		app := apps[0]
		plist, err := app.Plist()
		if err != nil {
			return err
		}
		artifact.BundleName = plist.CFBundleDisplayName
		if artifact.BundleName == "" {
			artifact.BundleName = plist.CFBundleName
		}
		artifact.BundleID = plist.CFBundleIdentifier
		artifact.BundleVersion = plist.CFBundleShortVersionString
		appIcon, err := svc.pkgmanExtractIPAAppIcon(app)
		if err != nil {
			svc.logger.Debug("failed to extract IPA app icon", zap.Error(err))
		} else {
			artifact.BundleIcon = appIcon
		}
		err = svc.store.SaveArtifact(artifact)
		if err != nil {
			return err
		}
	case yolopb.Artifact_APK:
		pkg, err := apk.Open(artifactPath)
		if err != nil {
			return err
		}
		defer pkg.Close()
		manifest, err := pkg.Manifest()
		if err != nil {
			return err
		}
		if mainActivity := manifest.MainActivity(); mainActivity != nil {
			artifact.BundleName = mainActivity.Label
			artifact.BundleID = strings.TrimSuffix(mainActivity.Name, ".MainActivity")
			artifact.BundleVersion = manifest.VersionName
		}
		// FIXME: extract icon
		err = svc.store.SaveArtifact(artifact)
		if err != nil {
			return err
		}
	default:
		svc.logger.Debug(
			"pkgman: unsupported artifact kind",
			zap.String("path", artifact.LocalPath),
			zap.Stringer("kind", artifact.Kind),
		)
		return nil
	}
	return nil
}

func (svc *service) pkgmanExtractIPAAppIcon(app *ipa.App) (string, error) {
	b, err := app.FileBytes("AppIcon60x60@3x.png")
	if err != nil {
		b, err = app.FileBytes("AppIcon60x60@2x.png")
		if err != nil {
			return "", err
		}
	}

	icon := md5Sum(b) + ".png"
	iconsPath := filepath.Join(svc.artifactsCachePath, "icons")
	if err := os.MkdirAll(iconsPath, 0o755); err != nil {
		return "", err
	}
	iconPath := filepath.Join(iconsPath, icon)
	out, err := os.Create(iconPath)
	if err != nil {
		return "", err
	}
	defer out.Close()
	_, err = out.Write(b)
	if err != nil {
		return "", err
	}
	return icon, nil
}
