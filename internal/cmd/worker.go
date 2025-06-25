package cmd

import (
	"log"

	"github.com/linux-do/cdk/internal/task"
	"github.com/spf13/cobra"
)

var workerCmd = &cobra.Command{
	Use:   "worker",
	Short: "CDK Worker",
	Run: func(cmd *cobra.Command, args []string) {
		log.Println("[Worker] 启动任务处理服务")
		if err := task.StartWorker(); err != nil {
			log.Fatalf("[工作器] 启动失败: %v", err)
		}
		// 阻塞主线程，避免程序退出
		select {}
	},
}
