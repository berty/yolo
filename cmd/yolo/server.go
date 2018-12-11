package main

import (
	"log"

	"github.com/berty/staff/tools/release/server"
	"github.com/spf13/cobra"
)

var serverCfg server.ServerConfig

var serveCmd = &cobra.Command{
	Use:   "serve",
	Short: "Server release tool",
	Run: func(cmd *cobra.Command, args []string) {
		serverCfg.Client = cfg.client

		log.Printf("Starting server on %s", serverCfg.Addr)
		panic(server.NewServer(&serverCfg).Start())
	},
}

func init() {
	serveCmd.PersistentFlags().StringVarP(&serverCfg.Addr, "listen", "l", ":3670", "Listen addr")
	serveCmd.PersistentFlags().StringVarP(&serverCfg.Hostname, "hostname", "n", "localhost:3670", "hostname")
	serveCmd.PersistentFlags().StringVarP(&serverCfg.Username, "username", "u", "berty", "user")
	serveCmd.PersistentFlags().StringVarP(&serverCfg.Password, "password", "p", "", "password")

	rootCmd.AddCommand(serveCmd)
}
