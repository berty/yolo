package bintray

import (
	"encoding/json"
	"io"
	"net/http"

	"go.uber.org/zap"
)

func New(subject, apikey string, logger *zap.Logger) *Client {
	if logger == nil {
		logger = zap.NewNop()
	}
	return &Client{
		subject:    subject,
		apikey:     apikey,
		baseAPI:    "https://bintray.com/api/v1",
		httpClient: &http.Client{},
		logger:     logger,
	}
}

type Client struct {
	subject    string
	apikey     string
	baseAPI    string
	httpClient *http.Client
	logger     *zap.Logger
}

func (c Client) Subject() string {
	return c.subject
}

func (c Client) GetUser(subject string) (GetUserResponse, error) {
	var result GetUserResponse
	err := c.doGet("/users/"+subject, &result)
	return result, err
}

func (c Client) GetOrganization(subject string) (GetOrganizationResponse, error) {
	var result GetOrganizationResponse
	err := c.doGet("/orgs/"+subject, &result)
	return result, err
}

func (c Client) GetRepositories(subject string) (GetRepositoriesResponse, error) {
	var result GetRepositoriesResponse
	err := c.doGet("/repos/"+subject, &result)
	return result, err
}

func (c Client) GetRepository(subject, repo string) (GetRepositoryResponse, error) {
	var result GetRepositoryResponse
	err := c.doGet("/repos/"+subject+"/"+repo, &result)
	return result, err
}

func (c Client) GetPackages(subject, repo string) (GetPackagesResponse, error) {
	var result GetPackagesResponse
	err := c.doGet("/repos/"+subject+"/"+repo+"/packages", &result)
	return result, err
}

func (c Client) GetPackage(subject, repo, pkg string) (GetPackageResponse, error) {
	var result GetPackageResponse
	err := c.doGet("/packages/"+subject+"/"+repo+"/"+pkg, &result)
	return result, err
}

func (c Client) GetPackageFiles(subject, repo, pkg string) (GetPackageFilesResponse, error) {
	var result GetPackageFilesResponse
	err := c.doGet("/packages/"+subject+"/"+repo+"/"+pkg+"/files", &result)
	return result, err
}

func (c Client) GetVersion(subject, repo, pkg, version string) (GetVersionResponse, error) {
	var result GetVersionResponse
	err := c.doGet("/packages/"+subject+"/"+repo+"/"+pkg+"/versions/"+version+"?attribute_values=1", &result)
	return result, err
}

func DownloadContent(url string, w http.ResponseWriter) error {
	resp, err := http.Get(url)
	if err != nil {
		return err
	}

	defer resp.Body.Close()
	_, err = io.Copy(w, resp.Body)
	return err
}

func (c Client) doGet(path string, dest interface{}) error {
	c.logger.Debug("bintray.GET", zap.String("path", path))
	req, err := http.NewRequest("GET", c.baseAPI+path, nil)
	if err != nil {
		return err
	}
	req.SetBasicAuth(c.subject, c.apikey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	err = json.NewDecoder(resp.Body).Decode(&dest)
	if err != nil {
		return err
	}

	return nil
}
