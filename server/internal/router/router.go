package router

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"server/internal/plugin/common/config"
	util "server/internal/plugin/common/utils"
	"server/internal/plugin/middleware"
	"time"
)

func SetupRouter() *gin.Engine {
	r := gin.New()

	// 使用自定义的 Logger 和 Recovery 中间件
	r.Use(gin.LoggerWithWriter(util.GetLogWriter()), gin.Recovery())

	// 跨域中间件
	if config.AppConfig.App.AllowCORS {
		r.Use(middleware.CORS(config.AppConfig.App.CORSDomains))
	}

	apiRouter := r.Group(config.AppConfig.App.APIPrefix)

	// 健康检查路由
	apiRouter.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"code": 200,
			"msg":  "健康检查通过",
			"data": gin.H{
				"status": "ok",
				"time":   time.Now().Format(time.RFC3339),
			},
		})
	})

	// 注册API处理器
	registerAPIHandlers(apiRouter)

	return r
}

// 注册API处理器
func registerAPIHandlers(router *gin.RouterGroup) {

	//adminRouter := router.Group("")
	//adminRouter.Use(middleware.AuthMiddleware(), middleware.RoleMiddleware(model.UserRoleAdmin))
	//{
	//}
}
