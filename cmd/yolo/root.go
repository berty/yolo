package main

import (
	"encoding/json"
	"fmt"

	"github.com/berty/staff/tools/release/pkg/circle"
	"github.com/spf13/cobra"
)

type config struct {
	circleToken string
	githubToken string
	repo        string
	username    string
	cacheDir    string

	circleClient *circle.Client
}

var cfg config

// Root
var rootCmd = &cobra.Command{
	Use:   "yolo",
	Short: "Manage berty build",
	PersistentPreRun: func(cmd *cobra.Command, args []string) {
		if cfg.circleToken != "" {
			cfg.circleClient = circle.New(cfg.circleToken, cfg.username, cfg.cacheDir, cfg.repo)
		} else {
			panic("no token provided")
		}
	},
}

func prettyPrint(data interface{}) error {
	ret, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return err
	}

	fmt.Println(string(ret))
	return nil
}

func init() {
	rootCmd.PersistentFlags().StringVarP(&cfg.circleToken, "circle-token", "", "", "CircleCI token")
	rootCmd.PersistentFlags().StringVarP(&cfg.githubToken, "github-token", "", "", "GitHub token (optional)")
	rootCmd.PersistentFlags().StringVarP(&cfg.repo, "repo", "r", "berty", "Set repo")
	rootCmd.PersistentFlags().StringVarP(&cfg.username, "username", "u", "berty", "Set username")
	rootCmd.PersistentFlags().StringVarP(&cfg.cacheDir, "cache-dir", "", "./cache/", "artifacts caching directory")
}

func main() {
	rootCmd.Execute()
}
