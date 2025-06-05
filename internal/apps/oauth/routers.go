package oauth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/linux-do/cdk/internal/config"
	"github.com/linux-do/cdk/internal/db"
	"github.com/linux-do/cdk/internal/logger"
	"gorm.io/gorm"
	"io"
	"net/http"
	"time"
)

type GetLoginURLResponse struct {
	ErrorMsg string `json:"error_msg"`
	Data     string `json:"data"`
}

// GetLoginURL godoc
// @Tags oauth
// @Produce json
// @Success 200 {object} GetLoginURLResponse
// @Router /api/v1/oauth/login [get]
func GetLoginURL(c *gin.Context) {
	// 存储 State 到缓存
	state := uuid.NewString()
	cmd := db.Redis.Set(c.Request.Context(), fmt.Sprintf(OAuthStateCacheKeyFormat, state), state, OAuthStateCacheKeyExpiration)
	if cmd.Err() != nil {
		c.JSON(http.StatusInternalServerError, GetLoginURLResponse{ErrorMsg: cmd.Err().Error()})
		return
	}
	// 构造登录 URL
	c.JSON(http.StatusOK, GetLoginURLResponse{Data: oauthConf.AuthCodeURL(state)})
}

type CallbackRequest struct {
	State string `json:"state"`
	Code  string `json:"code"`
}

type CallbackResponse struct {
	ErrorMsg string      `json:"error_msg"`
	Data     interface{} `json:"data"`
}

// Callback godoc
// @Tags oauth
// @Param request body CallbackRequest true "request body"
// @Produce json
// @Success 200 {object} CallbackResponse
// @Router /api/v1/oauth/callback [post]
func Callback(c *gin.Context) {
	// init req
	var req CallbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, CallbackResponse{ErrorMsg: err.Error()})
		return
	}
	// check state
	cmd := db.Redis.Get(c.Request.Context(), fmt.Sprintf(OAuthStateCacheKeyFormat, req.State))
	if cmd.Err() != nil {
		c.JSON(http.StatusInternalServerError, CallbackResponse{ErrorMsg: cmd.Err().Error()})
		return
	} else if cmd.Val() != req.State {
		c.JSON(http.StatusBadRequest, CallbackResponse{ErrorMsg: InvalidState})
		return
	}
	db.Redis.Del(c.Request.Context(), fmt.Sprintf(OAuthStateCacheKeyFormat, req.State))
	// get token
	token, err := oauthConf.Exchange(c.Request.Context(), req.Code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, CallbackResponse{ErrorMsg: err.Error()})
		return
	}
	// get user info
	client := oauthConf.Client(context.Background(), token)
	resp, err := client.Get(config.Config.OAuth2.UserEndpoint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, CallbackResponse{ErrorMsg: err.Error()})
		return
	}
	defer func(body io.ReadCloser) { _ = resp.Body.Close() }(resp.Body)
	// load user info
	responseData, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, CallbackResponse{ErrorMsg: err.Error()})
		return
	}
	var userInfo OAuthUserInfo
	if err := json.Unmarshal(responseData, &userInfo); err != nil {
		c.JSON(http.StatusInternalServerError, CallbackResponse{ErrorMsg: err.Error()})
		return
	}
	// save to db
	var user User
	tx := db.DB(c.Request.Context()).Where("id = ?", userInfo.Id).First(&user)
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
			tx = db.DB(c.Request.Context()).Create(&user)
			if tx.Error != nil {
				c.JSON(http.StatusInternalServerError, CallbackResponse{ErrorMsg: tx.Error.Error()})
				return
			}
		} else {
			// response failed
			c.JSON(http.StatusInternalServerError, CallbackResponse{ErrorMsg: tx.Error.Error()})
			return
		}
	} else {
		// update user
		user.Username = userInfo.Username
		user.Nickname = userInfo.Name
		user.AvatarUrl = userInfo.AvatarUrl
		user.IsActive = userInfo.Active
		user.TrustLevel = userInfo.TrustLevel
		user.LastLoginAt = time.Now().UTC()
		tx = db.DB(c.Request.Context()).Save(&user)
		if tx.Error != nil {
			c.JSON(http.StatusInternalServerError, CallbackResponse{ErrorMsg: tx.Error.Error()})
			return
		}
	}
	// bind to session
	session := sessions.Default(c)
	session.Set(UserIDKey, userInfo.Id)
	session.Set(UserNameKey, userInfo.Username)
	if err := session.Save(); err != nil {
		c.JSON(http.StatusInternalServerError, CallbackResponse{ErrorMsg: err.Error()})
	}
	// response
	c.JSON(http.StatusOK, CallbackResponse{})
	logger.Logger(c.Request.Context()).Info(fmt.Sprintf("[OAuthCallback] %d %s", user.ID, user.Username))
}

type BasicUserInfo struct {
	ID         uint64     `json:"id"`
	Username   string     `json:"username"`
	Nickname   string     `json:"nickname"`
	TrustLevel TrustLevel `json:"trust_level"`
	AvatarUrl  string     `json:"avatar_url"`
}

type UserInfoResponse struct {
	ErrorMsg string        `json:"error_msg"`
	Data     BasicUserInfo `json:"data"`
}

// UserInfo godoc
// @Tags oauth
// @Produce json
// @Success 200 {object} UserInfoResponse
// @Router /api/v1/oauth/user-info [get]
func UserInfo(c *gin.Context) {
	// init
	session := sessions.Default(c)
	userID := GetUserIDFromSession(session)
	// query db
	var user User
	tx := db.DB(c.Request.Context()).Where("id = ?", userID).First(&user)
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, UserInfoResponse{ErrorMsg: tx.Error.Error()})
		return
	}
	c.JSON(
		http.StatusOK,
		UserInfoResponse{
			ErrorMsg: "",
			Data: BasicUserInfo{
				ID:         user.ID,
				Username:   user.Username,
				Nickname:   user.Nickname,
				TrustLevel: user.TrustLevel,
				AvatarUrl:  user.AvatarUrl,
			},
		},
	)
}

type LogoutResponse struct {
	ErrorMsg string      `json:"error_msg"`
	Data     interface{} `json:"data"`
}

// Logout godoc
// @Tags oauth
// @Produce json
// @Success 200 {object} LogoutResponse
// @Router /api/v1/oauth/logout [get]
func Logout(c *gin.Context) {
	session := sessions.Default(c)
	session.Clear()
	if err := session.Save(); err != nil {
		c.JSON(http.StatusInternalServerError, LogoutResponse{ErrorMsg: err.Error()})
		return
	}
	c.JSON(http.StatusOK, LogoutResponse{})
}
