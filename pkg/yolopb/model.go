package yolopb

func AllModels() []interface{} {
	return []interface{}{
		&MergeRequest{},
		&Commit{},
		&Build{},
		&Artifact{},
		&Release{},
		&Entity{},
		&Project{},
	}
}
