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
	"time"

	"github.com/hibiken/asynq"
	"github.com/linux-do/cdk/internal/logger"
	"github.com/linux-do/cdk/internal/otel_trace"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
)

// taskLoggingMiddleware 记录任务日志中间件
func taskLoggingMiddleware(h asynq.Handler) asynq.Handler {
	return asynq.HandlerFunc(func(ctx context.Context, t *asynq.Task) error {
		// 初始化 Trace
		ctx, span := otel_trace.Start(ctx, "TaskProcess_"+t.Type(), trace.WithSpanKind(trace.SpanKindConsumer))
		defer span.End()

		// 添加任务信息到 Span
		span.SetAttributes(
			attribute.String("task.type", t.Type()),
			attribute.Int("task.payload_size", len(t.Payload())),
			attribute.String("task.id", t.ResultWriter().TaskID()),
		)

		// 开始计时
		start := time.Now()

		// 处理任务
		err := h.ProcessTask(ctx, t)

		// 计算耗时
		latency := time.Since(start)

		if err != nil {
			logger.Error(
				ctx,
				"task processing failed",
				zap.String("task_type", t.Type()),
				zap.String("task_id", t.ResultWriter().TaskID()),
				zap.Int("payload_size", len(t.Payload())),
				zap.String("start_time", start.Format(time.RFC3339)),
				zap.Int64("latency_ms", latency.Milliseconds()),
				zap.Error(err),
			)

			span.SetStatus(codes.Error, err.Error())
			span.RecordError(err)
			return err
		}

		logger.Info(
			ctx,
			"task processing completed",
			zap.String("task_type", t.Type()),
			zap.String("task_id", t.ResultWriter().TaskID()),
			zap.Int("payload_size", len(t.Payload())),
			zap.String("start_time", start.Format(time.RFC3339)),
			zap.String("end_time", time.Now().Format(time.RFC3339)),
			zap.Int64("latency_ms", latency.Milliseconds()),
		)

		return nil
	})
}
