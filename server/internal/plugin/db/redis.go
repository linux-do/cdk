package db

import (
	"context"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
	"server/internal/plugin/common/config"
)

var (
	// RedisClient 全局Redis客户端实例
	RedisClient *redis.Client
	// RedisContext Redis操作上下文
	RedisContext = context.Background()
)

// InitRedis 初始化Redis连接
func InitRedis() error {
	redisConfig := config.AppConfig.Redis

	addr := fmt.Sprintf("%s:%d", redisConfig.Host, redisConfig.Port)

	RedisClient = redis.NewClient(&redis.Options{
		Addr:            addr,
		Password:        redisConfig.Password,
		DB:              redisConfig.DB,
		PoolSize:        redisConfig.PoolSize,
		MinIdleConns:    redisConfig.MinIdleConns,
		DialTimeout:     time.Duration(redisConfig.DialTimeout) * time.Second,
		ReadTimeout:     time.Duration(redisConfig.ReadTimeout) * time.Second,
		WriteTimeout:    time.Duration(redisConfig.WriteTimeout) * time.Second,
		MaxRetries:      redisConfig.MaxRetries,
		MinRetryBackoff: time.Duration(redisConfig.MinRetryBackoff) * time.Millisecond,
		MaxRetryBackoff: time.Duration(redisConfig.MaxRetryBackoff) * time.Millisecond,
	})

	// 测试连接
	_, err := RedisClient.Ping(RedisContext).Result()
	if err != nil {
		return fmt.Errorf("redis连接失败: %v", err)
	}

	return nil
}

// CloseRedis 关闭Redis连接
func CloseRedis() error {
	if RedisClient != nil {
		return RedisClient.Close()
	}
	return nil
}

// GetRedis 获取Redis连接
func GetRedis() *redis.Client {
	return RedisClient
}

// SetCache 设置缓存
func SetCache(key string, value interface{}, expiration time.Duration) error {
	return RedisClient.Set(RedisContext, key, value, expiration).Err()
}

// GetCache 获取缓存
func GetCache(key string) (string, error) {
	return RedisClient.Get(RedisContext, key).Result()
}

// DeleteCache 删除缓存
func DeleteCache(keys ...string) error {
	return RedisClient.Del(RedisContext, keys...).Err()
}

// HashSet 设置哈希表字段
func HashSet(key string, field string, value interface{}) error {
	return RedisClient.HSet(RedisContext, key, field, value).Err()
}

// HashGet 获取哈希表字段
func HashGet(key, field string) (string, error) {
	return RedisClient.HGet(RedisContext, key, field).Result()
}

// HashDelete 删除哈希表字段
func HashDelete(key string, fields ...string) error {
	return RedisClient.HDel(RedisContext, key, fields...).Err()
}

// ListPush 将元素推入列表
func ListPush(key string, values ...interface{}) error {
	return RedisClient.RPush(RedisContext, key, values...).Err()
}

// ListPop 从列表弹出元素
func ListPop(key string) (string, error) {
	return RedisClient.LPop(RedisContext, key).Result()
}

// Exists 检查键是否存在
func Exists(keys ...string) (bool, error) {
	n, err := RedisClient.Exists(RedisContext, keys...).Result()
	return n > 0, err
}

// Expire 设置键过期时间
func Expire(key string, expiration time.Duration) error {
	return RedisClient.Expire(RedisContext, key, expiration).Err()
}
