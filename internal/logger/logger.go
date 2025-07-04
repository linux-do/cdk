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

package logger

import (
	"context"
	"fmt"
	"log"

	"github.com/uptrace/opentelemetry-go-extra/otelzap"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var logger *otelzap.Logger

func init() {
	logWriter, err := GetLogWriter()
	if err != nil {
		log.Fatalf("[Logger] get log writer err: %v\n", err)
	}

	zapLogger := zap.New(
		zapcore.NewCore(getEncoder(), logWriter, getLogLevel()),
		zap.AddCaller(),
		zap.AddCallerSkip(1),
	)
	logger = otelzap.New(
		zapLogger,
		otelzap.WithMinLevel(zapLogger.Level()),
	)
	logger.Level()
}

func DebugF(ctx context.Context, format string, args ...interface{}) {
	msg := fmt.Sprintf(format, args...)
	logger.Ctx(ctx).Debug(msg, getTraceIDFields(ctx)...)
}

func InfoF(ctx context.Context, format string, args ...interface{}) {
	msg := fmt.Sprintf(format, args...)
	logger.Ctx(ctx).Info(msg, getTraceIDFields(ctx)...)
}

func WarnF(ctx context.Context, format string, args ...interface{}) {
	msg := fmt.Sprintf(format, args...)
	logger.Ctx(ctx).Warn(msg, getTraceIDFields(ctx)...)
}

func ErrorF(ctx context.Context, format string, args ...interface{}) {
	msg := fmt.Sprintf(format, args...)
	logger.Ctx(ctx).Error(msg, getTraceIDFields(ctx)...)
}
