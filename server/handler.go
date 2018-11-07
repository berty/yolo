package server

import (
	"fmt"
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

func (s *Server) ListReleaseIOS(c echo.Context) error {
	html := `<table style="width:100%;font-size:150%;text-align:left;"><thead>`
	html += `<th>branch</th>`
	html += `<th>build</th>`
	html += `<th>user</th>`
	//html += `<th>status</th>`
	html += `<th>download</th>`
	html += `<th>date</th>`
	html += `<th>duration</th>`
	html += `<th>diff</th>`
	html += `</thead><tbody>`
	oncePerBranch := map[string]bool{}
	for _, build := range s.cache.builds {
		if build.BuildParameters["CIRCLE_JOB"] != "client.rn.ios" {
			continue
		}

		token := s.getHash(build.Branch)
		if _, found := oncePerBranch[build.Branch]; found && build.Branch != "master" {
			continue
		}

		branchLink := fmt.Sprintf("https://github.com/berty/berty/tree/%s", build.Branch)
		if strings.HasPrefix(build.Branch, "pull/") {
			branchLink = fmt.Sprintf("https://github.com/berty/berty/%s", build.Branch)
		}

		branchName := build.Branch
		hover := ""
		if build.Branch == "master" {
			matches := masterMerge.FindAllStringSubmatch(build.Subject, -1)
			if len(matches) == 1 && len(matches[0]) == 3 {
				oncePerBranch["pull/"+matches[0][1]] = true
				branchName = fmt.Sprintf("%s (%s)", build.Branch, matches[0][1])
				hover = matches[0][2]
				branchLink = "https://github.com/berty/berty/pull/" + matches[0][1]
			}

		}

		//out, _ := json.Marshal(build)
		//fmt.Println(string(out))

		oncePerBranch[build.Branch] = true

		/*status := `<span style="color:green">success</span>`
		if build.Status != "success" {
			status = fmt.Sprintf(`<span color="red">%s</span>`, build.Status)
		}*/

		branchColor := "#880088"
		if build.Branch == "master" {
			branchColor = "#008888"
		}

		elems := []string{
			fmt.Sprintf(`<a href="%s" title="%s" style="color:%s">%s</a>`, branchLink, hover, branchColor, branchName),
			fmt.Sprintf(`<a href="%s">%d</a>`, build.BuildURL, build.BuildNum),
			build.User.Login,
			//status,

			// FIXME: create a link /itms/release/TOKEN/ID instead of /itms/release/TOKEN/BRANCH (this way we can handle multiple artifacts per branch)
			fmt.Sprintf(`<a href="itms-services://?action=download-manifest&url=https://%s/itms/release/%s/%[3]s">download</a> `, s.hostname, token, build.Branch),

			fmt.Sprintf("%s ago", durafmt.ParseShort(time.Since(*build.StopTime))),
			fmt.Sprintf("%s", durafmt.ParseShort(time.Duration(*build.BuildTimeMillis)*time.Millisecond)),
			fmt.Sprintf(`<a href="%s">diff</a>`, build.Compare),
		}
		html += fmt.Sprintf(`<tr><td>%s</td></tr>`, strings.Join(elems, "</td><td>"))
	}
	html += `</tbody></table>`
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
