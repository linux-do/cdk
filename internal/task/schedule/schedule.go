package schedule

import (
	"fmt"
	"github.com/linux-do/cdk/internal/task"
	"sync"
	"time"

	"github.com/hibiken/asynq"
)

var (
	AsynqClient   *asynq.Client
	scheduler     *asynq.Scheduler
	schedulerOnce sync.Once
)

func init() {
	AsynqClient = asynq.NewClient(task.RedisOpt)
}

// StartScheduler 启动调度器
func StartScheduler() error {
	var err error
	schedulerOnce.Do(func() {
		location, locErr := time.LoadLocation("Asia/Shanghai")
		if locErr != nil {
			err = fmt.Errorf("failed to load location: %w", locErr)
			return
		}
		scheduler = asynq.NewScheduler(
			task.RedisOpt,
			&asynq.SchedulerOpts{
				Location: location,
			},
		)

		if _, err = scheduler.Register("0 2 * * *", asynq.NewTask(task.UpdateUserBadgeScoresTask, nil)); err != nil {
			return
		}

		// 启动调度器
		err = scheduler.Run()
	})
	return err
}
