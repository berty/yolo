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
}

func New(token, username, repo string) *Client {
	httpclient := &http.Client{
		Timeout: time.Second * 10,
	}

	ci := &circleci.Client{Token: token, HTTPClient: httpclient}
	return &Client{ci, username, repo, token}
}

// func (c *Client) client() *http.Client {
// 	return http.DefaultClient
// }

// func (c *Client) request(bodyStruct interface{}) error {
// 	req, err := http.NewRequest(method, u.String(), nil)
// 	if err != nil {
// 		return err
// 	}

// 	req.Header.Add("Accept", "application/json")
// 	req.Header.Add("Content-Type", "application/json")

// 	if bodyStruct != nil {
// 		b, err := json.Marshal(bodyStruct)
// 		if err != nil {
// 			return err
// 		}

// 		req.Body = nopCloser{bytes.NewBuffer(b)}
// 	}

// 	resp, err := c.client().Do(req)
// 	if err != nil {
// 		return err
// 	}
// 	defer resp.Body.Close()

// 	if responseStruct != nil {
// 		err = json.NewDecoder(resp.Body).Decode(responseStruct)
// 		if err != nil {
// 			return err
// 		}
// 	}

// }
