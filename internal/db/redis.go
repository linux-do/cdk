package db

import (
	"context"
	"fmt"
	"github.com/linux-do/cdk/internal/config"
	"github.com/redis/go-redis/extra/redisotel/v9"
	"github.com/redis/go-redis/v9"
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

	// Trace
	if err := redisotel.InstrumentTracing(Redis); err != nil {
		log.Fatalf("[Redis] failed to init trace: %v\n", err)
	}

	// 测试连接
	_, err := Redis.Ping(context.Background()).Result()
	if err != nil {
		log.Fatalf("[Redis] failed to connect to redis: %v\n", err)
	}
}
