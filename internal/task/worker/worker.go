package worker

import (
	"github.com/linux-do/cdk/internal/apps/oauth"
	"github.com/linux-do/cdk/internal/config"
	"github.com/linux-do/cdk/internal/task"
	"time"

	"github.com/hibiken/asynq"
)

var (
	asynqServer *asynq.Server
)

func init() {
	asynqServer = asynq.NewServer(
		task.RedisOpt,
		asynq.Config{
			Concurrency:     config.Config.Worker.Concurrency,
			ShutdownTimeout: 3 * time.Minute,
			Queues: map[string]int{
				"critical": 10,
				"default":  5,
				"low":      1,
			},
			StrictPriority: true,
		},
	)
}

// StartWorker 启动任务处理服务器
func StartWorker() error {
	// 注册任务处理器
	mux := asynq.NewServeMux()
	mux.Use(taskLoggingMiddleware)
	mux.HandleFunc(task.UpdateUserBadgeScoresTask, oauth.HandleUpdateUserBadgeScores)
	mux.HandleFunc(task.UpdateSingleUserBadgeScoreTask, oauth.HandleUpdateSingleUserBadgeScore)
	// 启动服务器
	return asynqServer.Run(mux)
}
