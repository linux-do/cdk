package cmd

import (
	"github.com/linux-do/cdk/internal/task/worker"
	"log"

	"github.com/spf13/cobra"
)

var workerCmd = &cobra.Command{
	Use:   "worker",
	Short: "CDK Worker",
	Run: func(cmd *cobra.Command, args []string) {
		log.Println("[Worker] 启动任务处理服务")
		if err := worker.StartWorker(); err != nil {
			log.Fatalf("[工作器] 启动失败: %v", err)
		}
	},
}
