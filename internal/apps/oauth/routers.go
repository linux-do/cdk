package oauth

import (
	"context"
	"encoding/json"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/linux-do/cdk/internal/config"
	"io"
	"net/http"
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
	c.JSON(
		http.StatusOK,
		GetLoginURLResponse{
			ErrorMsg: "",
			Data:     oauthConf.AuthCodeURL(uuid.NewString()),
		},
	)
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
		c.JSON(
			http.StatusBadRequest,
			CallbackResponse{
				ErrorMsg: err.Error(),
				Data:     nil,
			},
		)
		return
	}
	// check state
	// TODO
	// get token
	token, err := oauthConf.Exchange(context.Background(), req.Code)
	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			CallbackResponse{
				ErrorMsg: err.Error(),
				Data:     nil,
			},
		)
		return
	}
	// get user info
	client := oauthConf.Client(context.Background(), token)
	resp, err := client.Get(config.Config.OAuth2.UserEndpoint)
	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			CallbackResponse{
				ErrorMsg: err.Error(),
				Data:     nil,
			},
		)
		return
	}
	defer func(body io.ReadCloser) { _ = resp.Body.Close() }(resp.Body)
	// load user info
	responseData, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			CallbackResponse{
				ErrorMsg: err.Error(),
				Data:     nil,
			},
		)
		return
	}
	var userInfo OAuthUserInfo
	if err := json.Unmarshal(responseData, &userInfo); err != nil {
		c.JSON(
			http.StatusInternalServerError,
			CallbackResponse{
				ErrorMsg: err.Error(),
				Data:     nil,
			},
		)
		return
	}
	// save to db
	// TODO
	// bind to session
	session := sessions.Default(c)
	session.Set(UserIDKey, userInfo.Id)
	session.Set(UserNameKey, userInfo.Username)
	session.Save()
	// response
	c.JSON(
		http.StatusOK,
		CallbackResponse{
			ErrorMsg: "",
			Data:     nil,
		},
	)
}
