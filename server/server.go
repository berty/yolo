package server

import (
	"github.com/berty/staff/tools/release/pkg/circle"
	"github.com/labstack/echo"
)

type httperror struct {
	message string `json:message`
}

type Server struct {
	client   *circle.Client
	hostname string
	e        *echo.Echo
}

func NewServer(client *circle.Client, hostname string) *Server {
	e := echo.New()
	s := &Server{client, hostname, e}

	e.GET("/build/:build_id", s.Build)
	e.GET("/builds/*", s.Builds)
	e.GET("/ipa/build/:build_id", s.GetIPA)
	e.GET("/release/ios/*", s.ReleaseIOS)
	e.GET("/artifacts/:build_id", s.Artifacts)

	return s
}

func (s *Server) Start(addr string) error {
	return s.e.Start(addr)
}
