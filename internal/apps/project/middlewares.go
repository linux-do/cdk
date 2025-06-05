package project

import (
	"github.com/gin-gonic/gin"
	"github.com/linux-do/cdk/internal/apps/oauth"
	"github.com/linux-do/cdk/internal/db"
	"net/http"
)

func ProjectCreatorPermMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// load project
		project := &Project{}
		if err := project.Exact(db.DB(c.Request.Context()), c.Param("id")); err != nil {
			c.AbortWithStatusJSON(http.StatusNotFound, ProjectResponse{ErrorMsg: err.Error()})
			return
		}
		// check creator
		if project.CreatorID != oauth.GetUserIDFromContext(c) {
			c.AbortWithStatusJSON(http.StatusForbidden, ProjectResponse{ErrorMsg: NoPermission})
			return
		}
		// do next
		c.Next()
	}
}
