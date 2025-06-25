package task

import (
	"context"
	"fmt"
	"github.com/linux-do/cdk/internal/task/handlers"
	"sync"
	"time"

	"github.com/hibiken/asynq"
	"github.com/linux-do/cdk/internal/config"
)

var (
	AsynqClient   *asynq.Client
	scheduler     *asynq.Scheduler
	schedulerOnce sync.Once
)

func init() {
	redisOpt := asynq.RedisClientOpt{
		Addr:     fmt.Sprintf("%s:%d", config.Config.Redis.Host, config.Config.Redis.Port),
		Username: config.Config.Redis.Username,
		Password: config.Config.Redis.Password,
		DB:       config.Config.Redis.DB,
		PoolSize: config.Config.Redis.PoolSize,
	}

	AsynqClient = asynq.NewClient(redisOpt)
}

// StartScheduler 启动调度器
func StartScheduler() error {
	var err error
	schedulerOnce.Do(func() {
		scheduler = asynq.NewScheduler(
			asynq.RedisClientOpt{
				Addr:     fmt.Sprintf("%s:%d", config.Config.Redis.Host, config.Config.Redis.Port),
				Username: config.Config.Redis.Username,
				Password: config.Config.Redis.Password,
				DB:       config.Config.Redis.DB,
				PoolSize: config.Config.Redis.PoolSize,
			},
			&asynq.SchedulerOpts{
				Location: time.Local,
				//Logger: logger,
			},
		)

		if _, err = scheduler.Register("0/1 * * * *", asynq.NewTask(handlers.UpdateUserBadgeScores, nil)); err != nil {
			return
		}

		// 启动调度器（非阻塞）
		err = scheduler.Start()
	})
	return err
}

// EnqueueTask 通用的任务入队函数
func EnqueueTask(ctx context.Context, taskType string, payload []byte, opts ...asynq.Option) (*asynq.TaskInfo, error) {
	return AsynqClient.EnqueueContext(ctx, asynq.NewTask(taskType, payload), opts...)
}
