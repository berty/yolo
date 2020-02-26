package bintray

import "time"

type GetUserResponse struct {
	Name                           string    `json:"name"`
	FullName                       string    `json:"full_name"`
	GravatarID                     string    `json:"gravatar_id"`
	Repos                          []string  `json:"repos"`
	Organizations                  []string  `json:"organizations"`
	FollowersCount                 int       `json:"followers_count"`
	Registered                     time.Time `json:"registered"`
	QuotaUsedBytes                 int       `json:"quota_used_bytes"`
	FreeStorage                    int       `json:"free_storage"`
	FreeStorageQuotaLimit          int64     `json:"free_storage_quota_limit"`
	LastMonthFreeDownloads         int       `json:"last_month_free_downloads"`
	MonthlyFreeDownloadsQuotaLimit int64     `json:"monthly_free_downloads_quota_limit"`
}

type GetOrganizationResponse struct {
	Name           string    `json:"name"`
	Repos          []string  `json:"repos"`
	FollowersCount int       `json:"followers_count"`
	Registered     time.Time `json:"registered"`
	Owner          string    `json:"owner"`
	FullName       string    `json:"full_name"`
	Members        []struct {
		Name string `json:"name"`
		Type string `json:"type"`
	} `json:"members"`
	QuotaUsedBytes                 int   `json:"quota_used_bytes"`
	FreeStorage                    int   `json:"free_storage"`
	FreeStorageQuotaLimit          int64 `json:"free_storage_quota_limit"`
	LastMonthFreeDownloads         int   `json:"last_month_free_downloads"`
	MonthlyFreeDownloadsQuotaLimit int64 `json:"monthly_free_downloads_quota_limit"`
}

type GetRepositoriesResponse []struct {
	Name        string    `json:"name"`
	Owner       string    `json:"owner"`
	LastUpdated time.Time `json:"lastUpdated"`
}

type GetRepositoryResponse struct {
	Name            string    `json:"name"`
	Owner           string    `json:"owner"`
	Type            string    `json:"type"`
	Private         bool      `json:"private"`
	Premium         bool      `json:"premium"`
	Desc            string    `json:"desc"`
	Labels          []string  `json:"labels"`
	Created         time.Time `json:"created"`
	PackageCount    int       `json:"package_count"`
	GpgUseOwnerKey  bool      `json:"gpg_use_owner_key"`
	GpgSignFiles    bool      `json:"gpg_sign_files"`
	GpgSignMetadata bool      `json:"gpg_sign_metadata"`
}

type GetPackagesResponse []struct {
	Name   string `json:"name"`
	Linked bool   `json:"linked"`
}

type GetPackageResponse struct {
	Name                   string        `json:"name"`
	Repo                   string        `json:"repo"`
	Owner                  string        `json:"owner"`
	Desc                   string        `json:"desc"`
	Labels                 []string      `json:"labels"`
	AttributeNames         []string      `json:"attribute_names"`
	Licenses               []string      `json:"licenses"`
	CustomLicenses         []interface{} `json:"custom_licenses"`
	FollowersCount         int           `json:"followers_count"`
	Created                time.Time     `json:"created"`
	WebsiteURL             string        `json:"website_url"`
	IssueTrackerURL        string        `json:"issue_tracker_url"`
	GithubRepo             string        `json:"github_repo"`
	GithubReleaseNotesFile string        `json:"github_release_notes_file"`
	PublicDownloadNumbers  bool          `json:"public_download_numbers"`
	PublicStats            bool          `json:"public_stats"`
	LinkedToRepos          []interface{} `json:"linked_to_repos"`
	Versions               []string      `json:"versions"`
	LatestVersion          string        `json:"latest_version"`
	Updated                time.Time     `json:"updated"`
	RatingCount            int           `json:"rating_count"`
	SystemIds              []interface{} `json:"system_ids"`
	VcsURL                 string        `json:"vcs_url"`
	Maturity               string        `json:"maturity"`
}

type GetPackageFilesResponse []struct {
	Name    string    `json:"name"`
	Path    string    `json:"path"`
	Repo    string    `json:"repo"`
	Package string    `json:"package"`
	Version string    `json:"version"`
	Owner   string    `json:"owner"`
	Created time.Time `json:"created"`
	Size    int       `json:"size"`
	Sha1    string    `json:"sha1"`
	Sha256  string    `json:"sha256"`
}

type GetVersionResponse struct {
	Attributes               map[string][]string `json:"attributes"`
	Created                  time.Time           `json:"created"`
	Desc                     string              `json:"desc"`
	GithubReleaseNotesFile   string              `json:"github_release_notes_file"`
	GithubUseTagReleaseNotes bool                `json:"github_use_tag_release_notes"`
	Labels                   []string            `json:"labels"`
	Name                     string              `json:"name"`
	Ordinal                  float64             `json:"ordinal"`
	Owner                    string              `json:"owner"`
	Package                  string              `json:"package"`
	Published                bool                `json:"published"`
	RatingCount              float64             `json:"rating_count"`
	Released                 time.Time           `json:"released"`
	Repo                     string              `json:"repo"`
	Updated                  time.Time           `json:"updated"`
	VcsTag                   string              `json:"vcs_tag"`
}
