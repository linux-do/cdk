package otel_trace

import (
	"context"
	"github.com/linux-do/cdk/internal/config"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
)

func newTracerProvider() (*sdktrace.TracerProvider, error) {
	// 初始化 Resource
	r, err := resource.Merge(
		resource.Default(),
		resource.NewWithAttributes(
			semconv.SchemaURL,
			semconv.ServiceName(config.Config.App.AppName),
		),
	)
	if err != nil {
		return nil, err
	}

	// 初始化 Exporter
	traceExporter, err := otlptracegrpc.New(context.Background())
	if err != nil {
		return nil, err
	}

	// 初始化 Trace
	tracerProvider := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(traceExporter),
		sdktrace.WithResource(r),
	)
	return tracerProvider, nil
}
