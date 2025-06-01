package db

import (
	"context"
	"fmt"
	"github.com/go-redis/redis/v8"
	"github.com/linux-do/cdk/internal/config"
	"log"
	"time"
)

var (
	Redis *redis.Client
)

func init() {
	redisConfig := config.Config.Redis

	addr := fmt.Sprintf("%s:%d", redisConfig.Host, redisConfig.Port)

	Redis = redis.NewClient(
		&redis.Options{
			Addr:         addr,
			Username:     redisConfig.Username,
			Password:     redisConfig.Password,
			DB:           redisConfig.DB,
			PoolSize:     redisConfig.PoolSize,
			MinIdleConns: redisConfig.MinIdleConn,
			DialTimeout:  time.Duration(redisConfig.DialTimeout) * time.Second,
			ReadTimeout:  time.Duration(redisConfig.ReadTimeout) * time.Second,
			WriteTimeout: time.Duration(redisConfig.WriteTimeout) * time.Second,
		},
	)

	// 测试连接
	_, err := Redis.Ping(context.Background()).Result()
	if err != nil {
		log.Fatalf("[Redis] failed to connect to redis: %v", err)
	}
}
