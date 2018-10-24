package server

import (
	"crypto/md5"
	"fmt"
	"math/rand"
	"net/http"
	"regexp"

	"github.com/berty/staff/tools/release/pkg/circle"
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

type Server struct {
	client   *circle.Client
	addr     string
	hostname string
	salt     string
	e        *echo.Echo
}

var letterRunes = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

func randStringRunes(n int) string {
	b := make([]rune, n)
	for i := range b {
		b[i] = letterRunes[rand.Intn(len(letterRunes))]
	}
	return string(b)
}

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

	e.GET("/", func(c echo.Context) error {
		// FIXME: conditional depending on the user agent (android || ios)
		return c.Redirect(http.StatusTemporaryRedirect, "/release/ios")
	})
	e.GET("/build/:build_id", s.Build)
	e.GET("/builds/*", s.Builds)
	e.GET("/release/ios/*", s.ReleaseIOS)
	e.GET("/release/ios", s.ListReleaseIOS)
	e.GET("/artifacts/:build_id", s.Artifacts)

	// No auth
	e.GET("/ipa/build/:token/*", s.GetIPA)
	e.GET("/itms/release/:token/*", s.Itms)
	exclude := regexp.MustCompile("^/ipa/build/.+$|^/itms/release/.+$")

	e.Use(middleware.Logger())
	if cfg.Password != "" {
		e.Use((s.basicAuth(cfg.Username, cfg.Password, exclude)))
	}

	return s
}

// Basic auth
func (s *Server) basicAuth(username, password string, exclude *regexp.Regexp) func(next echo.HandlerFunc) echo.HandlerFunc {
	auth := middleware.BasicAuth(func(u, p string, c echo.Context) (bool, error) {
		return username == u && password == p, nil
	})

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			if exclude.MatchString(c.Path()) {
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
	return s.e.Start(s.addr)
}
