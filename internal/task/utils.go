package task

import (
	"fmt"
	"github.com/hibiken/asynq"
	"github.com/linux-do/cdk/internal/config"
)

var (
	RedisOpt = asynq.RedisClientOpt{
		Addr:     fmt.Sprintf("%s:%d", config.Config.Redis.Host, config.Config.Redis.Port),
		Username: config.Config.Redis.Username,
		Password: config.Config.Redis.Password,
		DB:       config.Config.Redis.DB,
		PoolSize: config.Config.Redis.PoolSize,
	}
)
