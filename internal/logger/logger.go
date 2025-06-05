package logger

import (
	"context"
	"fmt"
	"github.com/uptrace/opentelemetry-go-extra/otelzap"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var logger *otelzap.Logger

func init() {
	zapLogger := zap.New(
		zapcore.NewCore(getEncoder(), GetLogWriter(), getLogLevel()),
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
