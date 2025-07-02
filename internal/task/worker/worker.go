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
