package server

import (
	"context"
	"encoding/base64"
	"encoding/gob"
	"encoding/json"
	"math/rand"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gorilla/sessions"
	"github.com/labstack/echo"
	"github.com/labstack/echo-contrib/session"
	"golang.org/x/oauth2"
)

const (
	AuthDomain    = "berty.eu.auth0.com"
	ClientID      = "yqYy0K16xwgWbwS3dISg87Iacz06PMmX"
	ClientSecret  = "laLoKBfijXRDkyksnX4OP-LgsWzWqMl41kcQp_XwUmM1KbWnI3dKRxdveuheHdue"
	SessionSecret = "***REMOVED***"
)

type OAuth struct {
	conf *oauth2.Config
	sf   *sessions.FilesystemStore
}

func NewOAuth(redirectUrl string, e *echo.Echo) *OAuth {
	conf := &oauth2.Config{
		ClientID:     ClientID,
		ClientSecret: ClientSecret,
		RedirectURL:  redirectUrl,
		Scopes:       []string{"openid", "profile"},
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://" + AuthDomain + "/authorize",
			TokenURL: "https://" + AuthDomain + "/oauth/token",
		},
	}

	sf := sessions.NewFilesystemStore("", []byte(SessionSecret))
	gob.Register(map[string]interface{}{})

	e.Use(session.Middleware(sf))

	// auth := e.Group(group)
	// auth.GET("/login", oauth.LoginHandler())
	// auth.GET("/callback", oauth.CallbackHandler("/"))

	return &OAuth{conf, sf}
}

func (o *OAuth) ProtectMiddleware(failureRedirect string, fverify func(map[string]interface{}) bool) func(next echo.HandlerFunc) echo.HandlerFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			if strings.HasSuffix(c.Path(), ".json") {
				return next(c)
			}

			sess, err := session.Get("auth-session", c)
			if err != nil {
				return c.Redirect(http.StatusTemporaryRedirect, failureRedirect)
			}

			profile, ok := sess.Values["profile"]
			if !ok {
				return c.Redirect(http.StatusTemporaryRedirect, failureRedirect)
			}

			if mapProfile, ok := profile.(map[string]interface{}); ok {
				if fverify(mapProfile) {
					return next(c)
				}
			}

			return echo.NewHTTPError(http.StatusUnauthorized)
		}
	}
}

func (o *OAuth) LoginHandler() func(echo.Context) error {
	return func(c echo.Context) error {
		aud := "https://" + AuthDomain + "/userinfo"

		sess, err := session.Get("state", c)
		if err != nil {
			c.Logger().Warn("invalid session: ", err.Error())
		}

		if sess == nil {
			return echo.NewHTTPError(http.StatusInternalServerError, "invalid session")
		}

		b := make([]byte, 32)
		rand.Read(b)
		state := base64.StdEncoding.EncodeToString(b)

		sess.Values["state"] = state
		if err := sess.Save(c.Request(), c.Response()); err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}

		audience := oauth2.SetAuthURLParam("audience", aud)
		url := o.conf.AuthCodeURL(state, audience)

		return c.Redirect(http.StatusTemporaryRedirect, url)
	}
}

func (o *OAuth) LogoutHandler(redirectUrl string) func(echo.Context) error {
	return func(c echo.Context) error {
		var logoutUrl *url.URL
		logoutUrl, err := url.Parse("https://" + AuthDomain)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}

		for _, ck := range []string{"auth-session", "state"} {
			cookie, err := c.Cookie(ck)
			if err == nil {
				cookie.MaxAge = -1 // erase the cookie
				cookie.Value = ""
				cookie.Path = "/"
				cookie.Expires = time.Unix(0, 0)
				cookie.HttpOnly = true
				c.SetCookie(cookie)

			} else {
				c.Logger().Warn("tryin to logout with no cookie set")
			}
		}

		logoutUrl.Path += "/v2/logout"
		parameters := url.Values{}
		parameters.Add("returnTo", redirectUrl)
		parameters.Add("client_id", ClientID)
		logoutUrl.RawQuery = parameters.Encode()

		return c.Redirect(http.StatusTemporaryRedirect, logoutUrl.String())
	}
}

func (o *OAuth) CallbackHandler(redirectUrl string) func(echo.Context) error {
	return func(c echo.Context) error {
		state := c.QueryParam("state")
		sess, err := session.Get("state", c)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}

		if state != sess.Values["state"] {
			return echo.NewHTTPError(http.StatusInternalServerError, "invalid state")
		}

		code := c.QueryParam("code")
		token, err := o.conf.Exchange(context.TODO(), code)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}

		client := o.conf.Client(context.TODO(), token)
		resp, err := client.Get("https://" + AuthDomain + "/userinfo")
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}

		defer resp.Body.Close()

		var profile map[string]interface{}
		if err = json.NewDecoder(resp.Body).Decode(&profile); err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}

		sessAuth, err := session.Get("auth-session", c)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}

		sessAuth.Values["id_token"] = token.Extra("id_token")
		sessAuth.Values["access_token"] = token.AccessToken
		sessAuth.Values["profile"] = profile
		if err := sessAuth.Save(c.Request(), c.Response()); err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}

		return c.Redirect(http.StatusSeeOther, redirectUrl)
	}
}
