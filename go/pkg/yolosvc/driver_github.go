package yolosvc

import (
	"context"
	"fmt"
	"time"

	"berty.tech/yolo/v2/go/pkg/yolopb"
	"github.com/google/go-github/v31/github"
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

// GithubWorker goals is to manage the github update routine, it should try to support as much errors as possible by itself
func (svc service) GitHubWorker(ctx context.Context, opts GithubWorkerOpts) error {
	opts.applyDefaults()

	logger := opts.Logger

	// fetch GitHub base objects (the ones that don't change very often).
	// this is done only once (for now).
	{
		batch, err := fetchGitHubBaseObjects(ctx, svc.ghc, logger)
		if err != nil {
			logger.Warn("fetch GitHub base", zap.Error(err))
		} else {
			if err := svc.saveBatch(ctx, batch); err != nil {
				logger.Warn("save batch", zap.Error(err))
			}
		}
	}

	// FIXME: create an helper that takes a batch and automatically detect missing entities, then fetch them, and finally, add them to the batch

	// fetch recent activity in a loop
	for iteration := 0; ; iteration++ {
		if iteration > 0 {
			logger.Debug("github: refresh", zap.Int("iteration", iteration))
		}
		// FIXME: support "since"
		batch, err := fetchGitHubActivity(ctx, svc.ghc, opts.MaxBuilds, logger)
		if err != nil {
			logger.Warn("fetch github", zap.Error(err))
		} else {
			if err := svc.saveBatch(ctx, batch); err != nil {
				logger.Warn("save batch", zap.Error(err))
			}
		}

		limits, _, err := svc.ghc.RateLimits(ctx)
		if err != nil {
			logger.Warn("get rate limits", zap.Error(err))
		} else {
			reset := limits.Core.Reset.Time.Sub(time.Now())
			remaining := limits.Core.Remaining
			logger.Debug("github: rate limits", zap.Int("remaining", remaining), zap.Duration("reset", reset))
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

func fetchGitHubBaseObjects(ctx context.Context, ghc *github.Client, logger *zap.Logger) (*yolopb.Batch, error) {
	batch := yolopb.NewBatch()

	// list orgs
	{
		before := time.Now()
		orgs, _, err := ghc.Organizations.List(ctx, "", nil)
		if err != nil {
			return nil, err
		}
		logger.Debug("github.Organizations.List", zap.Int("total", len(orgs)), zap.Duration("duration", time.Since(before)))
		for _, org := range orgs {
			batch.Entities = append(batch.Entities, entityFromGitHubOrganization(org))
		}
		// FIXME: list members
	}

	// list repos
	{
		before := time.Now()
		repos, _, err := ghc.Repositories.List(ctx, "", nil)
		if err != nil {
			return nil, err
		}
		logger.Debug("github.Repositories.List", zap.Int("total", len(repos)), zap.Duration("duration", time.Since(before)))
		for _, repo := range repos {
			batch.Merge(batchFromGitHubRepo(repo, logger))
		}
		// FIXME: list last branches, commits etc for each repo
	}

	return batch, nil
}

func entityFromGitHubOrganization(org *github.Organization) *yolopb.Entity {
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

func fetchGitHubActivity(ctx context.Context, ghc *github.Client, maxBuilds int, logger *zap.Logger) (*yolopb.Batch, error) {
	batch := yolopb.NewBatch()
	opts := &github.PullRequestListOptions{
		State:     "all",
		Sort:      "updated",
		Direction: "desc",
		// PerPage:   maxBuilds, // FIXME: support API limits nicely
	}

	before := time.Now()
	pulls, _, err := ghc.PullRequests.List(ctx, "berty", "berty", opts)
	if err != nil {
		return nil, err
	}
	logger.Debug("github.PullRequests.List", zap.Int("total", len(pulls)), zap.Duration("duration", time.Since(before)))

	for _, pull := range pulls {
		batch.Merge(batchFromGitHubPR(pull, logger))
	}

	// FIXME: subscribe to organization events

	return batch, nil
}

func batchFromGitHubPR(pr *github.PullRequest, logger *zap.Logger) *yolopb.Batch {
	batch := yolopb.NewBatch()

	mr := mrFromGitHubPR(pr, logger)
	batch.MergeRequests = append(batch.MergeRequests, mr)

	if mr.HasAuthor != nil {
		batch.Entities = append(batch.Entities, mr.HasAuthor)
		mr.HasAuthor = nil
	}
	for _, entity := range mr.HasAssignees {
		batch.Entities = append(batch.Entities, entity)
	}
	for _, entity := range mr.HasReviewers {
		batch.Entities = append(batch.Entities, entity)
	}

	return batch
}

func mrFromGitHubPR(pr *github.PullRequest, logger *zap.Logger) *yolopb.MergeRequest {
	createdAt := pr.GetCreatedAt()
	updatedAt := pr.GetUpdatedAt()
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
		logger.Warn("unknown PR state", zap.String("state", state))
	}

	if user := pr.GetUser(); user != nil {
		entity := entityFromGitHubUser(user, logger)
		mr.HasAuthor = entity
		mr.HasAuthorID = entity.ID
	}
	for _, user := range pr.Assignees {
		entity := entityFromGitHubUser(user, logger)
		mr.HasAssignees = append(mr.HasAssignees, entity)
	}
	for _, user := range pr.RequestedReviewers {
		entity := entityFromGitHubUser(user, logger)
		mr.HasReviewers = append(mr.HasReviewers, entity)
	}

	return &mr
}

func batchFromGitHubRepo(repo *github.Repository, logger *zap.Logger) *yolopb.Batch {
	batch := yolopb.NewBatch()

	project := projectFromGitHubRepo(repo, logger)
	batch.Projects = append(batch.Projects, project)

	if project.HasOwner != nil {
		batch.Entities = append(batch.Entities, project.HasOwner)
		project.HasOwner = nil
	}

	return batch
}

func projectFromGitHubRepo(repo *github.Repository, logger *zap.Logger) *yolopb.Project {
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
		entity := entityFromGitHubUser(user, logger)
		project.HasOwner = entity
		project.HasOwnerID = entity.ID
	}

	return &project
}

func entityFromGitHubUser(user *github.User, logger *zap.Logger) *yolopb.Entity {
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
		logger.Warn("unknown owner type", zap.String("kind", kind))
	}
	return &entity
}

func (o *GithubWorkerOpts) applyDefaults() {
	if o.Logger == nil {
		o.Logger = zap.NewNop()
	}
	if o.MaxBuilds == 0 {
		o.MaxBuilds = 100
	}
	if o.LoopAfter == 0 {
		o.LoopAfter = time.Second * 30
	}
	if o.ClearCache == nil {
		o.ClearCache = abool.New()
	}
}
