package server

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo"
)

func (s *Server) Build(c echo.Context) error {
	id := c.Param("build_id")
	i, err := strconv.Atoi(id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err)
	}

	ret, err := s.client.Build(i)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err)
	}

	return c.JSON(http.StatusOK, ret)
}
