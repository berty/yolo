package main

import (
	"fmt"

	"github.com/spf13/cobra"
)

// Build

var buildCmd = &cobra.Command{
	Use:   "build",
	Short: "build related command",
}

var buildListCmd = &cobra.Command{
	Use:   "list [branch]",
	Short: "list last 30 builds, if branch is omitted list all 30 recent builds",
	Run: func(cmd *cobra.Command, args []string) {
		var pull string
		if len(args) > 0 {
			pull = args[0]

		}

		bs, err := cfg.circleClient.Builds(pull, "", 30, 0)
		if err != nil {
			fmt.Println("client error: ", err)
			return
		}

		err = prettyPrint(bs)
		if err != nil {
			fmt.Println("json error: ", err)
		}
	},
}

var buildGetCmd = &cobra.Command{
	Use:   "get [build_num]",
	Args:  cobra.MinimumNArgs(1),
	Short: "get build info",
	Run: func(cmd *cobra.Command, args []string) {
		bs, err := cfg.circleClient.Build(args[0])
		if err != nil {
			fmt.Println("client error: ", err)
			return
		}

		err = prettyPrint(bs)
		if err != nil {
			fmt.Println("json error: ", err)
		}
	},
}

var buildGetArtifactsCmd = &cobra.Command{
	Use:   "artifacts [build_num]",
	Args:  cobra.MinimumNArgs(1),
	Short: "get build artifacts",
	Run: func(cmd *cobra.Command, args []string) {
		arts, err := cfg.circleClient.GetArtifacts(args[0], true)
		if err != nil {
			fmt.Println("client error: ", err)
			return
		}

		err = prettyPrint(arts)
		if err != nil {
			fmt.Println("json error: ", err)
		}
	},
}

func init() {
	buildCmd.AddCommand(buildListCmd)
	buildCmd.AddCommand(buildGetCmd)
	buildCmd.AddCommand(buildGetArtifactsCmd)

	rootCmd.AddCommand(buildCmd)
}
