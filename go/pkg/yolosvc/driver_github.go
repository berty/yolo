package yolosvc

import (
	"context"
	"fmt"
	"strings"
	"time"

	"berty.tech/yolo/v2/go/pkg/yolopb"
	"github.com/google/go-github/v32/github"
	"github.com/tevino/abool"
	"go.uber.org/zap"
)

type GithubWorkerOpts struct {
	Logger     *zap.Logger
	MaxBuilds  int
	LoopAfter  time.Duration
	ClearCache *abool.AtomicBool
	Once       bool
}

type githubWorker struct {
	logger      *zap.Logger
	svc         *service
	opts        GithubWorkerOpts
	repoConfigs []githubRepoConfig
}

type githubRepoConfig struct {
	owner string
	repo  string
	// workflows map[int64]struct{}
}

// GithubWorker goals is to manage the github update routine, it should try to support as much errors as possible by itself
func (svc *service) GitHubWorker(ctx context.Context, opts GithubWorkerOpts) error {
	opts.applyDefaults()

	worker := githubWorker{
		svc:    svc,
		opts:   opts,
		logger: opts.Logger.Named("ghub"),
	}

	// fetch GitHub base objects (the ones that don't change very often).
	// this is done only once (for now).
	{
		batch, err := worker.fetchBaseObjects(ctx)
		if err != nil {
			worker.logger.Warn("fetch GitHub base", zap.Error(err))
		} else {
			if err := svc.saveBatch(ctx, batch); err != nil {
				worker.logger.Warn("save batch", zap.Error(err))
			}
		}
	}

	// FIXME: create an helper that takes a batch and automatically detect missing entities, then fetch them, and finally, add them to the batch

	// fetch recent activity in a loop
	for iteration := 0; ; iteration++ {
		since, err := lastBuildCreatedTime(ctx, svc.db, yolopb.Driver_GitHub)
		if err != nil {
			svc.logger.Warn("get last github build created time", zap.Error(err))
		}
		svc.logger.Debug("github: refresh", zap.Int("iteration", iteration), zap.Time("since", since))

		// fetch repo activity
		for _, repo := range worker.repoConfigs {
			// FIXME: support "since"
			batch, err := worker.fetchRepoActivity(ctx, repo, iteration, since)
			if err != nil {
				worker.logger.Warn("fetch", zap.Error(err))
			} else {
				if err := svc.saveBatch(ctx, batch); err != nil {
					worker.logger.Warn("save batch", zap.Error(err))
				}
			}
		}

		// maintenance: try to fix missing links
		if iteration%10 == 0 {
			for _, repo := range worker.repoConfigs {
				// FIXME: support "since"
				batch, err := worker.repoMaintenance(ctx, repo)
				if err != nil {
					worker.logger.Warn("fetch", zap.Error(err))
				} else {
					if err := svc.saveBatch(ctx, batch); err != nil {
						worker.logger.Warn("save batch", zap.Error(err))
					}
				}
			}
		}

		// FIXME: subscribe to orgs' events

		limits, _, err := svc.ghc.RateLimits(ctx)
		if err != nil {
			worker.logger.Warn("get rate limits", zap.Error(err))
		} else {
			reset := time.Until(limits.Core.Reset.Time)
			remaining := limits.Core.Remaining
			worker.logger.Debug("rate limits", zap.Int("remaining", remaining), zap.Duration("reset", reset))
		}

		// FIXME: if rate limit errors, use the RetryAfter helper

		if opts.Once {
			return nil
		}
		select {
		case <-ctx.Done():
			return nil
		case <-time.After(opts.LoopAfter):
		}
	}
}

func (worker *githubWorker) fetchBaseObjects(ctx context.Context) (*yolopb.Batch, error) {
	batch := yolopb.NewBatch()

	// list orgs
	{
		before := time.Now()
		orgs, _, err := worker.svc.ghc.Organizations.List(ctx, "", nil)
		if err != nil {
			return nil, err
		}
		worker.logger.Debug("github.Organizations.List", zap.Int("total", len(orgs)), zap.Duration("duration", time.Since(before)))
		for _, org := range orgs {
			batch.Entities = append(batch.Entities, worker.entityFromOrganization(org))
		}
		// FIXME: list members
	}

	// list repos
	{
		before := time.Now()
		repos, _, err := worker.svc.ghc.Repositories.List(ctx, "", nil)
		if err != nil {
			return nil, err
		}
		worker.logger.Debug("github.Repositories.List", zap.Int("total", len(repos)), zap.Duration("duration", time.Since(before)))
		for _, repo := range repos {
			batch.Merge(worker.batchFromRepo(repo))
		}
		// FIXME: list last branches, commits etc for each repo
	}

	// configure repo configs
	{
		// FIXME: automatically configure repo configs based on .github/yolo.yml
		/*
			// fetch workflows
			{
				opts := &github.ListOptions{}
				before := time.Now()
				workflows, _, err := svc.ghc.Actions.ListWorkflows(ctx, repo.owner, repo.repo, opts)
				if err != nil {
					return nil, err
				}
				logger.Debug("github.Actions.ListWorkflows", zap.Int("total", len(workflows.Workflows)), zap.Duration("duration", time.Since(before)))
				fmt.Println(u.PrettyJSON(workflows))
			}
		*/

		worker.repoConfigs = []githubRepoConfig{
			{
				owner: "berty", repo: "berty",
				// workflows: map[int64]githubWorkflowConfig{2598412: githubWorkflowConfig{}},
			},
		}
	}

	return batch, nil
}

func (worker *githubWorker) repoMaintenance(ctx context.Context, repo githubRepoConfig) (*yolopb.Batch, error) {
	batch := yolopb.NewBatch()

	// github builds without PR
	{
		var builds []*yolopb.Build
		err := worker.svc.db.
			Where(yolopb.Build{Driver: yolopb.Driver_GitHub}).
			Where("has_mergerequest_id IS NULL OR has_mergerequest_id = ''").
			Where("updated_at >= date('now','-1 hour')").
			Find(&builds).
			Error
		if err != nil {
			return nil, err
		}
		worker.logger.Debug("repo maintenance", zap.String("repo", repo.repo), zap.Int("orphan builds", len(builds)))
		// FIXME: parallelize?
		for _, build := range builds {
			before := time.Now()
			opts := &github.PullRequestListOptions{}
			ret, _, err := worker.svc.ghc.PullRequests.ListPullRequestsWithCommit(ctx, repo.owner, repo.repo, build.HasCommitID, opts)
			if err != nil {
				return nil, err
			}
			worker.logger.Debug("github.PullRequests.ListPulLRequestsWithCommit",
				zap.Int("total", len(ret)),
				zap.Duration("duration", time.Since(before)),
			)
			if len(ret) == 1 {
				build.HasMergerequestID = ret[0].GetHTMLURL()
				batch.Builds = append(batch.Builds, build)
			}
		}
	}

	return batch, nil
}

func (worker *githubWorker) fetchRepoActivity(ctx context.Context, repo githubRepoConfig, iteration int, lastFinishedBuild time.Time) (*yolopb.Batch, error) {
	batch := yolopb.NewBatch()

	// paginate 5 pages every 10 runs.
	// starting at the second one to have a fast first one.
	maxPages := 1
	if iteration%10 == 1 {
		maxPages = 5
	}

	// fetch PRs
	{
		for page := 0; page < maxPages; page++ {
			opts := &github.PullRequestListOptions{
				State:     "all",
				Sort:      "updated",
				Direction: "desc",
				ListOptions: github.ListOptions{
					Page: page,
				},
			}

			before := time.Now()
			pulls, _, err := worker.svc.ghc.PullRequests.List(ctx, repo.owner, repo.repo, opts)
			if err != nil {
				return nil, err
			}
			worker.logger.Debug("github.PullRequests.List", zap.Int("total", len(pulls)), zap.Duration("duration", time.Since(before)))

			for _, pull := range pulls {
				batch.Merge(worker.batchFromPR(pull))
			}
		}
	}

	// fetch workflow runs
	var runs []*github.WorkflowRun
	{
		for page := 0; page < maxPages; page++ {
			opts := &github.ListWorkflowRunsOptions{
				ListOptions: github.ListOptions{
					Page: page,
				},
			}
			before := time.Now()
			ret, _, err := worker.svc.ghc.Actions.ListRepositoryWorkflowRuns(ctx, repo.owner, repo.repo, opts)
			if err != nil {
				return nil, err
			}
			worker.logger.Debug("github.Actions.ListRepositoryWorkflowRuns",
				zap.Int("total", len(ret.WorkflowRuns)),
				zap.Duration("duration", time.Since(before)),
				zap.String("repo", repo.repo),
				zap.Int("page", page),
			)

			// FIXME: parallelize?
			for _, run := range ret.WorkflowRuns {
				if run.GetUpdatedAt().Time.Before(lastFinishedBuild) {
					continue
				}
				runs = append(runs, run)

				// fetch PRs associated to this run
				if run.GetHeadBranch() != "master" {
					opts := &github.PullRequestListOptions{}
					ret, _, err := worker.svc.ghc.PullRequests.ListPullRequestsWithCommit(ctx, repo.owner, repo.repo, run.GetHeadSHA(), opts)
					if err != nil {
						return nil, err
					}
					batch.Merge(worker.batchFromWorkflowRun(run, ret))
				} else {
					batch.Merge(worker.batchFromWorkflowRun(run, nil))
				}
			}
			if len(runs) == 0 { // first page of result does not have any new result, do not check for the next pages
				continue
			}
		}
	}

	// fetch artifacts
	// FIXME: try to make a single call that gets artifacts for a repo with link to builds
	{
		// FIXME: parallelize?
		for _, run := range runs {
			if run.GetStatus() != "completed" {
				continue
			}
			// example of how to make less requests, but from what I see, the current HTTP client caching is awesome, and even if the logs display a big amount of requests
			/*
				if _, found := repo.workflows[run.GetWorkflowID()]; !found {
					continue
				}
				{
					var updatedDates []time.Time
					err := worker.svc.db.
						Model(yolopb.Build{}).
						Where(yolopb.Build{Driver: yolopb.Driver_GitHub, ID: run.GetHTMLURL()}).
						Pluck("updated_at", &updatedDates).
						Error
					if err != nil {
						return nil, err
					}
					if len(updatedDates) > 0 && updatedDates[0] == run.GetUpdatedAt().Time {
						continue
					}
				}
			*/

			opts := &github.ListOptions{}
			before := time.Now()
			ret, _, err := worker.svc.ghc.Actions.ListWorkflowRunArtifacts(ctx, repo.owner, repo.repo, *run.ID, opts)
			if err != nil {
				return nil, err
			}
			worker.logger.Debug("github.Actions.ListWorkflowRunArtifacts", zap.Int("total", len(ret.Artifacts)), zap.Duration("duration", time.Since(before)))
			for _, artifact := range ret.Artifacts {
				batch.Merge(worker.batchFromWorkflowRunArtifact(run, artifact))
			}
		}
	}

	// FIXME: subscribe to organization events

	return batch, nil
}

func (worker *githubWorker) batchFromWorkflowRunArtifact(run *github.WorkflowRun, artifact *github.Artifact) *yolopb.Batch {
	batch := yolopb.NewBatch()

	id := fmt.Sprintf("gh_%d", artifact.GetID())
	createdAt := artifact.GetCreatedAt().Time
	newArtifact := yolopb.Artifact{
		ID:          id,
		CreatedAt:   &createdAt,
		FileSize:    artifact.GetSizeInBytes(),
		LocalPath:   artifact.GetName(),
		DownloadURL: artifact.GetArchiveDownloadURL(),
		HasBuildID:  run.GetHTMLURL(),
		Driver:      yolopb.Driver_GitHub,
		Kind:        artifactKindByPath(artifact.GetName()),
		MimeType:    mimetypeByPath(artifact.GetName()),
		State:       yolopb.Artifact_Finished,
	}

	batch.Artifacts = append(batch.Artifacts, &newArtifact)
	return batch
}

func (worker *githubWorker) batchFromWorkflowRun(run *github.WorkflowRun, prs []*github.PullRequest) *yolopb.Batch {
	batch := yolopb.NewBatch()
	createdAt := run.GetCreatedAt().Time
	updatedAt := run.GetUpdatedAt().Time
	commitURL := run.GetHeadRepository().GetHTMLURL() + "/commit/" + run.GetHeadSHA()

	newBuild := yolopb.Build{
		ID:           run.GetHTMLURL(),
		ShortID:      fmt.Sprintf("%d", run.GetID()),
		CreatedAt:    &createdAt,
		UpdatedAt:    &updatedAt,
		HasCommitID:  run.GetHeadSHA(),
		Branch:       run.GetHeadBranch(),
		Driver:       yolopb.Driver_GitHub,
		CommitURL:    commitURL,
		HasProjectID: run.GetRepository().GetHTMLURL(),
		Message:      run.GetHeadCommit().GetMessage(),
	}

	if run.GetConclusion() != "" {
		newBuild.FinishedAt = &updatedAt // maybe we can have a more accurate date?
	}
	// state
	{
		status := run.GetStatus()
		conclusion := run.GetConclusion()

		switch {
		case status == "queued":
			newBuild.State = yolopb.Build_Scheduled
		case status == "in_progress":
			newBuild.State = yolopb.Build_Running
		case conclusion == "success":
			newBuild.State = yolopb.Build_Passed
		case conclusion == "failure":
			newBuild.State = yolopb.Build_Failed
		case conclusion == "cancelled": // nolint:misspell // this is how GitHub spells it
			newBuild.State = yolopb.Build_Canceled
		case conclusion == "skipped":
			newBuild.State = yolopb.Build_Skipped
		case conclusion == "timed_out":
			newBuild.State = yolopb.Build_Timedout
		//case conclusion == "action_required":
		//case conclusion == "neutral":
		//case conclusion == "state":
		default:
			newBuild.State = yolopb.Build_UnknownState
			fmt.Printf("unsupported status (%q) or conclusion (%q)\n", status, conclusion)
		}
	}

	if len(prs) > 0 {
		pr := prs[0] // only take the first one
		newBuild.HasMergerequestID = pr.GetHTMLURL()
	}

	guessMissingBuildInfo(&newBuild)
	batch.Builds = append(batch.Builds, &newBuild)
	return batch
}

func (worker *githubWorker) batchFromPR(pr *github.PullRequest) *yolopb.Batch {
	batch := yolopb.NewBatch()

	mr := worker.mrFromPR(pr)
	batch.MergeRequests = append(batch.MergeRequests, mr)

	if mr.HasAuthor != nil {
		batch.Entities = append(batch.Entities, mr.HasAuthor)
		mr.HasAuthor = nil
	}
	batch.Entities = append(batch.Entities, mr.HasAssignees...)
	batch.Entities = append(batch.Entities, mr.HasReviewers...)
	return batch
}

func (worker *githubWorker) mrFromPR(pr *github.PullRequest) *yolopb.MergeRequest {
	createdAt := pr.GetCreatedAt()
	updatedAt := pr.GetUpdatedAt()
	mergedAt := pr.GetMergedAt()
	commitURL := pr.GetBase().GetRepo().GetHTMLURL() + "/commit/" + pr.GetBase().GetSHA()
	branchURL := ""
	mr := yolopb.MergeRequest{
		ID:           pr.GetHTMLURL(),
		ShortID:      fmt.Sprintf("%d", pr.GetNumber()),
		CreatedAt:    &createdAt,
		UpdatedAt:    &updatedAt,
		Title:        pr.GetTitle(),
		Message:      pr.GetBody(),
		Driver:       yolopb.Driver_GitHub,
		Branch:       pr.GetHead().GetLabel(),
		CommitURL:    commitURL,
		BranchURL:    branchURL,
		IsWIP:        pr.GetDraft(),
		HasAssignees: []*yolopb.Entity{},
		HasReviewers: []*yolopb.Entity{},
		HasProjectID: pr.GetBase().GetRepo().GetHTMLURL(),
		HasCommitID:  pr.GetHead().GetSHA(),

		// FIXME: labels
		// FIXME: reviews
		// FIXME: isFromMember vs isFromExternalContributor
	}
	switch state := *pr.State; state {
	case "open":
		mr.State = yolopb.MergeRequest_Opened
	case "closed":
		mr.State = yolopb.MergeRequest_Closed
	default:
		worker.logger.Warn("unknown PR state", zap.String("state", state))
	}
	if !mergedAt.IsZero() {
		mr.State = yolopb.MergeRequest_Merged
		mr.MergedAt = &mergedAt
	}
	if !mr.IsWIP && strings.HasPrefix(strings.ToLower(mr.Title), "wip") {
		mr.IsWIP = true
	}
	if !mr.IsWIP && strings.HasPrefix(strings.ToLower(mr.Title), "draft") {
		mr.IsWIP = true
	}
	// FIXME: also check if a label is "WIP" or "Work in progress"

	if user := pr.GetUser(); user != nil {
		entity := worker.entityFromUser(user)
		mr.HasAuthor = entity
		mr.HasAuthorID = entity.ID
	}
	for _, user := range pr.Assignees {
		entity := worker.entityFromUser(user)
		mr.HasAssignees = append(mr.HasAssignees, entity)
	}
	for _, user := range pr.RequestedReviewers {
		entity := worker.entityFromUser(user)
		mr.HasReviewers = append(mr.HasReviewers, entity)
	}

	return &mr
}

func (worker *githubWorker) batchFromRepo(repo *github.Repository) *yolopb.Batch {
	batch := yolopb.NewBatch()

	project := worker.projectFromRepo(repo)
	batch.Projects = append(batch.Projects, project)

	if project.HasOwner != nil {
		batch.Entities = append(batch.Entities, project.HasOwner)
		project.HasOwner = nil
	}

	return batch
}

func (worker *githubWorker) projectFromRepo(repo *github.Repository) *yolopb.Project {
	createdAt := repo.GetCreatedAt().Time
	updatedAt := repo.GetUpdatedAt().Time
	project := yolopb.Project{
		ID:          repo.GetHTMLURL(),
		Name:        repo.GetName(),
		CreatedAt:   &createdAt,
		UpdatedAt:   &updatedAt,
		Driver:      yolopb.Driver_GitHub,
		Description: repo.GetDescription(),
		// FIXME: more fields
	}

	if user := repo.GetOwner(); user != nil {
		entity := worker.entityFromUser(user)
		project.HasOwner = entity
		project.HasOwnerID = entity.ID
	}

	return &project
}

func (worker *githubWorker) entityFromUser(user *github.User) *yolopb.Entity {
	entity := yolopb.Entity{
		ID:        user.GetHTMLURL(),
		Name:      user.GetLogin(),
		AvatarURL: user.GetAvatarURL(),
		Driver:    yolopb.Driver_GitHub,
	}
	switch kind := user.GetType(); kind {
	case "User":
		entity.Kind = yolopb.Entity_User
	case "Organization":
		entity.Kind = yolopb.Entity_Organization
	case "Bot":
		entity.Kind = yolopb.Entity_Bot
	default:
		worker.logger.Warn("unknown owner type", zap.String("kind", kind))
	}
	return &entity
}

func (worker *githubWorker) entityFromOrganization(org *github.Organization) *yolopb.Entity {
	id := org.GetHTMLURL()
	if id == "" {
		id = "https://github.com/" + org.GetLogin()
	}
	return &yolopb.Entity{
		ID:          id,
		Name:        org.GetLogin(),
		AvatarURL:   org.GetAvatarURL(),
		Description: org.GetDescription(),
		Driver:      yolopb.Driver_GitHub,
		Kind:        yolopb.Entity_Organization,
	}
}

func (opts *GithubWorkerOpts) applyDefaults() {
	if opts.Logger == nil {
		opts.Logger = zap.NewNop()
	}
	if opts.MaxBuilds == 0 {
		opts.MaxBuilds = 100
	}
	if opts.LoopAfter == 0 {
		opts.LoopAfter = time.Second * 30
	}
	if opts.ClearCache == nil {
		opts.ClearCache = abool.New()
	}
}
