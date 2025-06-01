package middleware

import (
	"errors"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"log"
	"net/http"
	utils "server/internal/plugin/common/utils"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"server/internal/plugin/common/config"
)

// JWTClaims 定义JWT Claims结构
type JWTClaims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

// AuthMiddleware 身份验证中间件
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从请求头中获取token
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"code": 401,
				"msg":  "未提供授权令牌",
			})
			return
		}

		// 提取Bearer token
		parts := strings.SplitN(authHeader, " ", 2)
		if !(len(parts) == 2 && parts[0] == "Bearer") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"code": 401,
				"msg":  "授权令牌格式错误",
			})
			return
		}

		// 验证token
		claims, err := validateToken(parts[1])
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"code": 401,
				"msg":  "无效的授权令牌: " + err.Error(),
			})
			return
		}

		// 将用户信息存储到上下文中
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("role", claims.Role)

		c.Next()
	}
}

// RoleMiddleware 角色验证中间件
func RoleMiddleware(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"code": 403,
				"msg":  "未授权访问",
			})
			return
		}

		// 验证角色
		userRole := role.(string)
		hasRole := false
		for _, r := range roles {
			if r == userRole {
				hasRole = true
				break
			}
		}

		if !hasRole {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"code": 403,
				"msg":  "权限不足",
			})
			return
		}

		c.Next()
	}
}

// GenerateToken 生成JWT令牌
func GenerateToken(userID string, username string, role string) (string, error) {
	// 创建令牌
	token := jwt.New(jwt.SigningMethodHS256)

	// 设置令牌过期时间
	ttl := config.AppConfig.App.JWTTTL
	claims := token.Claims.(jwt.MapClaims)
	claims["user_id"] = userID
	claims["username"] = username
	claims["role"] = role
	claims["exp"] = time.Now().Add(time.Hour * time.Duration(ttl)).Unix()

	// 使用密钥签名令牌
	return token.SignedString([]byte(config.AppConfig.App.JWTSecret))
}

// 验证JWT令牌
func validateToken(tokenString string) (*JWTClaims, error) {
	// 解析令牌
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, jwtKeyFunc)

	if err != nil {
		return nil, err
	}

	// 验证令牌有效性
	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("无效的令牌")
}

// 解析JWT密钥
func jwtKeyFunc(token *jwt.Token) (interface{}, error) {
	return []byte(config.AppConfig.App.JWTSecret), nil
}

// SetupOAuthSessionMiddleware OAuth session中间件
func SetupOAuthSessionMiddleware() gin.HandlerFunc {
	// 生成随机session密钥
	sessionKey, err := utils.GenerateRandomString(24)
	if err != nil {
		log.Fatal("生成session密钥失败:", err)
	}

	store := cookie.NewStore([]byte(sessionKey))
	return sessions.Sessions("oauth_session", store)
}
