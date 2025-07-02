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
