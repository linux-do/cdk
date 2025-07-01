package cmd

import (
	"github.com/linux-do/cdk/internal/task/schedule"
	"log"

	"github.com/spf13/cobra"
)

var schedulerCmd = &cobra.Command{
	Use:   "scheduler",
	Short: "CDK Scheduler",
	Run: func(cmd *cobra.Command, args []string) {
		log.Println("[Scheduler] 启动定时任务调度服务")
		if err := schedule.StartScheduler(); err != nil {
			log.Fatalf("[调度器] 启动失败: %v", err)
		}
	},
}
