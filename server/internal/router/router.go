package routes

import (
	"cdk_server/internal/controller/oauth"
	"github.com/gin-gonic/gin"
)

type routeGroup struct {
	initFunc    func(*gin.RouterGroup) // 初始化函数
	comment     string                 // 注释，解释路由组的作用
	middlewares []gin.HandlerFunc      // 中间件列表
}

func CreateRoutes(router *gin.Engine) {
	api := router.Group("/api")

	// 定义路由组
	routeGroups := map[string]routeGroup{
		"/oauth2": {oauth.RegisterRoutes, "Linux DO 认证模块", nil},
	}

	for prefix, group := range routeGroups {
		g := api.Group(prefix)
		if group.middlewares != nil {
			g.Use(group.middlewares...)
		}
		group.initFunc(g)
	}
}
