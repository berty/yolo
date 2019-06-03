package circle

import (
	"net/http"
	"time"

	"github.com/gregjones/httpcache"
	"github.com/gregjones/httpcache/diskcache"
	circleci "github.com/jszwedko/go-circleci"
)

// var defaultBaseURL = &url.URL{Host: "circleci.com", Scheme: "https", Path: "/api/v1/"}

type Client struct {
	ci       *circleci.Client
	username string
	repo     string
	token    string

	http *http.Client
}

func New(token, username, cacheDir, repo string) *Client {
	httpclient := &http.Client{
		Timeout: time.Second * 1800,
	}

	if cacheDir != "" {
		httpclient = httpcache.NewTransport(diskcache.New(cacheDir)).Client()
	}

	ci := &circleci.Client{Token: token, HTTPClient: httpclient}
	return &Client{
		ci:       ci,
		username: username,
		repo:     repo,
		token:    token,
		http:     httpclient,
	}
}
