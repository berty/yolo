package main

import (
	"encoding/json"
	"fmt"

	"github.com/berty/staff/tools/release/pkg/circle"
	"github.com/spf13/cobra"
)

type config struct {
	token    string
	repo     string
	username string

	client *circle.Client
}

var cfg config

// Root
var rootCmd = &cobra.Command{
	Use:   "berty-release",
	Short: "Manage berty build",
	PersistentPreRun: func(cmd *cobra.Command, args []string) {
		if cfg.token != "" {
			cfg.client = circle.New(cfg.token, cfg.username, cfg.repo)
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
	rootCmd.PersistentFlags().StringVarP(&cfg.token, "token", "t", "", "Set token")
	rootCmd.PersistentFlags().StringVarP(&cfg.repo, "repo", "r", "berty", "Set repo")
	rootCmd.PersistentFlags().StringVarP(&cfg.username, "username", "u", "berty", "Set username")
}

func main() {
	rootCmd.Execute()
}
