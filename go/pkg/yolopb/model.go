package yolopb

func AllModels() []interface{} {
	return []interface{}{
		// remote data
		&MergeRequest{},
		&Commit{},
		&Build{},
		&Artifact{},
		&Release{},
		&Entity{},
		&Project{},

		// internal
		&Download{},
	}
}
