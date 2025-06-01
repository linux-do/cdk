package cmd

import (
	"github.com/spf13/cobra"
	"log"
)

var rootCmd = &cobra.Command{
	Use: "linux-do-cdk",
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) == 0 {
			log.Fatalf("[CMD] please provide a command")
		}
		appMode := args[0]
		switch appMode {
		case "api":
			apiCmd.Run(apiCmd, args)
		default:
			log.Fatal("[CMD] unknown app mode")
		}
	},
}

func init() {
	rootCmd.CompletionOptions.DisableDefaultCmd = true
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		log.Fatalf("[CMD] execute failed; %s", err)
	}
}
