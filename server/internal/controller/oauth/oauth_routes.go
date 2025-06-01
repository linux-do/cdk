package oauth

import (
	"log"
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	oauthService "server/internal/logic/oauth"
	"server/internal/logic/utils"
)

// RegisterRoutes 注册OAuth路由
func RegisterRoutes(router *gin.RouterGroup) {
	// 设置session中间件
	utils.SetupOAuthSession(router)

	// OAuth路由
	router.GET("/initiate", InitiateHandler)
	router.GET("/callback", CallbackHandler)

}

// InitiateHandler 发起OAuth授权
func InitiateHandler(c *gin.Context) {
	state, err := utils.GenerateRandomString(16)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate state"})
		return
	}

	session := sessions.Default(c)
	session.Set("oauth_state", state)
	session.Save()

	service := oauthService.NewOAuthService()
	authURL := service.GetAuthorizationURL(state)
	c.Redirect(http.StatusFound, authURL)
}

// CallbackHandler 处理OAuth回调
func CallbackHandler(c *gin.Context) {
	session := sessions.Default(c)

	code := c.Query("code")
	state := c.Query("state")

	// 验证state
	savedState := session.Get("oauth_state")
	if savedState == nil || savedState.(string) != state {
		log.Println("State验证失败")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "State value does not match"})
		return
	}

	session.Delete("oauth_state")
	session.Save()

	// 获取用户信息
	service := oauthService.NewOAuthService()
	userInfo, err := service.GetUserInfo(code)
	if err != nil {
		log.Printf("获取用户信息失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user info"})
		return
	}

	log.Printf("用户信息: %+v", userInfo)
	c.JSON(http.StatusOK, userInfo)
}
