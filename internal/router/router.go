package router

import (
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	_ "github.com/linux-do/cdk/docs"
	"github.com/linux-do/cdk/internal/config"
	"github.com/linux-do/cdk/internal/controller/health"
	"github.com/linux-do/cdk/internal/logger"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"log"
)

func Serve() {
	// 运行模式
	if config.Config.App.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// 初始化路由
	r := gin.New()
	r.Use(gin.Recovery(), gin.LoggerWithWriter(logger.GetLogWriter()))
	r.Use(sessions.Sessions("_s", cookie.NewStore([]byte(config.Config.App.SessionSecret))))

	// API
	apiRouter := r.Group("/api")
	{
		// Health
		apiRouter.GET("/health", health.Health)

		// Swagger
		apiRouter.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	}

	// Serve
	if err := r.Run(config.Config.App.Addr); err != nil {
		log.Fatalf("[API] serve api failed: %v", err)
	}
}
