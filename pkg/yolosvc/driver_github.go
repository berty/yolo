package yolosvc

import (
	"context"
	"fmt"
	"time"

	"berty.tech/yolo/v2/pkg/yolopb"
	"github.com/cayleygraph/cayley"
	"github.com/cayleygraph/cayley/schema"
	"github.com/cayleygraph/quad"
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
func GithubWorker(ctx context.Context, db *cayley.Handle, ghc *github.Client, schema *schema.Config, opts GithubWorkerOpts) error {
	opts.applyDefaults()

	logger := opts.Logger

	// fetch GitHub base objects (the ones that don't change very often).
	// this is done only once (for now).
	{
		batch, err := fetchGitHubBaseObjects(ctx, ghc, logger)
		if err != nil {
			logger.Warn("fetch GitHub base", zap.Error(err))
		} else {
			if err := saveBatch(ctx, db, batch, schema, logger); err != nil {
				logger.Warn("save batch", zap.Error(err))
			}
			opts.ClearCache.Set()
		}
	}

	// fetch recent activity in a loop
	for {
		fmt.Println("AAAAAAAAAAA1")
		// FIXME: support "since"
		logger.Debug("github: refresh")
		batch, err := fetchGitHubActivity(ctx, ghc, opts.MaxBuilds, logger)
		fmt.Println("AAAAAAAAAAA2")
		if err != nil {
			logger.Warn("fetch github", zap.Error(err))
		} else {
			fmt.Println("AAAAAAAAAAA3")
			if !batch.Empty() {
				fmt.Println("AAAAAAAAAAA4")
				if err := saveBatch(ctx, db, batch, schema, logger); err != nil {
					logger.Warn("save batch", zap.Error(err))
				}
				fmt.Println("AAAAAAAAAAA5")
				opts.ClearCache.Set()
				fmt.Println("AAAAAAAAAAA6")
			}
		}

		fmt.Println("AAAAAAAAAAA7")
		limits, _, err := ghc.RateLimits(ctx)
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
		fmt.Println("AAAAAAAAAAA8")
		select {
		case <-ctx.Done():
			return nil
		case <-time.After(opts.LoopAfter):
		}
		fmt.Println("AAAAAAAAAAA9")
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
			batch.Merge(handleGitHubOrganization(org))
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
			batch.Merge(handleGitHubRepo(repo, logger))
		}
		// FIXME: list last branches, commits etc for each repo
	}

	return batch, nil
}

func fetchGitHubActivity(ctx context.Context, ghc *github.Client, maxBuilds int, logger *zap.Logger) (*yolopb.Batch, error) {
	batch := yolopb.NewBatch()
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
		batch.Merge(handleGitHubPullRequest(pull, logger))
	}
	return batch, nil
}

func handleGitHubPullRequest(pr *github.PullRequest, logger *zap.Logger) *yolopb.Batch {
	batch := yolopb.NewBatch()
	createdAt := pr.GetCreatedAt()
	updatedAt := pr.GetUpdatedAt()
	baseCommit := yolopb.Commit{ID: quad.IRI(pr.GetHead().GetSHA())}
	project := yolopb.Project{ID: quad.IRI(pr.GetBase().GetRepo().GetHTMLURL())}
	commitURL := pr.GetBase().GetRepo().GetHTMLURL() + "/commit/" + pr.GetBase().GetSHA()
	branchURL := ""
	mr := yolopb.MergeRequest{
		ID:           quad.IRI(pr.GetHTMLURL()),
		ShortID:      fmt.Sprintf("%d", pr.GetNumber()),
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
		batch.Merge(userBatch)
		mr.HasAuthor = &yolopb.Entity{ID: userBatch.Entities[0].ID}
	}
	for _, user := range pr.Assignees {
		userBatch := handleGitHubUser(user, logger)
		batch.Merge(userBatch)
		mr.HasAssignees = append(mr.HasAssignees, userBatch.Entities[0])
	}
	for _, user := range pr.RequestedReviewers {
		userBatch := handleGitHubUser(user, logger)
		batch.Merge(userBatch)
		mr.HasReviewers = append(mr.HasReviewers, userBatch.Entities[0])
	}

	batch.MergeRequests = append(batch.MergeRequests, &mr)
	return batch
}

func handleGitHubRepo(repo *github.Repository, logger *zap.Logger) *yolopb.Batch {
	batch := yolopb.NewBatch()
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
		batch.Merge(ownerBatch)
		project.HasOwner = &yolopb.Entity{ID: ownerBatch.Entities[0].ID}
	}

	batch.Projects = append(batch.Projects, &project)
	return batch
}

func handleGitHubUser(user *github.User, logger *zap.Logger) *yolopb.Batch {
	batch := yolopb.NewBatch()
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

func handleGitHubOrganization(org *github.Organization) *yolopb.Batch {
	batch := yolopb.NewBatch()

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
		o.LoopAfter = time.Second * 10
	}
	if o.ClearCache == nil {
		o.ClearCache = abool.New()
	}
}
