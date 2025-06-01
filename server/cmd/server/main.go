package main

import (
	"cdk_server/config"
	routes "cdk_server/internal/router"
	"fmt"
	"github.com/gin-gonic/gin"
)

func main() {
	// 加载配置
	cfg := config.MustLoad()

	// 设置运行模式
	gin.SetMode(cfg.App.Mode)

	router := gin.Default()

	routes.CreateRoutes(router)

	err := router.Run(cfg.App.Port)
	if err != nil {
		fmt.Println("router run error: ", err.Error())
		return
	}
}
