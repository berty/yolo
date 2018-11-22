package server

import (
	"fmt"
	"math"
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
	BUNDLE_ID = "chat.berty.ios"
	APP_NAME  = "berty"
	JOB_IOS   = "client.rn.ios"
)

var reIPA = regexp.MustCompile("/([^/]+).ipa$")
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

var masterMerge = regexp.MustCompile(`^Merge pull request #([0-9]+) from (.*)$`)

func (s *Server) ListReleaseIOSJson(c echo.Context) error {
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
		manifestURL := fmt.Sprintf(
			`itms-services://?action=download-manifest&url=https://%s/itms/release/%s/%[3]s`,
			s.hostname, s.getHash(build.Branch), build.Branch,
		)

		return &release{
			Branch:      build.Branch,
			StopTime:    *build.StopTime,
			Author:      build.User.Login,
			GitSha:      build.VcsRevision,
			BuildURL:    build.BuildURL,
			Body:        build.Body,
			ManifestURL: manifestURL,
		}
	}
	for _, build := range s.cache.builds.Sorted() {
		if build.BuildParameters["CIRCLE_JOB"] != "client.rn.ios" {
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

func (s *Server) ListReleaseIOS(c echo.Context) error {
	html := `<html><head><link rel="stylesheet" href="/assets/site.css">` + faviconHTMLHeader + `</head><body><div class="container">`
	//html += `<table><thead><th class="td-title">branch</th><th>build</th><th></th><th></th></thead><tbody>`
	html += `<table><tbody>`

	dlIcon := `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`

	oncePerBranch := map[string]bool{}
	previousDate := ""
	now := time.Now().Truncate(time.Hour * 24)
	for _, build := range s.cache.builds.Sorted() {
		if build.BuildParameters["CIRCLE_JOB"] != "client.rn.ios" {
			continue
		}
		if _, found := oncePerBranch[build.Branch]; found && build.Branch != "master" {
			continue
		}

		updateTime := build.StartTime
		if build.StopTime != nil {
			updateTime = build.StopTime
		}

		currentDate := updateTime.Format("2006/01/02")
		stopDay := updateTime.Truncate(time.Hour * 24)
		dayDiff := math.Ceil(stopDay.Sub(now).Hours() / 24)
		if dayDiff != 0 {
			currentDate += fmt.Sprintf(" (%dd ago)", -int(dayDiff))
		}
		if currentDate != previousDate {
			html += fmt.Sprintf(`<tr class="date-line"><td colspan=4>%s</td></tr>`, currentDate)
		}

		previousDate = currentDate

		branchLink := fmt.Sprintf("https://github.com/berty/berty/tree/%s", build.Branch)
		if strings.HasPrefix(build.Branch, "pull/") {
			branchLink = fmt.Sprintf("https://github.com/berty/berty/%s", build.Branch)
		}

		prBranch := build.Branch
		branchName := build.Branch
		hover := ""
		if build.Branch == "master" {
			matches := masterMerge.FindAllStringSubmatch(build.Subject, -1)
			if len(matches) == 1 && len(matches[0]) == 3 {
				pr := matches[0][1]
				prBranch = "pull/" + pr
				oncePerBranch[prBranch] = true
				branchName = fmt.Sprintf("%s (%s)", build.Branch, pr)
				hover = matches[0][2]
				branchLink = "https://github.com/berty/berty/pull/" + pr
			}

		}
		token := s.getHash(prBranch)

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
		if build.StopTime == nil {
			branchKind = "inprogress"
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
		elems := []string{
			fmt.Sprintf(`<td class="td-title"><a href="%s" title="%s">%s</a><br />%s</td>`, branchLink, hover, branchName, build.User.Login),
			fmt.Sprintf(`<td class="td-build"><a href="%s">%d</a><br />%s ago %s</td>`,
				build.BuildURL,
				build.BuildNum,
				durafmt.ParseShort(time.Since(*updateTime)),
				duration,
			),
			//status,
			fmt.Sprintf(`<td class="td-diff">%s</td>`, diff),
			fmt.Sprintf(`<td class="td-download"><a class="btn" href="itms-services://?action=download-manifest&url=https://%s/itms/release/%s/%[3]s">%s</a></td>`, s.hostname, token, prBranch, dlIcon),
			// FIXME: create a link /itms/release/TOKEN/ID instead of /itms/release/TOKEN/BRANCH (this way we can handle multiple artifacts per branch)
		}

		html += fmt.Sprintf(`<tr class="tr-%s">%s</tr>`, branchKind, strings.Join(elems, " "))
	}
	html += `</tbody></table>`
	html += `</div></body></html>`
	return c.HTML(http.StatusOK, html)
}

func (s *Server) ReleaseIOS(c echo.Context) error {
	pull := c.Param("*")
	builds, err := s.client.Builds(pull, JOB_IOS, 100, 0)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	if len(builds) == 0 {
		return echo.NewHTTPError(http.StatusInternalServerError, "no valid build(s) found")
	}

	token := s.getHash(pull)
	html := fmt.Sprintf(`<h1><a href="itms-services://?action=download-manifest&url=https://%s/itms/release/%s/%[3]s">download - %[3]s </a></h1>`, s.hostname, token, pull)
	if strings.HasPrefix(pull, "pull/") {
		html += fmt.Sprintf(`<h2><a href="https://github.com/berty/berty/%s">GitHub PR</a></h2>`, pull)
	}

	return c.HTML(http.StatusOK, html)
}

func (s *Server) Itms(c echo.Context) error {
	pull := c.Param("*")
	fmt.Println(pull)
	builds, err := s.client.Builds(pull, JOB_IOS, 100, 0)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	if len(builds) == 0 {
		return echo.NewHTTPError(http.StatusInternalServerError, "no valid build(s) found")
	}

	id := strconv.Itoa(builds[0].BuildNum)
	arts, err := s.client.GetArtifacts(id, true)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	version, err := s.getVersion(arts, "ios")
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	token := s.getHash(id)
	url := fmt.Sprintf("https://%s/ipa/build/%s/%s", s.hostname, token, id)

	plist, err := NewPlistRelease(BUNDLE_ID, version, APP_NAME, url)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.Blob(http.StatusOK, "application/x-plist", plist)
}
