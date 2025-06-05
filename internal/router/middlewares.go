package router

import (
	"github.com/gin-gonic/gin"
	"github.com/linux-do/cdk/internal/logger"
	"github.com/linux-do/cdk/internal/otel_trace"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
	"strconv"
	"time"
)

func loggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 初始化 Trace
		ctx, span := otel_trace.Start(c.Request.Context(), "LoggerMiddleware")
		defer span.End()

		// 开始计时
		start := time.Now()

		// 记录请求路径和 Query
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery
		if raw != "" {
			path = path + "?" + raw
		}

		// 执行请求
		c.Next()

		// 停止计时
		end := time.Now()
		latency := end.Sub(start)

		// 打印日志
		logger.InfoF(
			ctx,
			"[LoggerMiddleware] %s %s\nStartTime: %s\nEndTime: %s\nLatency: %d\nClientIP: %s\nResponse: %d %d",
			c.Request.Method,
			path,
			start.Format(time.RFC3339),
			end.Format(time.RFC3339),
			latency.Milliseconds(),
			c.ClientIP(),
			c.Writer.Status(),
			c.Writer.Size(),
		)

		// 设置 Span 状态
		if c.Writer.Status() >= 400 {
			span := trace.SpanFromContext(ctx)
			span.SetStatus(codes.Error, strconv.Itoa(c.Writer.Status()))
		}
	}
}
