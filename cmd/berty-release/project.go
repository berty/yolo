package main

import (
	"encoding/json"
	"fmt"

	"github.com/spf13/cobra"
)

// Build

var projectsCmd = &cobra.Command{
	Use:   "projects",
	Short: "list projects",
	Run: func(cmd *cobra.Command, args []string) {
		ret, err := cfg.client.Projects()
		if err != nil {
			panic(err)
		}

		pret, err := json.MarshalIndent(ret, "", "\t")
		if err != nil {
			panic(err)
		}

		fmt.Println(string(pret))
	},
}

func init() {
	rootCmd.AddCommand(projectsCmd)
}
