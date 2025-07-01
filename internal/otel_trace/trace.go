package otel_trace

import (
	"context"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
	"log"
)

var Tracer trace.Tracer
var shutdownFuncs []func(context.Context) error

func init() {
	// 初始化 Propagator
	prop := newPropagator()
	otel.SetTextMapPropagator(prop)

	// 初始化 Trace Provider
	tracerProvider, err := newTracerProvider()
	if err != nil {
		log.Fatalf("[Trace] init trace provider failed: %v", err)
	}
	shutdownFuncs = append(shutdownFuncs, tracerProvider.Shutdown)
	otel.SetTracerProvider(tracerProvider)

	// 初始化 Tracer
	Tracer = tracerProvider.Tracer("github.com/linux-do/cdk")
}

func Shutdown(ctx context.Context) {
	for _, fn := range shutdownFuncs {
		_ = fn(ctx)
	}
	shutdownFuncs = nil
}

func Start(ctx context.Context, name string, opts ...trace.SpanStartOption) (context.Context, trace.Span) {
	return Tracer.Start(ctx, name, opts...)
}
