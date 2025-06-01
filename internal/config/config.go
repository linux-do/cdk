package config

import (
	"log"
	"os"

	"github.com/spf13/viper"
)

var Config *configModel

func init() {
	// 加载配置文件路径
	configPath := os.Getenv("CONFIG_PATH")
	if configPath == "" {
		configPath = "config.yaml"
	}

	// 设置配置文件
	viper.SetConfigFile(configPath)
	viper.AutomaticEnv()

	// 读取配置文件
	if err := viper.ReadInConfig(); err != nil {
		log.Fatalf("[Config] read config failed: %v", err)
	}

	// 解析配置到结构体
	var c configModel
	if err := viper.Unmarshal(&c); err != nil {
		log.Fatalf("[Config] parse config failed: %v", err)
	}

	// 设置全局配置
	Config = &c
}
