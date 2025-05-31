package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// CORS 跨域中间件
func CORS(allowOrigins []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if origin != "" {
			// 检查请求源是否在允许列表中
			isAllowed := false
			if len(allowOrigins) == 0 {
				// 如果没有指定域名，则默认允许所有
				isAllowed = true
			} else {
				for _, allowOrigin := range allowOrigins {
					if allowOrigin == "*" || origin == allowOrigin {
						isAllowed = true
						break
					}
					// 支持通配符匹配 (例如 *.example.com)
					if strings.HasPrefix(allowOrigin, "*") && strings.HasSuffix(origin, allowOrigin[1:]) {
						isAllowed = true
						break
					}
				}
			}

			// 如果允许，则设置CORS头
			if isAllowed {
				c.Header("Access-Control-Allow-Origin", origin)
				c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
				c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
				c.Header("Access-Control-Allow-Credentials", "true")
				c.Header("Access-Control-Max-Age", "86400") // 24小时
			}
		}

		// 处理预检请求
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
