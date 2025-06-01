package router

import (
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"net/http"
	"server/internal/controller/oauth"
	"server/internal/plugin/common/config"
	util "server/internal/plugin/common/utils"
	"server/internal/plugin/middleware"
	"time"
)

type routeGroup struct {
	initFunc    func(*gin.RouterGroup) // 初始化函数
	comment     string                 // 注释，解释路由组的作用
	middlewares []gin.HandlerFunc      // 中间件列表
}

func SetupRouter() *gin.Engine {
	r := gin.New()

	// 使用自定义的 Logger 和 Recovery 中间件
	r.Use(gin.LoggerWithWriter(util.GetLogWriter()), gin.Recovery())

	store := cookie.NewStore([]byte("nlkngLNmnbfnlanfajk>Fgan"))
	r.Use(sessions.Sessions("oauth_session", store))

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

	// 定义路由组
	routeGroups := map[string]routeGroup{
		"/oauth2": {oauth.RegisterRoutes, "Linux DO 认证模块", nil}}

	for prefix, group := range routeGroups {
		g := router.Group(prefix)
		if group.middlewares != nil {
			g.Use(group.middlewares...)
		}
		group.initFunc(g)
	}
}
