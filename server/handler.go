package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

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

func (s *Server) ListReleaseIOS(c echo.Context) error {
	builds, err := s.client.Builds("", JOB_IOS, 100, 0)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	html := `<table><thead>`
	html += `<th>branch</th>`
	html += `<th>build</th>`
	html += `<th>user</th>`
	html += `<th>status</th>`
	html += `<th>download</th>`
	html += `<th>date</th>`
	html += `</thead><tbody>`
	for _, build := range builds {
		out, _ := json.Marshal(build)
		fmt.Println(string(out))
		token := s.getHash(build.Branch)

		status := `<span style="color:green">success</span>`
		if build.Status != "success" {
			status = fmt.Sprintf(`<span color="red">%s</span>`, build.Status)
		}

		branchLink := fmt.Sprintf("https://github.com/berty/berty/tree/%s", build.Branch)
		if strings.HasPrefix(build.Branch, "pull/") {
			branchLink = fmt.Sprintf("https://github.com/berty/berty/%s", build.Branch)
		}

		elems := []string{
			fmt.Sprintf(`<a href="%s">%s</a>`, branchLink, build.Branch),
			fmt.Sprintf(`<a href="%s">%d</a>`, build.BuildURL, build.BuildNum),
			build.User.Login,
			status,

			// FIXME: create a link /itms/release/TOKEN/ID instead of /itms/release/TOKEN/BRANCH (this way we can handle multiple artifacts per branch)
			fmt.Sprintf(`<a href="itms-services://?action=download-manifest&url=https://%s/itms/release/%s/%[3]s">download</a> `, s.hostname, token, build.Branch),

			fmt.Sprintf("%s ago", time.Since(*build.StopTime)),
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
