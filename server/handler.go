package server

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"math/rand"
	"net/http"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	slack "github.com/ashwanthkumar/slack-go-webhook"
	"github.com/hako/durafmt"
	ga "github.com/jpillora/go-ogle-analytics"
	circleci "github.com/jszwedko/go-circleci"
	"github.com/labstack/echo"
	"github.com/labstack/echo-contrib/session"
)

const (
	BUNDLE_STAFF_ID   = "chat.berty.ios.staff"
	BUNDLE_YOLO_ID    = "chat.berty.ios.yolo"
	APP_STAFF_NAME    = "Berty Staff"
	APP_YOLO_NAME     = "Berty Yolo"
	IOS_STAFF_JOB     = "client.rn.ios"
	IOS_YOLO_JOB      = "client.rn.ios-beta"
	MAC_STAFF_JOB     = "client.rn.mac"
	ANDROID_STAFF_JOB = "client.rn.android"
	ANDROID_YOLO_JOB  = "client.rn.android-beta"
	SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/T2AJ2MM5Z/BFX8ZASKW/***REMOVED***"
)

var (
	reIPA           = regexp.MustCompile("/([^/]+).ipa$")
	reAPK           = regexp.MustCompile("/([^/]+).apk$")
	reZIP           = regexp.MustCompile("/([^/]+).zip$")
	reVersion       = regexp.MustCompile("/version$")
	slackFloodMap   = map[string]time.Time{}
	slackFloodMutex = sync.Mutex{}
)

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

func userProfileFromContext(c echo.Context) (map[string]interface{}, error) {
	sessAuth, err := session.Get(authSessionCookieName, c)
	if err != nil {
		return nil, err
	}
	if sessAuth != nil && sessAuth.Values != nil && sessAuth.Values["profile"] != nil {
		return sessAuth.Values["profile"].(map[string]interface{}), nil
	}
	return nil, nil
}

func clientIDFromContext(c echo.Context) string {
	username := "anonymous"
	profile, err := userProfileFromContext(c)
	if err != nil {
		username = err.Error()
	}
	if profile != nil {
		username = profile["name"].(string)
	}
	username += ":" + c.RealIP()
	return username
}

func (s *Server) sendUserActionToSlack(c echo.Context, action, color, channel, floodChannel string) {
	if s.NoSlack {
		return
	}

	attachment := slack.Attachment{}
	auth := c.RealIP()

	username := "anonymous"
	profile, err := userProfileFromContext(c)
	if err != nil {
		username = err.Error()
	}
	if profile != nil {
		username = profile["name"].(string)
		if profile["picture"] != nil {
			profilePicture := profile["picture"].(string)
			attachment.ThumbnailUrl = &profilePicture
		}
		auth = fmt.Sprintf("realip=%q nickname=%q sub=%q", c.RealIP(), profile["nickname"].(string), profile["sub"].(string))
	}

	username += fmt.Sprintf(" (%s)", c.RealIP())
	//attachment.AddField(slack.Field{Title: "action", Value: action, Short: true})
	//attachment.AddField(slack.Field{Title: "author", Value: username, Short: true})
	//attachment.AddField(slack.Field{Title: "ip", Value: c.RealIP(), Short: true})
	//attachment.AddField(slack.Field{Title: "path", Value: c.Path(), Short: true})
	//attachment.AddField(slack.Field{Title: "groups", Value: strings.Join(profile["groups"].([]string), ","), Short: true})
	ua := c.Request().UserAgent()
	attachment.AddField(slack.Field{Title: "user-agent", Value: ua, Short: true})
	attachment.AddField(slack.Field{Title: "auth", Value: auth, Short: true})
	attachment.Color = &color

	if channel != floodChannel {
		slackFloodMutex.Lock()
		defer slackFloodMutex.Unlock()
		key := fmt.Sprintf("%s:%s:%s:%s", username, action, auth, ua)
		last, found := slackFloodMap[key]

		floodDuration := 300 * time.Second
		if found && -time.Until(last) < floodDuration {
			channel = floodChannel
		}
		slackFloodMap[key] = time.Now()
	}

	payload := slack.Payload{
		Text: fmt.Sprintf("%s (%s)", action, c.Path()),
		//Username: "yolo",
		Username:  username,
		Channel:   channel,
		IconEmoji: ":yolo:",
		//IconUrl:     profile["picture"].(string),
		Attachments: []slack.Attachment{attachment},
	}
	go func() { // do it asynchronously to avoid blocking
		if err := slack.Send(SLACK_WEBHOOK_URL, "", payload); len(err) > 0 {
			c.Logger().Warn("failed to send user action to slack: ", fmt.Sprintf("%v", err))
		}
	}()
}

func (s *Server) sendUserErrorToSlack(c echo.Context, err error) {
	s.ga(c, ga.NewException().Description(err.Error()))
	s.sendUserActionToSlack(c, fmt.Sprintf("error: %v", err), "#ff0000", "#yolodebug", "#yolodebug")
}

func (s *Server) GetIPA(c echo.Context) error {
	s.ga(c, ga.NewPageview())
	s.sendUserActionToSlack(c, "IPA download", "#0000ff", "#yolologs", "#yolologs")
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

func (s *Server) GetZIP(c echo.Context) error {
	s.ga(c, ga.NewPageview())
	s.sendUserActionToSlack(c, "ZIP download", "#0000ff", "#yolologs", "#yolologs")
	id := c.Param("*")
	arts, err := s.client.GetArtifacts(id, true)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	for _, art := range arts {
		if !reZIP.MatchString(art.PrettyPath) {
			continue
		}

		// Download client
		rc, err := s.client.GetArtifact(art)
		if err != nil {
			return err
		}

		return c.Stream(http.StatusOK, "application/zip", rc)
	}

	return echo.NewHTTPError(http.StatusInternalServerError, "ZIP not found")
}

func (s *Server) GetAPK(c echo.Context) error {
	s.ga(c, ga.NewPageview())
	s.sendUserActionToSlack(c, "Android download", "#00ff00", "#yolologs", "#yolologs")
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

func (s *Server) ListReleaseZIPJson(c echo.Context) error {
	return s.ListReleaseJson(c, MAC_STAFF_JOB)
}

func (s *Server) ListReleaseIOSJson(c echo.Context) error {
	return s.ListReleaseJson(c, IOS_STAFF_JOB)
}

func (s *Server) ListReleaseIOSBetaJson(c echo.Context) error {
	return s.ListReleaseJson(c, IOS_YOLO_JOB)
}

func (s *Server) ListReleaseAndroidJson(c echo.Context) error {
	return s.ListReleaseJson(c, ANDROID_STAFF_JOB)
}

func (s *Server) ListReleaseAndroidBetaJson(c echo.Context) error {
	return s.ListReleaseJson(c, ANDROID_YOLO_JOB)
}

func (s *Server) ListReleaseJson(c echo.Context, job string) error {
	s.ga(c, ga.NewPageview())
	// FIXME: reuse code from ListRelease
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
		case IOS_YOLO_JOB, IOS_STAFF_JOB:
			prBranch := fmt.Sprintf("build/%d", build.BuildNum)
			href = fmt.Sprintf(`itms-services://?action=download-manifest&url=%s/auth/itms/release/%s/%s`, s.hostUrl, s.getHash(prBranch), prBranch)
		case ANDROID_YOLO_JOB, ANDROID_STAFF_JOB:
			id := strconv.Itoa(build.BuildNum)
			androidToken := s.getHash(id)
			href = fmt.Sprintf(`%s/auth/apk/build/%s/%s`, s.hostUrl, androidToken, id)
		case MAC_STAFF_JOB:
			id := strconv.Itoa(build.BuildNum)
			href = fmt.Sprintf(`%s/auth/zip/build/%s/%s`, s.hostUrl, s.getHash(id), id)
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

func (s *Server) ListReleaseZip(c echo.Context) error {
	return s.ListRelease(c, MAC_STAFF_JOB)
}

func (s *Server) ListReleaseAndroid(c echo.Context) error {
	return s.ListRelease(c, ANDROID_STAFF_JOB)
}

func (s *Server) ListReleaseAndroidBeta(c echo.Context) error {
	return s.ListRelease(c, ANDROID_YOLO_JOB)
}

func (s *Server) ListReleaseIOS(c echo.Context) error {
	return s.ListRelease(c, IOS_STAFF_JOB)
}

func (s *Server) ListReleaseIOSBeta(c echo.Context) error {
	return s.ListRelease(c, IOS_YOLO_JOB)
}

func (s *Server) TVDash(c echo.Context) error {
	data := map[string]interface{}{}

	var err error
	if data["android_staff"], err = s.GetReleasesByDate(c, ANDROID_STAFF_JOB); err != nil {
		return err
	}
	if data["android_yolo"], err = s.GetReleasesByDate(c, ANDROID_YOLO_JOB); err != nil {
		return err
	}
	if data["ios_staff"], err = s.GetReleasesByDate(c, IOS_STAFF_JOB); err != nil {
		return err
	}
	if data["ios_yolo"], err = s.GetReleasesByDate(c, IOS_YOLO_JOB); err != nil {
		return err
	}
	if data["mac_yolo"], err = s.GetReleasesByDate(c, MAC_STAFF_JOB); err != nil {
		return err
	}
	data["android_staff_job"] = ANDROID_STAFF_JOB
	data["android_yolo_job"] = ANDROID_YOLO_JOB
	data["ios_staff_job"] = IOS_STAFF_JOB
	data["ios_yolo_job"] = IOS_YOLO_JOB
	data["mac_job"] = MAC_STAFF_JOB

	return c.Render(http.StatusOK, "tv-dash.tmpl", data)
}

type ReleaseEntry struct {
	Failed     bool
	InProgress bool
	BranchKind string
	BranchLink string
	Author     string
	CommitLink string
	Subject    string
	BuildLink  string
	Age        string
	Duration   string
	Diff       string
	HREF       string
}

type ReleasesByDate []ReleasesDay

type ReleasesDay struct {
	Date     string
	Releases []ReleaseEntry
}

func (s *Server) ga(c echo.Context, event interface{}) {
	if s.NoGa {
		return
	}
	go func() {
		analytics, err := ga.NewClient("UA-124224137-3")
		if err != nil {
			c.Logger().Warn("failed to initialize GA client: ", fmt.Sprintf("%v", err))
			return
		}

		analytics.ClientID(clientIDFromContext(c))
		analytics.UserAgentOverride(c.Request().Header.Get("User-Agent"))
		analytics.DocumentLocationURL(c.Request().URL.String())
		ref := c.Request().Header.Get("Referrer")
		if ref == "" {
			ref = c.Request().Header.Get("Origin")
		}
		analytics.DocumentReferrer(ref)
		analytics.IPOverride(c.RealIP())
		switch e := event.(type) {
		case *ga.Pageview:
			if err := analytics.Send(e); err != nil {
				c.Logger().Warn("failed to send analytics: ", fmt.Sprintf("%v", err))
			}
		case *ga.Exception:
			if err := analytics.Send(e); err != nil {
				c.Logger().Warn("failed to send analytics: ", fmt.Sprintf("%v", err))
			}
		case *ga.Event:
			if err := analytics.Send(e); err != nil {
				c.Logger().Warn("failed to send analytics: ", fmt.Sprintf("%v", err))
			}
		default:
			c.Logger().Warn("unknown event type %T", e)
		}
	}()
}

func (s *Server) ListRelease(c echo.Context, job string) error {
	s.ga(c, ga.NewPageview())
	s.sendUserActionToSlack(c, fmt.Sprintf("List Releases (%s)", job), "#00ffff", "#yolologs", "#yolodebug")

	data := map[string]interface{}{}

	var err error
	if data["ReleasesByDate"], err = s.GetReleasesByDate(c, job); err != nil {
		return err
	}
	data["job"] = job

	return c.Render(http.StatusOK, "release-list.tmpl", data)
}

func (s *Server) GetReleasesByDate(c echo.Context, job string) (*ReleasesByDate, error) {
	s.ga(c, ga.NewPageview())
	releasesByDateMap := map[string][]ReleaseEntry{}

	oncePerBranch := map[string]bool{}
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

		oncePerBranch[build.Branch] = true

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
		age := durafmt.ParseShort(time.Since(*updateTime)).String()

		var href string
		switch job {
		case IOS_YOLO_JOB, IOS_STAFF_JOB:
			iosToken := s.getHash(prBranch)
			href = fmt.Sprintf(`itms-services://?action=download-manifest&url=%s/auth/itms/release/%s/%s`, s.hostUrl, iosToken, prBranch)

			// if not on mobile, don't use the itms-services:// prefix
			if c.Request().Host == "localhost:3670" {
				// FIXME: replace by a user-agent check for mobile vs desktop
				href = fmt.Sprintf(`%s/auth/itms/release/%s/%s`, s.hostUrl, iosToken, prBranch)
			}
		case ANDROID_YOLO_JOB, ANDROID_STAFF_JOB:
			id := strconv.Itoa(build.BuildNum)
			androidToken := s.getHash(id)
			href = fmt.Sprintf(`%s/auth/apk/build/%s/%s`, s.hostUrl, androidToken, id)
		case MAC_STAFF_JOB:
			id := strconv.Itoa(build.BuildNum)
			href = fmt.Sprintf(`%s/auth/zip/build/%s/%s`, s.hostUrl, s.getHash(id), id)
		default:
			return nil, echo.NewHTTPError(http.StatusInternalServerError, "unknow job")
		}
		release := ReleaseEntry{
			Failed:     build.Failed != nil && *build.Failed == true,
			InProgress: build.StopTime == nil,
			BranchKind: branchKind,
			BranchLink: branchLink,
			Author:     build.User.Login,
			CommitLink: commitLink,
			Subject:    subject,
			BuildLink:  buildLink,
			Age:        age,
			Duration:   duration,
			Diff:       diff,
			HREF:       href,
		}
		if _, ok := releasesByDateMap[currentDate]; !ok {
			releasesByDateMap[currentDate] = []ReleaseEntry{}
		}
		releasesByDateMap[currentDate] = append(releasesByDateMap[currentDate], release)
	}

	releasesByDate := ReleasesByDate{}
	dates := []string{}
	for date := range releasesByDateMap {
		dates = append(dates, date)
	}
	sort.Sort(sort.Reverse(sort.StringSlice(dates)))

	for _, date := range dates {
		releasesByDate = append(releasesByDate, ReleasesDay{
			Date:     date,
			Releases: releasesByDateMap[date],
		})
	}
	return &releasesByDate, nil
}

func (s *Server) ReleaseIOS(c echo.Context) error {
	pull := c.Param("*")
	builds, err := s.client.Builds(pull, IOS_STAFF_JOB, 100, 0)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	if len(builds) == 0 {
		return echo.NewHTTPError(http.StatusInternalServerError, "no valid build(s) found")
	}

	token := s.getHash(pull)
	html := fmt.Sprintf(`<h1><a href="itms-services://?action=download-manifest&url=%s/auth/itms/release/%s/%[3]s">download - %[3]s </a></h1>`, s.hostUrl, token, pull)
	if strings.HasPrefix(pull, "pull/") {
		html += fmt.Sprintf(`<h2><a href="https://github.com/berty/berty/%s">GitHub PR</a></h2>`, pull)
	}

	return c.HTML(http.StatusOK, html)
}

func (s *Server) Itms(c echo.Context) error {
	s.ga(c, ga.NewPageview())
	s.sendUserActionToSlack(c, "ITMS download", "#0000ff", "#yolologs", "#yolologs")

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
		builds, err := s.client.Builds(pull, IOS_STAFF_JOB, 100, 0)
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
	url := fmt.Sprintf("%s/auth/ipa/build/%s/%s", s.hostUrl, token, id)

	previewTexts := []string{
		"😱",
		"🤡",
		"🧚‍♀️",
		"🥰",
		"🙌",
	}
	previewText := previewTexts[rand.Intn(len(previewTexts))]
	var bundleID string
	switch theBuild.BuildParameters["CIRCLE_JOB"] {
	case "client.rn.ios":
		bundleID = BUNDLE_STAFF_ID
	case IOS_YOLO_JOB:
		bundleID = BUNDLE_YOLO_ID
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
