package circle

import circleci "github.com/jszwedko/go-circleci"

func (c *Client) Projects() ([]*circleci.Project, error) {
	return c.ci.ListProjects()
}
