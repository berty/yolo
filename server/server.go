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

type Server struct {
	client   *circle.Client
	hostname string
	e        *echo.Echo
}

// Basic auth
func basicAuth(username, password string, c echo.Context) (bool, error) {
	return username == USER && password == SECRET, nil
}

func NewServer(client *circle.Client, hostname string) *Server {
	e := echo.New()
	s := &Server{client, hostname, e}

	e.GET("/build/:build_id", s.Build)
	e.GET("/builds/*", s.Builds)
	e.GET("/ipa/build/:build_id", s.GetIPA)
	e.GET("/release/ios/*", s.ReleaseIOS)
	e.GET("/artifacts/:build_id", s.Artifacts)

	e.Use(middleware.Logger())
	e.Use(middleware.BasicAuth(basicAuth))

	return s
}

func (s *Server) Start(addr string) error {
	return s.e.Start(addr)
}
