package logger

import (
	"context"
	"github.com/uptrace/opentelemetry-go-extra/otelzap"
	"go.opentelemetry.io/otel/trace"
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

func Logger(ctx context.Context) otelzap.LoggerWithCtx {
	span := trace.SpanFromContext(ctx)
	spanContext := span.SpanContext()
	return logger.Ctx(ctx).WithOptions(
		zap.Fields(
			zap.String("traceID", spanContext.TraceID().String()),
			zap.String("spanID", spanContext.SpanID().String()),
		),
	)
}
