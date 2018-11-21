package server

import (
	"crypto/md5"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"regexp"
	"time"

	"github.com/berty/staff/tools/release/pkg/circle"
	circleci "github.com/jszwedko/go-circleci"
	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
)

type httperror struct {
	message string `json:message`
}

type ServerConfig struct {
	Client *circle.Client

	Addr     string
	Hostname string

	Username string
	Password string
}

type Cache struct {
	builds          []*circleci.Build
	mostRecentBuild time.Time
}

func (c Cache) String() string {
	out, _ := json.Marshal(c)
	return string(out)
}

type Server struct {
	client   *circle.Client
	addr     string
	hostname string
	salt     string
	e        *echo.Echo
	cache    Cache
}

var letterRunes = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

func randStringRunes(n int) string {
	b := make([]rune, n)
	for i := range b {
		b[i] = letterRunes[rand.Intn(len(letterRunes))]
	}
	return string(b)
}

var faviconHTMLHeader = `<link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16x16.png">
<link rel="manifest" href="/assets/site.webmanifest">
<link rel="mask-icon" href="/assets/safari-pinned-tab.svg" color="#5bbad5">
<meta name="msapplication-TileColor" content="#262844">
<meta name="theme-color" content="#ffffff">`

func NewServer(cfg *ServerConfig) *Server {
	randStr := randStringRunes(10)
	e := echo.New()
	s := &Server{
		client:   cfg.Client,
		addr:     cfg.Addr,
		hostname: cfg.Hostname,
		e:        e,
		salt:     randStr,
	}

	e.File("/favicon.ico", "assets/favicon.ico")
	e.Static("/assets", "assets")

	e.GET("/", func(c echo.Context) error {
		// FIXME: conditional depending on the user agent (android || ios)
		return c.Redirect(http.StatusTemporaryRedirect, "/release/ios")
	})
	e.GET("/build/:build_id", s.Build)
	e.GET("/builds/*", s.Builds)
	e.GET("/release/ios/*", s.ReleaseIOS)
	e.GET("/release/ios", s.ListReleaseIOS)
	e.GET("/release/ios.json", s.ListReleaseIOSJson)
	e.GET("/artifacts/:build_id", s.Artifacts)

	// No auth
	e.GET("/ipa/build/:token/*", s.GetIPA)
	e.GET("/itms/release/:token/*", s.Itms)
	excludeToken := regexp.MustCompile("^/ipa/build/.+$|^/itms/release/.+$")
	exclude := regexp.MustCompile("^/release/ios")

	e.Use(middleware.Logger())
	if cfg.Password != "" {
		e.Use((s.basicAuth(cfg.Username, cfg.Password, exclude, excludeToken)))
	}

	return s
}

// Basic auth
func (s *Server) basicAuth(username, password string, exclude, excludeToken *regexp.Regexp) func(next echo.HandlerFunc) echo.HandlerFunc {
	auth := middleware.BasicAuth(func(u, p string, c echo.Context) (bool, error) {
		return username == u && password == p, nil
	})

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			if exclude.MatchString(c.Path()) {
				return next(c)
			}

			if excludeToken.MatchString(c.Path()) {
				if token := c.Param("token"); token != "" {
					h := s.getHash(c.Param("*"))
					if h == token {
						return next(c)
					}
				}
			}

			return auth(next)(c)
		}
	}
}

func (s *Server) getHash(id string) string {
	return fmt.Sprintf("%x", md5.Sum([]byte(id+s.salt)))
}

func (s *Server) Start() error {
	go func() {
		for {
			if err := s.refreshCache(); err != nil {
				log.Printf("refresh failed: %+v", err)
			}
			time.Sleep(5 * time.Second)
		}
	}()
	return s.e.Start(s.addr)
}

func (s *Server) refreshCache() error {
	var (
		allBuilds       []*circleci.Build
		mostRecentBuild = s.cache.mostRecentBuild
	)

	if s.cache.mostRecentBuild.IsZero() { // first fill
		log.Print("fetch all builds")
		for page := 0; page < 20; page++ {
			builds, err := s.client.Builds("", "", 100, page*100)
			if err != nil {
				return err
			}
			for _, build := range builds {
				if build.StopTime != nil && build.StopTime.After(mostRecentBuild) {
					mostRecentBuild = *build.StopTime
				}
			}
			allBuilds = append(allBuilds, builds...)
			if len(builds) < 100 {
				break
			}
			s.cache.builds = allBuilds
		}
	} else { // just the difference
		allBuilds = s.cache.builds
		previousMostRecentBuild := mostRecentBuild
		builds, err := s.client.Builds("", "", 100, 0)
		if err != nil {
			return err
		}
		hasChanged := false
		for i := len(builds) - 1; i >= 0; i-- {
			build := builds[i]
			updateTime := build.StartTime
			if build.StopTime != nil {
				updateTime = build.StopTime
			}
			if updateTime.After(mostRecentBuild) {
				mostRecentBuild = *updateTime
			}
			if updateTime.After(previousMostRecentBuild) {
				allBuilds = append([]*circleci.Build{build}, allBuilds...)
				hasChanged = true
			}
		}
		if !hasChanged {
			return nil
		}
	}

	// FIXME: lock
	s.cache.builds = allBuilds
	s.cache.mostRecentBuild = mostRecentBuild
	return nil
}
