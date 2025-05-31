package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"server/internal/plugin/common/config"
	"server/internal/plugin/common/utils"
	"server/internal/plugin/db"
	"server/internal/router"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
)

var (
	configFile string
)

func init() {
	flag.StringVar(&configFile, "config", "./configs/config.yaml", "配置文件路径")
}

func main() {
	flag.Parse()

	// 加载配置
	if err := config.InitConfig(configFile); err != nil {
		log.Fatalf("加载配置失败: %v", err)
	}

	// 初始化日志
	if err := util.InitLogger(); err != nil {
		log.Fatalf("初始化日志失败: %v", err)
	}

	// 初始化数据库
	if err := db.InitDB(); err != nil {
		util.Fatal("初始化数据库失败", util.Zapfield("error", err))
	}
	defer db.CloseDB()

	// 初始化Redis
	if err := db.InitRedis(); err != nil {
		util.Fatal("初始化Redis失败", util.Zapfield("error", err))
	}
	defer db.CloseRedis()

	// 设置运行模式
	if config.AppConfig.App.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// 开启路由监听
	r := router.SetupRouter()

	// 创建HTTP服务器
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", config.AppConfig.App.Port),
		Handler:      r,
		ReadTimeout:  time.Duration(config.AppConfig.App.ReadTimeout) * time.Second,
		WriteTimeout: time.Duration(config.AppConfig.App.WriteTimeout) * time.Second,
		IdleTimeout:  time.Duration(config.AppConfig.App.IdleTimeout) * time.Second,
	}

	// 启动HTTP服务器
	go func() {
		util.Info("服务启动成功", util.Zapfield("port", config.AppConfig.App.Port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			util.Fatal("服务启动失败", util.Zapfield("error", err))
		}
	}()

	// 等待中断信号以优雅地关闭服务器
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	util.Info("关闭服务器...")

	// 设置关闭超时时间
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// 关闭服务器
	if err := srv.Shutdown(ctx); err != nil {
		util.Fatal("服务器关闭错误", util.Zapfield("error", err))
	}

	util.Info("服务器已成功关闭")
}

// 加载配置文件
func loadConfig() error {
	viper.SetConfigFile(configFile)
	viper.AutomaticEnv()

	return viper.ReadInConfig()
}
