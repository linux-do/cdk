/*
 * MIT License
 *
 * Copyright (c) 2025 linux.do
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

package project

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/cdk/internal/apps/oauth"
	"github.com/linux-do/cdk/internal/db"
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

func ReceiveProjectMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// init
		ctx := c.Request.Context()
		// load user
		user := &oauth.User{}
		if err := user.Exact(db.DB(ctx), oauth.GetUserIDFromContext(c)); err != nil {
			c.AbortWithStatusJSON(http.StatusNotFound, ProjectResponse{ErrorMsg: err.Error()})
			return
		}
		// load project
		projectID := c.Param("id")
		project := &Project{}
		if err := project.Exact(db.DB(ctx), projectID); err != nil {
			c.AbortWithStatusJSON(http.StatusNotFound, ProjectResponse{ErrorMsg: err.Error()})
			return
		}
		// check receivable
		if err := project.IsReceivable(ctx, user, c.ClientIP()); err != nil {
			c.AbortWithStatusJSON(http.StatusForbidden, ProjectResponse{ErrorMsg: err.Error()})
			return
		}
		// do next
		c.Next()
	}
}
