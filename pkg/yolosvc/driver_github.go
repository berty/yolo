package yolosvc

import (
	"context"
	"time"

	"berty.tech/yolo/v2/pkg/yolopb"
	"github.com/cayleygraph/cayley"
	"github.com/cayleygraph/cayley/schema"
	"github.com/cayleygraph/quad"
	"github.com/google/go-github/v31/github"
	"go.uber.org/zap"
)

type GithubWorkerOpts struct {
	Logger    *zap.Logger
	MaxBuilds int
	LoopAfter time.Duration
	Once      bool
}

// GithubWorker goals is to manage the github update routine, it should try to support as much errors as possible by itself
func GithubWorker(ctx context.Context, db *cayley.Handle, ghc *github.Client, schema *schema.Config, opts GithubWorkerOpts) error {
	opts.applyDefaults()

	// fetch GitHub base objects (the ones that don't change very often).
	// this is done only once (for now).
	{
		batches, err := fetchGitHubBaseObjects(ctx, ghc, opts.Logger)
		if err != nil {
			opts.Logger.Warn("fetch GitHub base", zap.Error(err))
		} else {
			if err := saveBatches(ctx, db, batches, schema); err != nil {
				opts.Logger.Warn("save batches", zap.Error(err))
			}
		}
	}

	// fetch recent activity in a loop
	for {
		// FIXME: support "since"
		opts.Logger.Debug("github: refresh")
		batches, err := fetchGitHubActivity(ctx, ghc, opts.MaxBuilds, opts.Logger)
		if err != nil {
			opts.Logger.Warn("fetch github", zap.Error(err))
		} else {
			if err := saveBatches(ctx, db, batches, schema); err != nil {
				opts.Logger.Warn("save batches", zap.Error(err))
			}
		}

		limits, _, err := ghc.RateLimits(ctx)
		if err != nil {
			opts.Logger.Warn("get rate limits", zap.Error(err))
		} else {
			reset := limits.Core.Reset.Time.Sub(time.Now())
			remaining := limits.Core.Remaining
			opts.Logger.Debug("github: rate limits", zap.Int("remaining", remaining), zap.Duration("reset", reset))
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

func fetchGitHubBaseObjects(ctx context.Context, ghc *github.Client, logger *zap.Logger) ([]yolopb.Batch, error) {
	batches := []yolopb.Batch{}

	// list orgs
	{
		before := time.Now()
		orgs, _, err := ghc.Organizations.List(ctx, "", nil)
		if err != nil {
			return nil, err
		}
		logger.Debug("github.Organizations.List", zap.Int("total", len(orgs)), zap.Duration("duration", time.Since(before)))
		for _, org := range orgs {
			batches = append(batches, handleGitHubOrganization(org))
		}
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
			batches = append(batches, handleGitHubRepo(repo, logger))
		}
		// FIXME: list last branches, commits etc for each repo
	}

	return batches, nil
}

func fetchGitHubActivity(ctx context.Context, ghc *github.Client, maxBuilds int, logger *zap.Logger) ([]yolopb.Batch, error) {
	batches := []yolopb.Batch{}
	opts := &github.PullRequestListOptions{
		State:     "all",
		Sort:      "updated",
		Direction: "desc",
	}
	opts.PerPage = maxBuilds // FIXME: support pager if maxBuilds is greater than API limits
	before := time.Now()
	pulls, _, err := ghc.PullRequests.List(ctx, "berty", "berty", opts)
	if err != nil {
		return nil, err
	}
	logger.Debug("github.PullRequests.List", zap.Int("total", len(pulls)), zap.Duration("duration", time.Since(before)))
	for _, pull := range pulls {
		batches = append(batches, handleGitHubPullRequest(pull, logger))
	}
	return batches, nil
}

func handleGitHubPullRequest(pr *github.PullRequest, logger *zap.Logger) yolopb.Batch {
	batch := yolopb.Batch{MergeRequests: []*yolopb.MergeRequest{}}
	createdAt := pr.GetCreatedAt()
	updatedAt := pr.GetUpdatedAt()
	baseCommit := yolopb.Commit{ID: quad.IRI(pr.GetHead().GetSHA())}
	project := yolopb.Project{ID: quad.IRI(pr.GetBase().GetRepo().GetHTMLURL())}
	commitURL := pr.GetBase().GetRepo().GetHTMLURL() + "/commit/" + pr.GetBase().GetSHA()
	branchURL := ""
	mr := yolopb.MergeRequest{
		ID:           quad.IRI(pr.GetHTMLURL()),
		CreatedAt:    &createdAt,
		UpdatedAt:    &updatedAt,
		Title:        pr.GetTitle(),
		Message:      pr.GetBody(),
		Driver:       yolopb.Driver_GitHub,
		Branch:       pr.GetHead().GetLabel(),
		HasCommit:    &baseCommit,
		HasProject:   &project,
		CommitURL:    commitURL,
		BranchURL:    branchURL,
		HasAssignees: []*yolopb.Entity{},
		HasReviewers: []*yolopb.Entity{},
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

	// relationships

	if user := pr.GetUser(); user != nil {
		userBatch := handleGitHubUser(user, logger)
		batch.Entities = append(batch.Entities, userBatch.Entities...)
		mr.HasAuthor = &yolopb.Entity{ID: userBatch.Entities[0].ID}
	}
	for _, user := range pr.Assignees {
		userBatch := handleGitHubUser(user, logger)
		batch.Entities = append(batch.Entities, userBatch.Entities...)
		mr.HasAssignees = append(mr.HasAssignees, userBatch.Entities[0])
	}
	for _, user := range pr.RequestedReviewers {
		userBatch := handleGitHubUser(user, logger)
		batch.Entities = append(batch.Entities, userBatch.Entities...)
		mr.HasReviewers = append(mr.HasReviewers, userBatch.Entities[0])
	}

	batch.MergeRequests = append(batch.MergeRequests, &mr)
	return batch
}

func handleGitHubRepo(repo *github.Repository, logger *zap.Logger) yolopb.Batch {
	batch := yolopb.Batch{
		Projects: []*yolopb.Project{},
		Entities: []*yolopb.Entity{},
	}
	createdAt := repo.GetCreatedAt().Time
	updatedAt := repo.GetUpdatedAt().Time
	project := yolopb.Project{
		ID:          quad.IRI(repo.GetHTMLURL()),
		Name:        repo.GetName(),
		CreatedAt:   &createdAt,
		UpdatedAt:   &updatedAt,
		Driver:      yolopb.Driver_GitHub,
		Description: repo.GetDescription(),
		// FIXME: more fields
	}

	if repoOwner := repo.GetOwner(); repoOwner != nil {
		ownerBatch := handleGitHubUser(repoOwner, logger)
		batch.Entities = append(batch.Entities, ownerBatch.Entities...)
		project.HasOwner = &yolopb.Entity{ID: ownerBatch.Entities[0].ID}
	}

	batch.Projects = append(batch.Projects, &project)
	return batch
}

func handleGitHubUser(user *github.User, logger *zap.Logger) yolopb.Batch {
	batch := yolopb.Batch{
		Entities: []*yolopb.Entity{},
	}
	owner := yolopb.Entity{
		ID:        quad.IRI(user.GetHTMLURL()),
		Name:      user.GetLogin(),
		AvatarURL: user.GetAvatarURL(),
		Driver:    yolopb.Driver_GitHub,
	}
	switch kind := user.GetType(); kind {
	case "User":
		owner.Kind = yolopb.Entity_User
	case "Organization":
		owner.Kind = yolopb.Entity_Organization
	case "Bot":
		owner.Kind = yolopb.Entity_Bot
	default:
		logger.Warn("unknown owner type", zap.String("kind", kind))
	}
	batch.Entities = append(batch.Entities, &owner)
	return batch
}

func handleGitHubOrganization(org *github.Organization) yolopb.Batch {
	batch := yolopb.Batch{
		Entities: []*yolopb.Entity{},
	}

	id := org.GetHTMLURL()
	if id == "" {
		id = "https://github.com/" + org.GetLogin()
	}
	owner := yolopb.Entity{
		ID:          quad.IRI(id),
		Name:        org.GetLogin(),
		AvatarURL:   org.GetAvatarURL(),
		Description: org.GetDescription(),
		Driver:      yolopb.Driver_GitHub,
		Kind:        yolopb.Entity_Organization,
	}
	batch.Entities = append(batch.Entities, &owner)
	return batch
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
}
