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
	"context"
	"encoding/json"
	"errors"
	"io"
	"time"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/linux-do/cdk/internal/config"
	"github.com/linux-do/cdk/internal/db"
	"github.com/linux-do/cdk/internal/otel_trace"
	"go.opentelemetry.io/otel/codes"
	"gorm.io/gorm"
)

func GetUserIDFromSession(s sessions.Session) uint64 {
	userID, ok := s.Get(UserIDKey).(uint64)
	if !ok {
		return 0
	}
	return userID
}

func GetUserIDFromContext(c *gin.Context) uint64 {
	session := sessions.Default(c)
	return GetUserIDFromSession(session)
}

// GetUserFromContext 从Context中获取User对象
func GetUserFromContext(c *gin.Context) (*User, bool) {
	user, exists := c.Get(UserObjKey)
	if !exists {
		return nil, false
	}
	u, ok := user.(*User)
	return u, ok
}

// SetUserToContext 将User对象存储到Context中
func SetUserToContext(c *gin.Context, user *User) {
	c.Set(UserObjKey, user)
}

func doOAuth(ctx context.Context, code string) (*User, error) {
	// init trace
	ctx, span := otel_trace.Start(ctx, "OAuth")
	defer span.End()

	// get token
	token, err := oauthConf.Exchange(ctx, code)
	if err != nil {
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}

	// get user info
	client := oauthConf.Client(ctx, token)
	resp, err := client.Get(config.Config.OAuth2.UserEndpoint)
	if err != nil {
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}
	defer func(body io.ReadCloser) { _ = resp.Body.Close() }(resp.Body)

	// load user info
	responseData, err := io.ReadAll(resp.Body)
	if err != nil {
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}
	var userInfo OAuthUserInfo
	if err = json.Unmarshal(responseData, &userInfo); err != nil {
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}
	if !userInfo.Active {
		err = errors.New(BannedAccount)
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}

	var user User
	err = db.DB(ctx).Transaction(func(tx *gorm.DB) error {
		var holder User
		if conflictErr := tx.Where("username = ? AND id != ?", userInfo.Username, userInfo.Id).First(&holder).Error; conflictErr == nil {
			return errors.New(UsernameConflict)
		}

		// 根据 ID 处理当前用户的 更新 或 创建
		queryErr := tx.Where("id = ?", userInfo.Id).First(&user).Error
		if queryErr == nil {
			// 用户已存在 -> 更新信息
			if activeErr := user.CheckActive(); activeErr != nil {
				return activeErr
			}
			user.UpdateFromOAuthInfo(&userInfo)
			if saveErr := tx.Save(&user).Error; saveErr != nil {
				return saveErr
			}
		} else if errors.Is(queryErr, gorm.ErrRecordNotFound) {
			// 用户不存在 -> 创建新用户
			user = User{
				ID:          userInfo.Id,
				Username:    userInfo.Username,
				Nickname:    userInfo.Name,
				AvatarUrl:   userInfo.AvatarUrl,
				IsActive:    userInfo.Active,
				TrustLevel:  userInfo.TrustLevel,
				LastLoginAt: time.Now(),
			}
			if createErr := tx.Create(&user).Error; createErr != nil {
				return createErr
			}
			user.EnqueueBadgeScoreTask(ctx)
		} else {
			return queryErr
		}
		return nil
	})

	if err != nil {
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}

	return &user, nil
}
