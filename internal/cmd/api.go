package cmd

import (
	"github.com/linux-do/cdk/internal/router"
	"github.com/spf13/cobra"
)

var apiCmd = &cobra.Command{
	Use:   "api",
	Short: "CDK API",
	Run: func(cmd *cobra.Command, args []string) {
		router.Serve()
	},
}
