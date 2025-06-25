package task

import (
	"fmt"
	"time"

	"github.com/hibiken/asynq"
	"github.com/linux-do/cdk/internal/config"
	"github.com/linux-do/cdk/internal/task/handlers"
)

var (
	AsynqServer *asynq.Server
)

func init() {
	redisOpt := asynq.RedisClientOpt{
		Addr:     fmt.Sprintf("%s:%d", config.Config.Redis.Host, config.Config.Redis.Port),
		Username: config.Config.Redis.Username,
		Password: config.Config.Redis.Password,
		DB:       config.Config.Redis.DB,
		PoolSize: config.Config.Redis.PoolSize,
	}
	AsynqServer = asynq.NewServer(
		redisOpt,
		asynq.Config{
			Concurrency: 50, // 提高并发处理数
			//Logger:          logger,
			ShutdownTimeout: 10 * time.Second, // 优雅关闭超时
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
	mux.HandleFunc(handlers.UpdateUserBadgeScores, handlers.HandleUpdateUserBadgeScores)
	mux.HandleFunc(handlers.UpdateSingleUserBadgeScore, handlers.HandleUpdateSingleUserBadgeScore)
	// 启动服务器
	return AsynqServer.Start(mux)
}
