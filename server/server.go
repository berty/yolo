package server

import (
	"github.com/berty/staff/tools/release/pkg/circle"
	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
)

const USER = "berty"
const SECRET = "hu2go5ru"

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
	e        *echo.Echo
}

// Basic auth
func basicAuth(username, password string) func(string, string, echo.Context) (bool, error) {
	return func(u, p string, c echo.Context) (bool, error) {
		return username == u && password == p, nil
	}
}

func NewServer(cfg *ServerConfig) *Server {
	e := echo.New()
	s := &Server{
		client:   cfg.Client,
		addr:     cfg.Addr,
		hostname: cfg.Hostname,
		e:        e,
	}

	e.GET("/build/:build_id", s.Build)
	e.GET("/builds/*", s.Builds)
	e.GET("/ipa/build/:build_id", s.GetIPA)
	e.GET("/release/ios/*", s.ReleaseIOS)
	e.GET("/artifacts/:build_id", s.Artifacts)

	e.Use(middleware.Logger())

	if cfg.Password != "" {
		e.Use(middleware.BasicAuth(basicAuth(cfg.Username, cfg.Password)))
	}

	return s
}

func (s *Server) Start() error {
	return s.e.Start(s.addr)
}
