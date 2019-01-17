package server

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"math/rand"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/hako/durafmt"
	circleci "github.com/jszwedko/go-circleci"
	"github.com/labstack/echo"
)

const (
	BUNDLE_ID       = "chat.berty.ios"
	BUNDLE_HOUSE_ID = "chat.berty.house.ios"
	APP_NAME        = "Berty Staff"
	APP_HOUSE_NAME  = "Berty Yolo"
	IOS_JOB         = "client.rn.ios"
	IOS_HOUSE_JOB   = "client.rn.ios-beta"
	ANDROID_JOB     = "client.rn.android"
)

var reIPA = regexp.MustCompile("/([^/]+).ipa$")
var reAPK = regexp.MustCompile("/([^/]+).apk$")
var reVersion = regexp.MustCompile("/version$")

func (s *Server) Build(c echo.Context) error {
	id := c.Param("build_id")
	ret, err := s.client.Build(id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, ret)
}

func (s *Server) Builds(c echo.Context) error {
	pull := c.Param("branch")
	ret, err := s.client.Builds(pull, "", 30, 0)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, ret)
}

func (s *Server) Artifacts(c echo.Context) error {
	id := c.Param("build_id")
	ret, err := s.client.GetArtifacts(id, true)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, ret)
}

func (s *Server) getVersion(arts []*circleci.Artifact, kind string) (string, error) {
	for _, art := range arts {
		if !reVersion.MatchString(art.PrettyPath) {
			continue
		}

		ret, n, err := s.client.GetRawArtifact(art)
		if err != nil {
			return "", err
		}

		s := string(ret[:n])
		for _, l := range strings.Split(s, "\n") {
			if strings.HasPrefix(l, kind) {
				s := strings.Split(l, ":")
				if len(s) == 2 {
					return s[1], nil
				}
			}
		}

		return "", fmt.Errorf("found malformated version")
	}

	return "", fmt.Errorf("no version found")
}

func (s *Server) GetIPA(c echo.Context) error {
	id := c.Param("*")
	arts, err := s.client.GetArtifacts(id, true)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	for _, art := range arts {
		if !reIPA.MatchString(art.PrettyPath) {
			continue
		}

		// Download client
		rc, err := s.client.GetArtifact(art)
		if err != nil {
			return err
		}

		return c.Stream(http.StatusOK, "application/octet-stream", rc)
	}

	return echo.NewHTTPError(http.StatusInternalServerError, "IPA not found")
}

func (s *Server) GetAPK(c echo.Context) error {
	id := c.Param("*")
	arts, err := s.client.GetArtifacts(id, true)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	for _, art := range arts {
		if !reAPK.MatchString(art.PrettyPath) {
			continue
		}

		// Download client
		rc, err := s.client.GetArtifact(art)
		if err != nil {
			return err
		}

		return c.Stream(http.StatusOK, "application/vnd.android.package-archive", rc)
	}

	return echo.NewHTTPError(http.StatusInternalServerError, "APK not found")
}

var masterMerge = regexp.MustCompile(`^Merge pull request #([0-9]+) from (.*)$`)

func (s *Server) ListReleaseIOSJson(c echo.Context) error {
	return s.ListReleaseJson(c, IOS_JOB)
}

func (s *Server) ListReleaseIOSBetaJson(c echo.Context) error {
	return s.ListReleaseJson(c, IOS_HOUSE_JOB)
}

func (s *Server) ListReleaseAndroidJson(c echo.Context) error {
	return s.ListReleaseJson(c, ANDROID_JOB)
}

func (s *Server) ListReleaseJson(c echo.Context, job string) error {
	type release struct {
		Branch      string    `json:"branch"`
		StopTime    time.Time `json:"stop-time"`
		Author      string    `json:"author"`
		GitSha      string    `json:"git-sha"`
		BuildURL    string    `json:"build-url"`
		Body        string    `json:"body"`
		ManifestURL string    `json:"manifest-url"`
	}
	ret := struct {
		Master    *release   `json:"master"`
		LatestPRs []*release `json:"latest-prs"`
	}{}
	ret.LatestPRs = make([]*release, 0)
	oncePerBranch := map[string]bool{}
	releaseFromBuild := func(build *circleci.Build) *release {
		href := ""
		switch job {
		case IOS_HOUSE_JOB, IOS_JOB:
			prBranch := fmt.Sprintf("build/%d", build.BuildNum)
			href = fmt.Sprintf(`itms-services://?action=download-manifest&url=https://%s/auth/itms/release/%s/%s`, s.hostname, s.getHash(prBranch), prBranch)
		case ANDROID_JOB:
			id := strconv.Itoa(build.BuildNum)
			androidToken := s.getHash(id)
			href = fmt.Sprintf(`https://%s/auth/apk/build/%s/%s`, s.hostname, androidToken, id)
		default:
			return nil
		}

		return &release{
			Branch:      build.Branch,
			StopTime:    *build.StopTime,
			Author:      build.User.Login,
			GitSha:      build.VcsRevision,
			BuildURL:    build.BuildURL,
			Body:        build.Body,
			ManifestURL: href,
		}
	}
	for _, build := range s.cache.builds.Sorted() {
		if build.BuildParameters["CIRCLE_JOB"] != job {
			continue
		}
		if _, found := oncePerBranch[build.Branch]; found {
			continue
		}
		if build.Status != "success" {
			continue
		}
		//out, _ := json.MarshalIndent(build, "", "  ")
		//fmt.Println(string(out))
		oncePerBranch[build.Branch] = true
		if build.Branch == "master" {
			ret.Master = releaseFromBuild(build)
		} else {
			ret.LatestPRs = append(ret.LatestPRs, releaseFromBuild(build))
			if len(ret.LatestPRs) > 5 {
				break
			}
		}
	}
	return c.JSON(http.StatusOK, ret)
}

func (s *Server) ListReleaseAndroid(c echo.Context) error {
	return s.ListRelease(c, ANDROID_JOB)
}

func (s *Server) ListReleaseIOS(c echo.Context) error {
	return s.ListRelease(c, IOS_JOB)
}

func (s *Server) ListReleaseIOSBeta(c echo.Context) error {
	return s.ListRelease(c, IOS_HOUSE_JOB)
}

func (s *Server) ListRelease(c echo.Context, job string) error {
	html := `<html><head><meta http-equiv="refresh" content="30"><link rel="stylesheet" href="/assets/site.css">` + faviconHTMLHeader + `</head><body><div class="container">`

	dlIcon := `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`
	clockIcon := `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-clock"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`
	errorIcon := `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-alert-triangle"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12" y2="17"></line></svg>`

	oncePerBranch := map[string]bool{}
	previousDate := ""
	now := time.Now().Truncate(time.Hour * 24)
	for _, build := range s.cache.builds.Sorted() {
		if job != build.BuildParameters["CIRCLE_JOB"] {
			continue
		}
		if _, found := oncePerBranch[build.Branch]; found && build.Branch != "master" {
			continue
		}

		//out, _ := json.MarshalIndent(build, "", "  ")
		//fmt.Println(string(out))

		updateTime := build.StartTime
		if build.StopTime != nil {
			updateTime = build.StopTime
		}

		var currentDate string
		if updateTime != nil {
			currentDate = updateTime.Format("2006/01/02")
		} else {
			currentDate = "n/a"
		}

		stopDay := updateTime.Truncate(time.Hour * 24)
		dayDiff := math.Ceil(stopDay.Sub(now).Hours() / 24)
		if dayDiff != 0 {
			currentDate += fmt.Sprintf(" (%dd ago)", -int(dayDiff))
		}
		if currentDate != previousDate {
			html += fmt.Sprintf(`<div class="block date-line">%s</div>`, currentDate)
		}

		previousDate = currentDate

		branchURL := fmt.Sprintf("https://github.com/berty/berty/tree/%s", build.Branch)
		if strings.HasPrefix(build.Branch, "pull/") {
			branchURL = fmt.Sprintf("https://github.com/berty/berty/%s", build.Branch)
		}

		prBranch := build.Branch
		branchName := build.Branch
		subject := build.Subject
		if build.Branch == "master" {
			matches := masterMerge.FindAllStringSubmatch(build.Subject, -1)
			if len(matches) == 1 && len(matches[0]) == 3 {
				subject = matches[0][2]
				pr := matches[0][1]
				prBranch = "pull/" + pr
				oncePerBranch[prBranch] = true
				branchName = fmt.Sprintf("%s (%s)", build.Branch, pr)
				branchURL = "https://github.com/berty/berty/pull/" + pr
			}

		}
		if build.StopTime != nil {
			prBranch = fmt.Sprintf("build/%d", build.BuildNum)
		}

		if subject == "" {
			subject = "n/a"
		}

		//out, _ := json.Marshal(build)
		//fmt.Println(string(out))

		oncePerBranch[build.Branch] = true

		/*status := `<span style="color:green">success</span>`
		if build.Status != "success" {
			status = fmt.Sprintf(`<span color="red">%s</span>`, build.Status)
		}*/

		branchKind := "pull"
		if build.Branch == "master" {
			branchKind = "master"
		}

		//diff := `<span class="btn">N/A</span>`
		diff := ""
		if build != nil && build.Compare != nil {
			diff = fmt.Sprintf(`<a class="btn" href="%s">diff</a>`, *build.Compare)
		}

		duration := "(in progress)"
		if build.BuildTimeMillis != nil {
			duration = fmt.Sprintf(
				"(%s)",
				durafmt.ParseShort(time.Duration(*build.BuildTimeMillis)*time.Millisecond),
			)
		}
		commitLink := fmt.Sprintf(`<a href="https://github.com/berty/berty/commit/%s">%s</a>`, build.VcsRevision, build.VcsRevision[:8])
		branchLink := fmt.Sprintf(`<a class="a-branch"href="%s">%s</a>`, branchURL, branchName)
		buildLink := fmt.Sprintf(`<a href="%s">%d</a>`, build.BuildURL, build.BuildNum)
		age := durafmt.ParseShort(time.Since(*updateTime))

		var href string
		switch job {
		case IOS_HOUSE_JOB, IOS_JOB:
			iosToken := s.getHash(prBranch)
			href = fmt.Sprintf(`itms-services://?action=download-manifest&url=https://%s/auth/itms/release/%s/%s`, s.hostname, iosToken, prBranch)
		case ANDROID_JOB:
			id := strconv.Itoa(build.BuildNum)
			androidToken := s.getHash(id)
			href = fmt.Sprintf(`https://%s/auth/apk/build/%s/%s`, s.hostname, androidToken, id)
		default:
			return echo.NewHTTPError(http.StatusInternalServerError, "unknow job")
		}
		divRight := fmt.Sprintf(`<div class="b-download"><a class="btn" href="%s">%s</a></div>`, href, dlIcon)

		if build.Failed != nil && *build.Failed == true {
			branchKind += " error"
			divRight = fmt.Sprintf(`<div class="b-info">%s</div>`, errorIcon)
		}
		if build.StopTime == nil {
			branchKind += " in-progress"
			divRight = fmt.Sprintf(`<div class="b-info">%s</div>`, clockIcon)
		}

		elems := []string{
			fmt.Sprintf(`<div class="b-head">%s&nbsp;&nbsp;%s</div>`, branchLink, build.User.Login),
			fmt.Sprintf(`<div class="b-body"><div class="b-left"><div class="b-build">%s&nbsp;&nbsp;%s<br />%s&nbsp;&nbsp;%s&nbsp;ago&nbsp;&nbsp;%s</div></div>`, commitLink, subject, buildLink, age, duration),
			fmt.Sprintf(`<div class="b-right"><div class="b-diff">%s</div>%s</div></div>`, diff, divRight),
			// FIXME: create a link /auth/itms/release/TOKEN/ID instead of /auth/itms/release/TOKEN/BRANCH (this way we can handle multiple artifacts per branch)
		}
		html += fmt.Sprintf(`<div class="block b-%s">%s</div>`, branchKind, strings.Join(elems, " "))
	}
	html += `</div></body></html>`
	return c.HTML(http.StatusOK, html)
}

func (s *Server) ReleaseIOS(c echo.Context) error {
	pull := c.Param("*")
	builds, err := s.client.Builds(pull, IOS_JOB, 100, 0)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	if len(builds) == 0 {
		return echo.NewHTTPError(http.StatusInternalServerError, "no valid build(s) found")
	}

	token := s.getHash(pull)
	html := fmt.Sprintf(`<h1><a href="itms-services://?action=download-manifest&url=https://%s/auth/itms/release/%s/%[3]s">download - %[3]s </a></h1>`, s.hostname, token, pull)
	if strings.HasPrefix(pull, "pull/") {
		html += fmt.Sprintf(`<h2><a href="https://github.com/berty/berty/%s">GitHub PR</a></h2>`, pull)
	}

	return c.HTML(http.StatusOK, html)
}

func (s *Server) Itms(c echo.Context) error {
	pull := c.Param("*")

	var theBuild *circleci.Build
	if strings.HasPrefix(pull, "build/") {
		parts := strings.Split(pull, "/")
		id, err := strconv.Atoi(parts[1])
		if err != nil {
			return err
		}
		theBuild = s.cache.builds[id]
	}
	/*
		for _, build := range s.cache.builds.Sorted() {
			if build.Branch == pull && build.StopTime != nil {
				theBuild = build
				break
			}
		}
	*/

	if theBuild == nil {
		builds, err := s.client.Builds(pull, IOS_JOB, 100, 0)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}

		if len(builds) == 0 {
			return echo.NewHTTPError(http.StatusInternalServerError, "no valid build(s) found")
		}
		theBuild = builds[0]
	}

	id := strconv.Itoa(theBuild.BuildNum)
	arts, err := s.client.GetArtifacts(id, true)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	out, _ := json.Marshal(arts)
	log.Printf("build=%d artifacts=%s", theBuild.BuildNum, string(out))

	version, err := s.getVersion(arts, "ios")
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	token := s.getHash(id)
	url := fmt.Sprintf("https://%s/auth/ipa/build/%s/%s", s.hostname, token, id)

	previewTexts := []string{
		"😱",
		"🤡",
		"🧚‍♀️",
		"🥰",
		"🙌",
		"XOR",
		"yolo",
	}
	previewText := previewTexts[rand.Intn(len(previewTexts))]
	var bundleID string
	switch theBuild.BuildParameters["CIRCLE_JOB"] {
	case "client.rn.ios":
		bundleID = BUNDLE_ID
	case IOS_HOUSE_JOB:
		bundleID = BUNDLE_HOUSE_ID
	default:
		return echo.NewHTTPError(http.StatusInternalServerError, "invalid job type")
	}
	plist, err := NewPlistRelease(bundleID, version, previewText, url)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// FIXME: put plist in cache

	return c.Blob(http.StatusOK, "application/x-plist", plist)
}
