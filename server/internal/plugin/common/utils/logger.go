package util

import (
	"fmt"
	"os"
	"path/filepath"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
	"server/internal/plugin/common/config"
)

var (
	// Logger 全局日志实例
	Logger *zap.Logger
	// SugarLogger 全局Sugar日志实例
	SugarLogger *zap.SugaredLogger
)

// InitLogger 初始化日志
func InitLogger() error {
	var err error
	var core zapcore.Core

	// 获取日志配置
	logConfig := config.AppConfig.Log

	// 设置日志输出位置
	if logConfig.Output == "file" {
		// 创建日志目录
		logPath := logConfig.FilePath
		dir := filepath.Dir(logPath)
		if err := os.MkdirAll(dir, 0755); err != nil {
			return err
		}

		// 配置日志轮转
		w := zapcore.AddSync(&lumberjack.Logger{
			Filename:   logPath,
			MaxSize:    logConfig.MaxSize, // MB
			MaxBackups: logConfig.MaxBackups,
			MaxAge:     logConfig.MaxAge, // 天
			Compress:   logConfig.Compress,
		})

		// 设置日志格式
		encoder := getEncoder()

		// 设置日志级别
		logLevel := getLogLevel()

		// 创建Core
		core = zapcore.NewCore(encoder, w, logLevel)
	} else {
		// 使用os.Stdout作为日志输出
		core = zapcore.NewCore(getEncoder(), zapcore.AddSync(os.Stdout), getLogLevel())
	}

	// 创建Logger
	Logger = zap.New(core, zap.AddCaller(), zap.AddCallerSkip(1))
	SugarLogger = Logger.Sugar()

	return err
}

// GetLogWriter 获取日志输出写入器
func GetLogWriter() zapcore.WriteSyncer {
	logConfig := config.AppConfig.Log

	if logConfig.Output == "file" {
		// 创建日志目录
		logPath := logConfig.FilePath
		dir := filepath.Dir(logPath)
		if err := os.MkdirAll(dir, 0755); err != nil {
			fmt.Printf("创建日志目录失败: %v\n", err)
			return zapcore.AddSync(os.Stdout)
		}

		// 配置日志轮转
		logger := &lumberjack.Logger{
			Filename:   logPath,
			MaxSize:    logConfig.MaxSize, // MB
			MaxBackups: logConfig.MaxBackups,
			MaxAge:     logConfig.MaxAge, // 天
			Compress:   logConfig.Compress,
		}

		return zapcore.AddSync(logger)
	}

	return zapcore.AddSync(os.Stdout)
}

// getEncoder 获取日志编码器
func getEncoder() zapcore.Encoder {
	// 编码器配置
	encoderConfig := zapcore.EncoderConfig{
		TimeKey:        "time",
		LevelKey:       "level",
		NameKey:        "logger",
		CallerKey:      "caller",
		MessageKey:     "msg",
		StacktraceKey:  "stacktrace",
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeLevel:    zapcore.LowercaseLevelEncoder,
		EncodeTime:     zapcore.ISO8601TimeEncoder,
		EncodeDuration: zapcore.SecondsDurationEncoder,
		EncodeCaller:   zapcore.ShortCallerEncoder,
	}

	if config.AppConfig.Log.Format == "json" {
		return zapcore.NewJSONEncoder(encoderConfig)
	}
	return zapcore.NewConsoleEncoder(encoderConfig)
}

// getLogLevel 获取日志级别
func getLogLevel() zapcore.Level {
	level := config.AppConfig.Log.Level

	switch level {
	case "debug":
		return zapcore.DebugLevel
	case "info":
		return zapcore.InfoLevel
	case "warn":
		return zapcore.WarnLevel
	case "error":
		return zapcore.ErrorLevel
	default:
		return zapcore.InfoLevel
	}
}

// Debug 输出调试级别日志
func Debug(msg string, fields ...zap.Field) {
	Logger.Debug(msg, fields...)
}

// Info 输出信息级别日志
func Info(msg string, fields ...zap.Field) {
	Logger.Info(msg, fields...)
}

// Warn 输出警告级别日志
func Warn(msg string, fields ...zap.Field) {
	Logger.Warn(msg, fields...)
}

// Error 输出错误级别日志
func Error(msg string, fields ...zap.Field) {
	Logger.Error(msg, fields...)
}

// Fatal 输出致命错误级别日志
func Fatal(msg string, fields ...zap.Field) {
	Logger.Fatal(msg, fields...)
}

// Debugf 输出调试级别日志(格式化)
func Debugf(format string, args ...interface{}) {
	SugarLogger.Debugf(format, args...)
}

// Infof 输出信息级别日志(格式化)
func Infof(format string, args ...interface{}) {
	SugarLogger.Infof(format, args...)
}

// Warnf 输出警告级别日志(格式化)
func Warnf(format string, args ...interface{}) {
	SugarLogger.Warnf(format, args...)
}

// Errorf 输出错误级别日志(格式化)
func Errorf(format string, args ...interface{}) {
	SugarLogger.Errorf(format, args...)
}

// Fatalf 输出致命错误级别日志(格式化)
func Fatalf(format string, args ...interface{}) {
	SugarLogger.Fatalf(format, args...)
}
