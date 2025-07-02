/*
 * MIT License
 *
 * Copyright (c) 2025 linux.do
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

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

		if _, err = scheduler.Register("0 1 * * *", asynq.NewTask(task.UpdateAllBadgesTask, nil)); err != nil {
			return
		}

		// 启动调度器
		err = scheduler.Run()
	})
	return err
}
