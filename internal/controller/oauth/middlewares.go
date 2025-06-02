package oauth

import (
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"net/http"
)

func LoginRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		// init session
		session := sessions.Default(c)
		// load user
		userId := session.Get(UserIDKey)
		if userId == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error_msg": "Login Required", "data": nil})
			return
		}
		// check username
		userId, ok := userId.(string)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error_msg": "Login Required", "data": nil})
			return
		}
		// load user from db
		// TODO
		// check user active
		// TODO
		c.Next()
	}
}
