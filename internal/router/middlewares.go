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
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/cdk/internal/logger"
	"github.com/linux-do/cdk/internal/requestid"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
)

func requestIDMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := requestid.GetOrNew(c.GetHeader(requestid.HeaderName))
		ctx := requestid.WithContext(c.Request.Context(), requestID)

		c.Request = c.Request.WithContext(ctx)
		c.Writer.Header().Set(requestid.HeaderName, requestID)
		c.Next()
	}
}

func loggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		span := trace.SpanFromContext(ctx)
		start := time.Now()

		c.Next()

		status := c.Writer.Status()
		latency := time.Since(start)
		fields := []zap.Field{
			zap.String("method", c.Request.Method),
			zap.String("path", c.Request.URL.Path),
			zap.Int("status", status),
			zap.Int64("latency_ms", latency.Milliseconds()),
			zap.String("client_ip", c.ClientIP()),
			zap.Int("response_size", c.Writer.Size()),
		}
		if rawQuery := c.Request.URL.RawQuery; rawQuery != "" {
			fields = append(fields, zap.String("query", rawQuery))
		}

		logger.Info(ctx, "http request completed", fields...)

		if span.SpanContext().IsValid() {
			if requestID := requestid.FromContext(ctx); requestID != "" {
				span.SetAttributes(attribute.String("request.id", requestID))
			}
		}

		if status >= 400 {
			span.SetStatus(codes.Error, strconv.Itoa(status))
		}
	}
}
