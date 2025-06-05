package oauth

import (
	"context"
	"encoding/json"
	"errors"
	"github.com/gin-contrib/sessions"
	"github.com/linux-do/cdk/internal/config"
	"github.com/linux-do/cdk/internal/db"
	"github.com/linux-do/cdk/internal/otel_trace"
	"go.opentelemetry.io/otel/codes"
	"gorm.io/gorm"
	"io"
	"time"
)

func GetUsernameFromSession(s sessions.Session) string {
	username, ok := s.Get(UserNameKey).(string)
	if !ok {
		return ""
	}
	return username
}

func GetUserIDFromSession(s sessions.Session) uint64 {
	userID, ok := s.Get(UserIDKey).(uint64)
	if !ok {
		return 0
	}
	return userID
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
	client := oauthConf.Client(context.Background(), token)
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

	// save to db
	var user User
	tx := db.DB(ctx).Where("id = ?", userInfo.Id).First(&user)
	if tx.Error != nil {
		// create user
		if errors.Is(tx.Error, gorm.ErrRecordNotFound) {
			user = User{
				ID:          userInfo.Id,
				Username:    userInfo.Username,
				Nickname:    userInfo.Name,
				AvatarUrl:   userInfo.AvatarUrl,
				IsActive:    userInfo.Active,
				TrustLevel:  userInfo.TrustLevel,
				LastLoginAt: time.Now().UTC(),
			}
			tx = db.DB(ctx).Create(&user)
			if tx.Error != nil {
				span.SetStatus(codes.Error, tx.Error.Error())
				return nil, tx.Error
			}
		} else {
			// response failed
			span.SetStatus(codes.Error, tx.Error.Error())
			return nil, tx.Error
		}
	} else {
		// update user
		user.Username = userInfo.Username
		user.Nickname = userInfo.Name
		user.AvatarUrl = userInfo.AvatarUrl
		user.IsActive = userInfo.Active
		user.TrustLevel = userInfo.TrustLevel
		user.LastLoginAt = time.Now().UTC()
		tx = db.DB(ctx).Save(&user)
		if tx.Error != nil {
			span.SetStatus(codes.Error, tx.Error.Error())
			return nil, tx.Error
		}
	}
	return &user, nil
}
