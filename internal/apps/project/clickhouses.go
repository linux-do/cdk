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

package project

import (
	"encoding/json"
	"github.com/linux-do/cdk/internal/db"
	"github.com/linux-do/cdk/internal/otel_trace"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/cdk/internal/config"
)

func recordErrProjectReceive(c *gin.Context, reqTime time.Time, userId uint64, userName string,
	projectId string, projectStartTime, projectEndTime time.Time, errorMsg string) {
	if !config.Config.ClickHouse.Enabled {
		return
	}
	// init trace
	ctx, span := otel_trace.Start(c.Request.Context(), "ClickHouse")
	defer span.End()

	clientInfo := map[string]interface{}{
		"ip":         c.ClientIP(),
		"user_agent": c.Request.UserAgent(),
		"referer":    c.Request.Referer(),
		"origin":     c.Request.Header.Get("Origin"),
	}

	clientInfoJSON, _ := json.Marshal(clientInfo)
	traceID := trace.SpanFromContext(c.Request.Context()).SpanContext().TraceID().String()

	if errExec := db.ChConn.AsyncInsert(ctx, `
            INSERT INTO err_receive_logs (
                request_time, trace_id, user_id, user_name, project_id, project_start_time, project_end_time,
                error_message, client_info
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		true,
		reqTime,
		traceID,
		userId,
		userName,
		projectId,
		projectStartTime,
		projectEndTime,
		errorMsg,
		string(clientInfoJSON),
	); errExec != nil {
		span.SetStatus(codes.Error, errExec.Error())
	}
}
