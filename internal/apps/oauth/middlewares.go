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

package oauth

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/cdk/internal/db"
	"github.com/linux-do/cdk/internal/logger"
	"github.com/linux-do/cdk/internal/otel_trace"
)

func LoginRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		// init trace
		ctx, span := otel_trace.Start(c.Request.Context(), "LoginRequired")
		defer span.End()

		// load user
		userId := GetUserIDFromContext(c)
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
		logger.InfoF(ctx, "[LoginRequired] %d %s", user.ID, user.Username)

		// set user info
		SetUserToContext(c, &user)

		// next
		c.Next()
	}
}
