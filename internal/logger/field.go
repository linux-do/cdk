package logger

import (
	"go.uber.org/zap"
)

// Zapfield 创建zap字段
func Zapfield(key string, value interface{}) zap.Field {
	switch v := value.(type) {
	case error:
		return zap.Error(v)
	case string:
		return zap.String(key, v)
	case int:
		return zap.Int(key, v)
	case int64:
		return zap.Int64(key, v)
	case uint:
		return zap.Uint(key, v)
	case uint64:
		return zap.Uint64(key, v)
	case float64:
		return zap.Float64(key, v)
	case bool:
		return zap.Bool(key, v)
	default:
		return zap.Any(key, v)
	}
}
