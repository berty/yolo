package circle

import (
	circleci "github.com/jszwedko/go-circleci"
)

func (c *Client) Builds(pull string, limit, offset int) ([]*circleci.Build, error) {
	return c.ci.ListRecentBuildsForProject(c.username, c.repo, pull, "", limit, offset)
}

func (c *Client) Build(nbuild int) (*circleci.Build, error) {
	return c.ci.GetBuild(c.username, c.repo, nbuild)
}

func (c *Client) GetArtifacts(nbuild int, token bool) ([]*circleci.Artifact, error) {
	arts, err := c.ci.ListBuildArtifacts(c.username, c.repo, nbuild)
	if err != nil {
		return nil, err
	}

	if token {
		for _, art := range arts {
			art.URL = art.URL + "?circle-token=" + c.token
		}
	}

	return arts, nil
}
