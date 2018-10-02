package server

import (
	"github.com/berty/staff/tools/release/pkg/circle"
	"github.com/labstack/echo"
)

type httperror struct {
	message string `json:message`
}

type Server struct {
	client *circle.Client
	e      *echo.Echo
}

func NewServer(client *circle.Client) *Server {
	e := echo.New()
	s := &Server{client, e}

	e.GET("/build/:build_id", s.Build)
	// e.GET("/builds", e.Build)
	// e.GET("/artifacts/:build_id", e.Build)
	// e.GET("/release/:build_id", e.Build)

	return s
}

func (s *Server) Start(addr string) error {
	return s.e.Start(addr)
}
