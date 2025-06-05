package oauth

import (
	"fmt"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/linux-do/cdk/internal/db"
	"github.com/linux-do/cdk/internal/logger"
	"github.com/linux-do/cdk/internal/otel_trace"
	"net/http"
)

func LoginRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		// init trace
		ctx, span := otel_trace.Start(c.Request.Context(), "LoginRequired")
		defer span.End()

		// init session
		session := sessions.Default(c)

		// load user
		userId := GetUserIDFromSession(session)
		if userId <= 0 {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error_msg": UnAuthorized, "data": nil})
			return
		}

		// load user from db to make sure is active
		var user User
		tx := db.DB(ctx).Where("id = ? AND is_active = ?", userId, true).First(&user)
		if tx.Error != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error_msg": tx.Error.Error(), "data": nil})
			return
		}

		// log
		logger.Logger(ctx).Info(fmt.Sprintf("[LoginRequired] %d %s", user.ID, user.Username))

		// next
		c.Next()
	}
}
