package main

import (
	"context"
	"log"

	"github.com/berty/staff/tools/release/server"
	"github.com/google/go-github/github"
	"github.com/spf13/cobra"
	"golang.org/x/oauth2"
)

var serverCfg server.ServerConfig

var serveCmd = &cobra.Command{
	Use:   "serve",
	Short: "Server release tool",
	RunE: func(cmd *cobra.Command, args []string) error {
		serverCfg.CircleClient = cfg.circleClient
		if cfg.githubToken != "" {
			ctx := context.Background()
			ts := oauth2.StaticTokenSource(
				&oauth2.Token{AccessToken: cfg.githubToken},
			)
			tc := oauth2.NewClient(ctx, ts)
			serverCfg.GithubClient = github.NewClient(tc)
		} else {
			serverCfg.GithubClient = github.NewClient(nil)
		}

		log.Printf("Starting server on %s", serverCfg.Addr)
		s, err := server.NewServer(&serverCfg)
		if err != nil {
			return err
		}
		defer s.Close()

		return s.Start()
	},
}

func init() {
	serveCmd.PersistentFlags().StringVarP(&serverCfg.Addr, "listen", "l", ":3670", "Listen addr")
	serveCmd.PersistentFlags().StringVarP(&serverCfg.Hostname, "hostname", "n", "localhost:3670", "hostname")
	// serveCmd.PersistentFlags().StringVarP(&serverCfg.Username, "username", "u", "berty", "user")
	// serveCmd.PersistentFlags().StringVarP(&serverCfg.Password, "password", "p", "", "password")
	serveCmd.PersistentFlags().BoolVarP(&serverCfg.Debug, "debug", "", false, "debug mode")
	serveCmd.PersistentFlags().BoolVarP(&serverCfg.NoSlack, "no-slack", "", false, "disable slack")
	serveCmd.PersistentFlags().BoolVarP(&serverCfg.NoGa, "no-ga", "", false, "disable google analytics")
	serveCmd.PersistentFlags().BoolVarP(&serverCfg.NoAuth, "no-auth", "", false, "disable auth")
	serveCmd.PersistentFlags().StringVarP(&serverCfg.SqlConn, "sql-conn", "", "./yolo.sqlite", "sql connection url")

	rootCmd.AddCommand(serveCmd)
}
