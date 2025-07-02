package worker

import (
	"context"
	"github.com/hibiken/asynq"
	"github.com/linux-do/cdk/internal/apps/oauth"
	"github.com/linux-do/cdk/internal/config"
	"github.com/linux-do/cdk/internal/db"
	"github.com/linux-do/cdk/internal/task"
	"github.com/linux-do/cdk/internal/task/schedule"
	"time"
)

// StartWorker 启动任务处理服务器
func StartWorker() error {
	exists, err := db.Redis.Exists(context.Background(), oauth.UserAllBadges).Result()
	if err != nil {
		return err
	}

	if exists == 0 {
		_, errTask := schedule.AsynqClient.Enqueue(asynq.NewTask(task.UpdateAllBadgesTask, nil))
		if errTask != nil {
			return errTask
		}
	}

	asynqServer := asynq.NewServer(
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

	// 注册任务处理器
	mux := asynq.NewServeMux()
	mux.Use(taskLoggingMiddleware)
	mux.HandleFunc(task.UpdateAllBadgesTask, oauth.HandleUpdateAllBadges)
	mux.HandleFunc(task.UpdateUserBadgeScoresTask, oauth.HandleUpdateUserBadgeScores)
	mux.HandleFunc(task.UpdateSingleUserBadgeScoreTask, oauth.HandleUpdateSingleUserBadgeScore)
	// 启动服务器
	return asynqServer.Run(mux)
}
