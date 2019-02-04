package server

import (
	"crypto/md5"
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"math/rand"
	"net/http"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/berty/staff/tools/release/pkg/circle"
	"github.com/gobuffalo/packr"
	circleci "github.com/jszwedko/go-circleci"
	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
	"github.com/oxtoacart/bpool"
)

var reAndroidAgent = regexp.MustCompile("(?i)android")
var reIOSAgent = regexp.MustCompile("(?i)iPad|iPhone|iPod")

type httperror struct {
	message string `json:message`
}

type ServerConfig struct {
	Client *circle.Client

	Addr     string
	Hostname string

	Username string
	Password string

	Debug   bool
	NoSlack bool
}

type buildMap map[int]*circleci.Build

func (m buildMap) Sorted() []*circleci.Build {
	buildMapMutex.Lock()
	defer buildMapMutex.Unlock()
	keys := []int{}
	for k := range m {
		keys = append(keys, k)
	}
	sort.Sort(sort.Reverse(sort.IntSlice(keys)))
	slice := []*circleci.Build{}
	for _, k := range keys {
		slice = append(slice, m[k])
	}
	return slice
}

type Cache struct {
	builds          buildMap
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
	hostUrl  string
	salt     string
	e        *echo.Echo
	cache    Cache
	Debug    bool
	NoSlack  bool

	// templates/static
	funcmap        *ctxFuncmap
	templatesMutex sync.Mutex
	templates      map[string]*template.Template
	bufpool        *bpool.BufferPool
	StaticBox      *packr.Box
	TemplatesBox   *packr.Box
}

var letterRunes = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

func randStringRunes(n int) string {
	b := make([]rune, n)
	for i := range b {
		b[i] = letterRunes[rand.Intn(len(letterRunes))]
	}
	return string(b)
}

func NewServer(cfg *ServerConfig) (*Server, error) {
	var hostUrl string
	if strings.HasPrefix(cfg.Hostname, "localhost") || strings.HasPrefix(cfg.Hostname, "127.0.0.1") {
		hostUrl = fmt.Sprintf("http://%s", cfg.Hostname)
	} else {
		hostUrl = fmt.Sprintf("https://%s", cfg.Hostname)
	}

	randStr := randStringRunes(10)
	e := echo.New()
	e.Debug = cfg.Debug
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.Gzip())
	templatesBox := packr.NewBox("../templates")
	s := &Server{
		client:       cfg.Client,
		addr:         cfg.Addr,
		hostname:     cfg.Hostname,
		hostUrl:      hostUrl,
		e:            e,
		salt:         randStr,
		TemplatesBox: &templatesBox,
		Debug:        cfg.Debug,
		NoSlack:      cfg.NoSlack,
	}
	e.HTTPErrorHandler = func(err error, c echo.Context) {
		s.sendUserErrorToSlack(c, err)
		e.DefaultHTTPErrorHandler(err, c)
	}
	e.Renderer = s // see https://echo.labstack.com/guide/templates for details

	if err := s.loadTemplates(); err != nil {
		return nil, err
	}

	e.File("/favicon.ico", "assets/favicon.ico")
	e.Static("/assets", "assets") // FIXME: use packr box

	e.GET("/", func(c echo.Context) error {
		header := c.Request().Header
		if agent := header.Get("User-Agent"); agent != "" {
			fmt.Println(agent)
			if reAndroidAgent.MatchString(agent) {
				return c.Redirect(http.StatusTemporaryRedirect, "/release/android")
			}
		}

		return c.Redirect(http.StatusTemporaryRedirect, "/release/ios")
	})

	redirectUrl := fmt.Sprintf(s.hostUrl + "/oauth/callback")

	o := NewOAuth(redirectUrl, e)
	oauth := e.Group("/oauth")
	oauth.GET("/callback", o.CallbackHandler("/"))
	oauth.GET("/login", o.LoginHandler())
	oauth.GET("/logout", o.LogoutHandler(s.hostUrl))

	release := e.Group("release")
	release.Use(o.ProtectMiddleware("/oauth/login", func(profile map[string]interface{}) bool {
		if v, ok := profile["https://yolo.berty.io/groups"]; ok {
			if groups, ok := v.([]interface{}); ok {
				for _, group := range groups {
					if g, ok := group.(string); ok && g == "yolo" {
						return true
					}
				}
			}
		}

		return false
	}))

	release.GET("/ios", s.ListReleaseIOSBeta)
	release.GET("/android", s.ListReleaseAndroidBeta)

	release.GET("/ios-staff.json", s.ListReleaseIOSJson)
	release.GET("/ios.json", s.ListReleaseIOSBetaJson)
	release.GET("/android.json", s.ListReleaseAndroidJson)

	staffRelease := e.Group("/release/staff")
	staffRelease.Use(o.ProtectMiddleware("/oauth/login", func(profile map[string]interface{}) bool {
		if v, ok := profile["https://yolo.berty.io/groups"]; ok {
			if groups, ok := v.([]interface{}); ok {
				for _, group := range groups {
					if g, ok := group.(string); ok && g == "staff" {
						return true
					}
				}
			}
		}

		return false
	}))
	staffRelease.GET("/ios/*", s.ReleaseIOS)
	staffRelease.GET("/ios", s.ListReleaseIOS)
	staffRelease.GET("/android", s.ListReleaseAndroid)
	staffRelease.GET("/tv", s.TVDash)

	auth := e.Group("/auth")
	if cfg.Password != "" {
		excludeToken := regexp.MustCompile("^/auth/ipa/build/.+$|^/auth/apk/build/.+$|^/auth/itms/release/.+$")
		auth.Use((s.basicAuth(cfg.Username, cfg.Password, excludeToken)))
	}
	auth.GET("/build/:build_id", s.Build)
	auth.GET("/builds/*", s.Builds)
	auth.GET("/artifacts/:build_id", s.Artifacts)
	auth.GET("/ipa/build/:token/*", s.GetIPA)
	auth.GET("/apk/build/:token/*", s.GetAPK)
	auth.HEAD("/ipa/build/:token/*", func(c echo.Context) error {
		return c.String(405, "405")
	})
	auth.GET("/itms/release/:token/*", s.Itms)

	return s, nil
}

// Basic auth
func (s *Server) basicAuth(username, password string, excludeToken *regexp.Regexp) func(next echo.HandlerFunc) echo.HandlerFunc {
	auth := middleware.BasicAuth(func(u, p string, c echo.Context) (bool, error) {
		return username == u && password == p, nil
	})

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
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
			time.Sleep(10 * time.Second)
		}
	}()
	return s.e.Start(s.addr)
}

func (s *Server) refreshCache() error {
	var (
		allBuilds       = make(buildMap, 0)
		mostRecentBuild = s.cache.mostRecentBuild
	)

	if s.cache.mostRecentBuild.IsZero() { // first fill
		log.Print("initial builds fetch")
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
			for _, build := range builds {
				allBuilds[build.BuildNum] = build
			}
			if len(builds) < 100 {
				break
			}
			buildMapMutex.Lock()
			s.cache.builds = allBuilds
			buildMapMutex.Unlock()
		}
		log.Printf("fetched %d initial builds", len(s.cache.builds))
	} else { // just the difference
		allBuilds = s.cache.builds
		previousMostRecentBuild := mostRecentBuild
		builds, err := s.client.Builds("", "", 100, 0)
		if err != nil {
			return err
		}
		changed := 0
		for i := len(builds) - 1; i >= 0; i-- {
			build := builds[i]
			if build.StartTime == nil && build.StopTime == nil {
				continue
			}
			updateTime := build.StartTime
			if build.StopTime != nil {
				updateTime = build.StopTime
			}
			if updateTime.After(mostRecentBuild) {
				mostRecentBuild = *updateTime
			}
			if updateTime.After(previousMostRecentBuild) {
				allBuilds[build.BuildNum] = build
				changed++
			}
		}
		if changed == 0 {
			return nil
		}
		log.Printf("fetched %d new builds", changed)
	}

	buildMapMutex.Lock()
	defer buildMapMutex.Unlock()
	s.cache.builds = allBuilds
	s.cache.mostRecentBuild = mostRecentBuild
	return nil
}

var buildMapMutex sync.Mutex
