package yolosvc

import (
	"archive/zip"
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"sync"

	"berty.tech/yolo/v2/go/pkg/bintray"
	"berty.tech/yolo/v2/go/pkg/yolopb"
	"github.com/go-chi/chi"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"moul.io/u"
)

func (svc *service) ArtifactDownloader(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "artifactID")

	artifact, err := svc.store.GetArtifactByID(id)
	if err != nil {
		httpError(w, err, codes.InvalidArgument)
		return
	}
	svc.logger.Debug("artifact downloader", zap.Any("artifact", artifact))

	// save download
	{
		download := yolopb.Download{
			HasArtifactID: artifact.ID,
			// FIXME: user agent for analytics?
		}
		err := svc.store.CreateDownload(&download)
		if err != nil {
			svc.logger.Warn("failed to add download log entry", zap.Error(err))
		}
	}

	switch ext := filepath.Ext(artifact.LocalPath); ext {
	case ".unsigned-ipa", ".dummy-signed-ipa":
		if !u.CommandExists("zsign") {
			httpError(w, fmt.Errorf("missing signing binary"), codes.Internal)
			return
		}
		if svc.iosPrivkeyPath == "" || svc.iosProvPath == "" {
			httpError(w, fmt.Errorf("missing iOS signing configuration"), codes.InvalidArgument)
			return
		}
		if !u.FileExists(svc.iosPrivkeyPath) || !u.FileExists(svc.iosProvPath) {
			httpError(w, fmt.Errorf("invalid iOS signing configuration"), codes.InvalidArgument)
			return
		}

		var (
			cacheKey = artifact.ID + ".signed"
			filename = strings.TrimSuffix(path.Base(artifact.LocalPath), ext) + ".ipa"
			mimetype = artifact.MimeType
			filesize = int64(0) // will be automatically computed if using cache
		)
		err := svc.sendFileMayCache(filename, cacheKey, mimetype, filesize, w, func(w io.Writer) error {
			return svc.signAndStreamIPA(*artifact, w)
		})
		if err != nil {
			httpError(w, err, codes.Internal)
		}
	case ".unsigned-dmg", ".dummy-signed-dmg":
		// TODO: implement à-la-zsign (re)signature
		// TODO: patch the .dmg to append some additional context
		var (
			cacheKey = artifact.ID
			filename = strings.TrimSuffix(path.Base(artifact.LocalPath), ext) + ".dmg"
			mimetype = artifact.MimeType
			filesize = artifact.FileSize
		)
		err := svc.sendFileMayCache(filename, cacheKey, mimetype, filesize, w, func(w io.Writer) error {
			return svc.artifactDownloadFromProvider(artifact, w)
		})
		if err != nil {
			httpError(w, err, codes.Internal)
		}
	default:
		var (
			cacheKey = artifact.ID
			filename = path.Base(artifact.LocalPath)
			mimetype = artifact.MimeType
			filesize = artifact.FileSize
		)
		err := svc.sendFileMayCache(filename, cacheKey, mimetype, filesize, w, func(w io.Writer) error {
			return svc.artifactDownloadFromProvider(artifact, w)
		})
		if err != nil {
			httpError(w, err, codes.Internal)
		}
	}
}

func (svc *service) streamMayCache(cacheKey string, w io.Writer, fn func(io.Writer) error) error {
	svc.logger.Debug("stream may cache", zap.String("cachekey", cacheKey))
	// if cache is disabled, just stream the file
	if svc.artifactsCachePath == "" {
		return fn(w)
	}

	// check if cache already exists or create it
	cache := filepath.Join(svc.artifactsCachePath, cacheKey)
	{
		svc.artifactsCacheMutex.Lock()
		if _, found := svc.artifactsCacheMapMutex[cacheKey]; !found {
			svc.artifactsCacheMapMutex[cacheKey] = &sync.Mutex{}
		}
		cacheKeyMutex := svc.artifactsCacheMapMutex[cacheKey]
		cacheKeyMutex.Lock()
		svc.artifactsCacheMutex.Unlock()

		if !u.FileExists(cache) {
			out, err := os.Create(cache + ".tmp")
			if err != nil {
				cacheKeyMutex.Unlock()
				return err
			}

			// FIXME: tee to send directly to the writer

			if err := fn(out); err != nil {
				out.Close()
				os.Remove(cache + ".tmp")
				cacheKeyMutex.Unlock()
				return err
			}
			out.Close()

			if err := os.Rename(cache+".tmp", cache); err != nil {
				os.Remove(cache + ".tmp")
				cacheKeyMutex.Unlock()
				return err
			}
		}
		cacheKeyMutex.Unlock()
	}

	// send cache + more metadata
	{
		f, err := os.Open(cache)
		if err != nil {
			return err
		}
		defer f.Close()

		_, err = io.Copy(w, f)
		if err != nil {
			return err
		}
	}

	return nil
}

func (svc *service) sendFileMayCache(filename, cacheKey, mimetype string, filesize int64, w http.ResponseWriter, fn func(io.Writer) error) error {
	svc.logger.Debug("send file may cache", zap.String("cachekey", cacheKey), zap.String("filename", filename), zap.String("mimetype", mimetype), zap.Int64("filesize", filesize))
	w.Header().Add("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	if filesize > 0 {
		w.Header().Add("Content-Length", fmt.Sprintf("%d", filesize))
	}
	if mimetype != "" {
		w.Header().Add("Content-Type", mimetype)
	}
	// FIXME: cache-control and expires

	// if cache is disabled, just stream fn to the writer
	if svc.artifactsCachePath == "" {
		return fn(w)
	}

	// if filesize wasn't set, we compute the size based on cache size
	if filesize == 0 {
		// check if cache already exists to send filesize
		cache := filepath.Join(svc.artifactsCachePath, cacheKey)
		if stat, err := os.Stat(cache); err == nil {
			w.Header().Add("Content-Length", fmt.Sprintf("%d", stat.Size()))
		}
	}

	return svc.streamMayCache(cacheKey, w, fn)
}

func (svc *service) signAndStreamIPA(artifact yolopb.Artifact, w io.Writer) error {
	svc.logger.Debug("sign and stream IPA", zap.Any("artifact", artifact))
	// sign ipa
	var signed string
	{
		tempdir, err := os.MkdirTemp("", "yolo")
		if err != nil {
			return err
		}
		defer os.RemoveAll(tempdir)

		// write unsigned-file to tempdir
		unsigned := filepath.Join(tempdir, "unsigned.ipa")
		signed = filepath.Join(tempdir, "signed.ipa")
		f, err := os.OpenFile(unsigned, os.O_RDWR|os.O_CREATE, 0o755)
		if err != nil {
			return err
		}

		err = svc.streamMayCache(artifact.ID, f, func(w io.Writer) error {
			return svc.artifactDownloadFromProvider(&artifact, w)
		})
		if err != nil {
			return err
		}
		if err := f.Close(); err != nil {
			return err
		}

		// zsign the archive
		zsignArgs := []string{
			"-k", svc.iosPrivkeyPath,
			"-m", svc.iosProvPath, // should be retrieved from the artifact archive directly
			"-o", signed,
			"-z", "1",
		}
		if svc.iosPrivkeyPass != "" {
			zsignArgs = append(zsignArgs,
				"-p", svc.iosPrivkeyPass,
			)
		}
		zsignArgs = append(zsignArgs, unsigned)
		cmd := exec.Command("zsign", zsignArgs...)
		svc.logger.Info("zsign", zap.Strings("args", zsignArgs))
		cmd.Stderr = os.Stderr
		cmd.Stdout = os.Stdout
		err = cmd.Run()
		if err != nil {
			return err
		}
	}

	// send the signed iPA
	{
		f, err := os.Open(signed)
		if err != nil {
			return err
		}

		// content-length

		_, err = io.Copy(w, f)
		if err != nil {
			return err
		}
	}
	return nil
}

func (svc *service) artifactDownloadFromProvider(artifact *yolopb.Artifact, w io.Writer) error {
	svc.logger.Debug("download from provider", zap.Any("artifact", artifact))
	ctx := context.Background()
	switch artifact.Driver {
	case yolopb.Driver_Buildkite:
		if svc.bkc == nil {
			return fmt.Errorf("buildkite token required")
		}
		_, err := svc.bkc.Artifacts.DownloadArtifactByURL(artifact.DownloadURL, w)
		return err
	case yolopb.Driver_Bintray:
		return bintray.DownloadContent(artifact.DownloadURL, w)
		// case Driver_CircleCI:
	case yolopb.Driver_GitHub:
		if svc.ghc == nil {
			return fmt.Errorf("github token required")
		}

		// get artifact archive (.zip)
		var zipContent []byte
		{
			// FIXME: if cachePath != nil -> cache the zip
			u, err := url.Parse(artifact.GetDownloadURL())
			if err != nil {
				return err
			}
			parts := strings.Split(u.Path, "/")
			if len(parts) != 8 || parts[5] != "artifacts" || parts[7] != "zip" {
				return fmt.Errorf("unsupported download URL: %q", u)
			}
			owner, repo := parts[2], parts[3]
			artifactID, err := strconv.Atoi(parts[6])
			if err != nil {
				return fmt.Errorf("invalid download URL: %w", err)
			}
			dlurl, _, err := svc.ghc.Actions.DownloadArtifact(ctx, owner, repo, int64(artifactID), true)
			if err != nil {
				return fmt.Errorf("failed to generate download URL: %w", err)
			}
			resp, err := http.Get(dlurl.String())
			if err != nil {
				return fmt.Errorf("failed to download artifact: %w", err)
			}
			defer resp.Body.Close()
			zipContent, err = io.ReadAll(resp.Body)
			if err != nil {
				return fmt.Errorf("failed to download artifact stream: %w", err)
			}
		}

		// extract file from archive
		{
			bytesReader := bytes.NewReader(zipContent)
			zipReader, err := zip.NewReader(bytesReader, int64(len(zipContent)))
			if err != nil {
				return fmt.Errorf("failed to open artifact archive: %w", err)
			}
			if len(zipReader.File) != 1 {
				return fmt.Errorf("artifact archive should only have 1 file")
			}
			for _, f := range zipReader.File {
				fd, err := f.Open()
				if err != nil {
					return fmt.Errorf("failed to read file from archive: %w", err)
				}
				defer fd.Close()
				_, err = io.Copy(w, fd)
				if err != nil {
					return fmt.Errorf("io error while sending content of the artifact: %w", err)
				}
			}
		}

		return nil
	}
	return fmt.Errorf("download not supported for this driver")
}
