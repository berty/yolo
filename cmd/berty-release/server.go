package main

import (
	"github.com/berty/staff/tools/release/server"
	"github.com/spf13/cobra"
)

type serverConfig struct {
	addr string
}

var serverCfg serverConfig

var serveCmd = &cobra.Command{
	Use:   "serve",
	Short: "Server release tool",
	Run: func(cmd *cobra.Command, args []string) {
		s := server.NewServer(cfg.client)
		panic(s.Start(serverCfg.addr))
	},
}

func init() {
	serveCmd.PersistentFlags().StringVarP(&serverCfg.addr, "listen", "l", ":3670", "Listen addr")

	rootCmd.AddCommand(serveCmd)
}
