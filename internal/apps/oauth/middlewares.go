package oauth

import (
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/linux-do/cdk/internal/db"
	"net/http"
)

func LoginRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		// init session
		session := sessions.Default(c)
		// load user
		userId := GetUserIDFromSession(session)
		if userId <= 0 {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error_msg": UnAuthorized, "data": nil})
			return
		}
		// load user from db to make sure is active
		tx := db.DB.Where("id = ? AND is_active = ?", userId, true).First(&User{})
		if tx.Error != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error_msg": tx.Error.Error(), "data": nil})
			return
		}
		// set userID
		c.Set(UserIDKey, userId)
		// next
		c.Next()
	}
}
