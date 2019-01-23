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
	pageKind := "default"
	switch job {
		case IOS_JOB, ANDROID_JOB:
			pageKind = "staff"
		case IOS_HOUSE_JOB:
			pageKind = "yolo"
	}
	faviconHTMLHeader := `<link rel="apple-touch-icon" sizes="180x180" href="/assets/favicon/` + pageKind + `/apple-touch-icon.png"><link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon/` + pageKind + `/favicon-32x32.png"><link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon/` + pageKind + `/favicon-16x16.png"><link rel="manifest" href="/assets/favicon/` + pageKind + `/site.webmanifest"><link rel="mask-icon" href="/assets/favicon/` + pageKind + `/safari-pinned-tab.svg" color="#262844"><meta name="msapplication-TileColor" content="#262844"><meta name="theme-color" content="#262844">`

	platform := ""
	platformIcon := ""
	switch job {
		case IOS_JOB, IOS_HOUSE_JOB:
			platform = "ios"
			platformIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 305 305"  xml:space="preserve"><path d="M40.738,112.119c-25.785,44.745-9.393,112.648,19.121,153.82C74.092,286.523,88.502,305,108.239,305 c0.372,0,0.745-0.007,1.127-0.022c9.273-0.37,15.974-3.225,22.453-5.984c7.274-3.1,14.797-6.305,26.597-6.305c11.226,0,18.39,3.101,25.318,6.099c6.828,2.954,13.861,6.01,24.253,5.815c22.232-0.414,35.882-20.352,47.925-37.941c12.567-18.365,18.871-36.196,20.998-43.01l0.086-0.271c0.405-1.211-0.167-2.533-1.328-3.066c-0.032-0.015-0.15-0.064-0.183-0.078c-3.915-1.601-38.257-16.836-38.618-58.36c-0.335-33.736,25.763-51.601,30.997-54.839l0.244-0.152c0.567-0.365,0.962-0.944,1.096-1.606c0.134-0.661-0.006-1.349-0.386-1.905c-18.014-26.362-45.624-30.335-56.74-30.813c-1.613-0.161-3.278-0.242-4.95-0.242c-13.056,0-25.563,4.931-35.611,8.893c-6.936,2.735-12.927,5.097-17.059,5.097c-4.643,0-10.668-2.391-17.645-5.159c-9.33-3.703-19.905-7.899-31.1-7.899c-0.267,0-0.53,0.003-0.789,0.008C78.894,73.643,54.298,88.535,40.738,112.119z"/><path d="M212.101,0.002c-15.763,0.642-34.672,10.345-45.974,23.583c-9.605,11.127-18.988,29.679-16.516,48.379c0.155,1.17,1.107,2.073,2.284,2.164c1.064,0.083,2.15,0.125,3.232,0.126c15.413,0,32.04-8.527,43.395-22.257c11.951-14.498,17.994-33.104,16.166-49.77C214.544,0.921,213.395-0.049,212.101,0.002z"/></svg>`
		case ANDROID_JOB:
			platform = "android"
			platformIcon = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 553 553"><g><path d="M76.774,179.141c-9.529,0-17.614,3.323-24.26,9.969c-6.646,6.646-9.97,14.621-9.97,23.929v142.914c0,9.541,3.323,17.619,9.97,24.266c6.646,6.646,14.731,9.97,24.26,9.97c9.522,0,17.558-3.323,24.101-9.97c6.53-6.646,9.804-14.725,9.804-24.266V213.039c0-9.309-3.323-17.283-9.97-23.929C94.062,182.464,86.082,179.141,76.774,179.141z"/><path d="M351.972,50.847L375.57,7.315c1.549-2.882,0.998-5.092-1.658-6.646c-2.883-1.34-5.098-0.661-6.646,1.989l-23.928,43.88c-21.055-9.309-43.324-13.972-66.807-13.972c-23.488,0-45.759,4.664-66.806,13.972l-23.929-43.88c-1.555-2.65-3.77-3.323-6.646-1.989c-2.662,1.561-3.213,3.764-1.658,6.646l23.599,43.532c-23.929,12.203-42.987,29.198-57.167,51.022c-14.18,21.836-21.273,45.698-21.273,71.628h307.426c0-25.924-7.094-49.787-21.273-71.628C394.623,80.045,375.675,63.05,351.972,50.847z M215.539,114.165c-2.552,2.558-5.6,3.831-9.143,3.831c-3.55,0-6.536-1.273-8.972-3.831c-2.436-2.546-3.654-5.582-3.654-9.137c0-3.543,1.218-6.585,3.654-9.137c2.436-2.546,5.429-3.819,8.972-3.819s6.591,1.273,9.143,3.819c2.546,2.558,3.825,5.594,3.825,9.137C219.357,108.577,218.079,111.619,215.539,114.165z M355.625,114.165c-2.441,2.558-5.434,3.831-8.971,3.831c-3.551,0-6.598-1.273-9.145-3.831c-2.551-2.546-3.824-5.582-3.824-9.137c0-3.543,1.273-6.585,3.824-9.137c2.547-2.546,5.594-3.819,9.145-3.819c3.543,0,6.529,1.273,8.971,3.819c2.438,2.558,3.654,5.594,3.654,9.137C359.279,108.577,358.062,111.619,355.625,114.165z"/><path d="M123.971,406.804c0,10.202,3.543,18.838,10.63,25.925c7.093,7.087,15.729,10.63,25.924,10.63h24.596l0.337,75.454c0,9.528,3.323,17.619,9.969,24.266s14.627,9.97,23.929,9.97c9.523,0,17.613-3.323,24.26-9.97s9.97-14.737,9.97-24.266v-75.447h45.864v75.447c0,9.528,3.322,17.619,9.969,24.266s14.73,9.97,24.26,9.97c9.523,0,17.613-3.323,24.26-9.97s9.969-14.737,9.969-24.266v-75.447h24.928c9.969,0,18.494-3.544,25.594-10.631c7.086-7.087,10.631-15.723,10.631-25.924V185.45H123.971V406.804z"/><path d="M476.275,179.141c-9.309,0-17.283,3.274-23.93,9.804c-6.646,6.542-9.969,14.578-9.969,24.094v142.914c0,9.541,3.322,17.619,9.969,24.266s14.627,9.97,23.93,9.97c9.523,0,17.613-3.323,24.26-9.97s9.969-14.725,9.969-24.266V213.039c0-9.517-3.322-17.552-9.969-24.094C493.888,182.415,485.798,179.141,476.275,179.141z"/></g></svg>`
	}

	html := `<html><head><title>` + pageKind + ` - Berty</title><meta http-equiv="refresh" content="30"><link rel="stylesheet" href="/assets/site.css">` + faviconHTMLHeader + `</head><body><div class="page-head"><div class="ph-left"><div class="ph-icon">` + platformIcon + `</div><div class="ph-text"><b>` + platform + `</b> builds for Berty app, <b>` + pageKind + `</b> version</div></div></div><div class="page-container">`

	dlIcon := `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`
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
		}

		elems := []string{
			fmt.Sprintf(`<div class="b-head">%s&nbsp;&nbsp;%s</div>`, branchLink, build.User.Login),
			fmt.Sprintf(`<div class="b-body"><div class="b-body-overlay"></div><div class="b-body-content"><div class="b-left"><div class="b-build">%s&nbsp;&nbsp;%s<br />%s&nbsp;&nbsp;%s&nbsp;ago&nbsp;&nbsp;%s</div></div>`, commitLink, subject, buildLink, age, duration),
			fmt.Sprintf(`<div class="b-right"><div class="b-diff">%s</div>%s</div></div></div>`, diff, divRight),
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
