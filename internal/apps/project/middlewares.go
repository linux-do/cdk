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
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/linux-do/cdk/internal/apps/oauth"
	"github.com/linux-do/cdk/internal/config"
	"github.com/linux-do/cdk/internal/db"
	"github.com/redis/go-redis/v9"
	"net/http"
	"time"
)

func ProjectCreateRateLimitMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := oauth.GetUserFromContext(c)

		ctx := c.Request.Context()
		userLimit := config.Config.ProjectApp.CreateProjectRateLimit[user.TrustLevel]
		key := fmt.Sprintf("rate_limit:project:create:%d:%s:%d", user.ID, user.Username, userLimit.IntervalSeconds)

		// get count
		count, err := db.Redis.Get(ctx, key).Int()
		if err != nil && !errors.Is(err, redis.Nil) {
			c.AbortWithStatusJSON(http.StatusInternalServerError, ProjectResponse{ErrorMsg: err.Error()})
			return
		}
		if count >= userLimit.MaxCount {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, ProjectResponse{
				ErrorMsg: TooManyRequests,
			})
			return
		}

		// set count + 1 and expire
		db.Redis.Incr(ctx, key)
		if count == 0 {
			db.Redis.Expire(ctx, key, time.Duration(userLimit.IntervalSeconds)*time.Second)
		}

		// do next
		c.Next()
	}
}

func ProjectCreatorPermMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// load project
		project := &Project{}
		if err := project.Exact(db.DB(c.Request.Context()), c.Param("id"), true); err != nil {
			c.AbortWithStatusJSON(http.StatusNotFound, ProjectResponse{ErrorMsg: err.Error()})
			return
		}
		// check creator
		if project.CreatorID != oauth.GetUserIDFromContext(c) {
			c.AbortWithStatusJSON(http.StatusForbidden, ProjectResponse{ErrorMsg: NoPermission})
			return
		}

		// set to context
		SetProjectToContext(c, project)

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
		now := time.Now()
		// load project
		projectID := c.Param("id")
		project := &Project{}
		if err := project.Exact(db.DB(ctx), projectID, true); err != nil {
			recordErrProjectReceive(c, now, user.ID, user.Username, projectID, time.Time{}, time.Time{}, NotFound)
			c.AbortWithStatusJSON(http.StatusNotFound, ProjectResponse{ErrorMsg: err.Error()})
			return
		}
		// check receivable
		if err := project.IsReceivable(ctx, now, user, c.ClientIP()); err != nil {
			recordErrProjectReceive(c, now, user.ID, user.Username, project.ID, project.StartTime, project.EndTime, err.Error())
			c.AbortWithStatusJSON(http.StatusForbidden, ProjectResponse{ErrorMsg: err.Error()})
			return
		}
		// do next
		c.Next()
	}
}
