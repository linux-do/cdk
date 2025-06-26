package worker

import (
	"context"
	"time"

	"github.com/hibiken/asynq"
	"github.com/linux-do/cdk/internal/logger"
	"github.com/linux-do/cdk/internal/otel_trace"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
)

// taskLoggingMiddleware 记录任务日志中间件
func taskLoggingMiddleware(h asynq.Handler) asynq.Handler {
	return asynq.HandlerFunc(func(ctx context.Context, t *asynq.Task) error {
		// 初始化 Trace
		ctx, span := otel_trace.Start(ctx, "TaskProcess_"+t.Type())
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
			// 处理出错，记录错误日志
			logger.ErrorF(
				ctx,
				"[TaskMiddleware] 任务处理失败 Type: %s\nStartTime: %s\nLatency: %d ms\nError: %v",
				t.Type(),
				start.Format(time.RFC3339),
				latency.Milliseconds(),
				err,
			)

			// 设置 Span 错误状态
			span.SetStatus(codes.Error, err.Error())
			span.RecordError(err)
			return err
		}

		// 处理成功，记录成功日志
		logger.InfoF(
			ctx,
			"[TaskMiddleware] 任务处理完成 Type: %s\nStartTime: %s\nEndTime: %s\nLatency: %d ms",
			t.Type(),
			start.Format(time.RFC3339),
			time.Now().Format(time.RFC3339),
			latency.Milliseconds(),
		)

		return nil
	})
}
