package utils

import (
	"crypto/rand"
	"encoding/hex"
	"log"

	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
)

// GenerateRandomString 生成随机字符串
func GenerateRandomString(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// SetupOAuthSession 设置OAuth session中间件
func SetupOAuthSession(router *gin.RouterGroup) {
	// 生成随机session密钥
	sessionKey, err := GenerateRandomString(24)
	if err != nil {
		log.Fatal("生成session密钥失败:", err)
	}

	store := cookie.NewStore([]byte(sessionKey))
	router.Use(sessions.Sessions("oauth_session", store))
}
