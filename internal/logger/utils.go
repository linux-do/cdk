package logger

import (
	"github.com/linux-do/cdk/internal/config"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
	"log"
	"os"
)

// GetLogWriter 获取日志输出写入器
func GetLogWriter() zapcore.WriteSyncer {
	logConfig := config.Config.Log

	if logConfig.Output == "file" {

		// 初始化日志目录
		logPath := logConfig.FilePath
		if _, err := os.Stat(logPath); os.IsNotExist(err) {
			// 创建日志目录
			if err := os.MkdirAll(logPath, 0755); err != nil {
				log.Fatalf("[Logger] create log file dir err: %v\n", err)
			}
		} else if err != nil {
			log.Fatalf("[Logger] check log file dir err: %v\n", err)
		}

		// 配置日志轮转
		logOutput := &lumberjack.Logger{
			Filename:   logPath,
			MaxSize:    logConfig.MaxSize,
			MaxBackups: logConfig.MaxBackups,
			MaxAge:     logConfig.MaxAge,
			Compress:   logConfig.Compress,
		}

		return zapcore.AddSync(logOutput)
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

	if config.Config.Log.Format == "json" {
		return zapcore.NewJSONEncoder(encoderConfig)
	}
	return zapcore.NewConsoleEncoder(encoderConfig)
}

// getLogLevel 获取日志级别
func getLogLevel() zapcore.Level {
	level := config.Config.Log.Level

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
		log.Fatalf("[Logger] invalid log level: %s\n", level)
		return zapcore.InfoLevel
	}
}
