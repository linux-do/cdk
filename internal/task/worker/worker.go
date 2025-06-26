package worker

import (
	"fmt"
	"github.com/linux-do/cdk/internal/apps/oauth"
	"github.com/linux-do/cdk/internal/task"
	"time"

	"github.com/hibiken/asynq"
	"github.com/linux-do/cdk/internal/config"
)

var (
	asynqServer *asynq.Server
)

func init() {
	redisOpt := asynq.RedisClientOpt{
		Addr:     fmt.Sprintf("%s:%d", config.Config.Redis.Host, config.Config.Redis.Port),
		Username: config.Config.Redis.Username,
		Password: config.Config.Redis.Password,
		DB:       config.Config.Redis.DB,
		PoolSize: config.Config.Redis.PoolSize,
	}
	asynqServer = asynq.NewServer(
		redisOpt,
		asynq.Config{
			Concurrency:     50,
			ShutdownTimeout: 10 * time.Second,
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
	return asynqServer.Start(mux)
}
