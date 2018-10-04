package circle

import (
	"bytes"
	"io"
	"strconv"

	circleci "github.com/jszwedko/go-circleci"
)

func (c *Client) Builds(pull string, job string, limit, offset int) ([]*circleci.Build, error) {
	bs, err := c.ci.ListRecentBuildsForProject(c.username, c.repo, pull, "successful", limit, offset)
	if job == "" {
		return bs, err
	}

	var jbuild []*circleci.Build
	for _, b := range bs {
		if j, ok := b.BuildParameters["CIRCLE_JOB"]; ok {
			if j == job {
				jbuild = append(jbuild, b)
			}

		}
	}

	return jbuild, nil
}

func (c *Client) Build(build string) (*circleci.Build, error) {
	i, err := strconv.Atoi(build)
	if err != nil {
		return nil, err
	}

	return c.ci.GetBuild(c.username, c.repo, i)
}

func (c *Client) GetArtifact(art *circleci.Artifact) (io.ReadCloser, error) {
	res, err := c.http.Get(art.URL)
	return res.Body, err
}

func (c *Client) GetRawArtifact(art *circleci.Artifact) ([]byte, int64, error) {
	body, err := c.GetArtifact(art)

	buf := &bytes.Buffer{}
	nRead, err := io.Copy(buf, body)

	body.Close()

	return buf.Bytes(), nRead, err
}

func (c *Client) GetArtifacts(build string, token bool) ([]*circleci.Artifact, error) {
	i, err := strconv.Atoi(build)
	if err != nil {
		return nil, err
	}

	arts, err := c.ci.ListBuildArtifacts(c.username, c.repo, i)
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
