package circle

import (
	"net/http"
	"time"

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

func New(token, username, repo string) *Client {
	httpclient := &http.Client{
		Timeout: time.Second * 10,
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
