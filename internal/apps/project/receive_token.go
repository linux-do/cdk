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
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/cdk/internal/apps/oauth"
	"github.com/linux-do/cdk/internal/config"
	"github.com/linux-do/cdk/internal/db"
	"github.com/linux-do/cdk/internal/logger"
	"github.com/linux-do/cdk/internal/utils"
	"github.com/redis/go-redis/v9"
)

// 领取凭证（receive token）+ 服务端人机验证
//
// 领取分两步：
//  1. GET  /projects/:id/receive/token  项目可领取时签发一次性凭证（绑定 用户+项目），记录签发时间
//  2. POST /projects/:id/receive        提交 captcha_token + receive_token
//
// 服务端校验顺序：消费凭证（一次性） → hCaptcha siteverify → 验证码解出时间(challenge_ts) 必须晚于凭证签发时间。
// 最后一条保证验证码只能在"取凭证之后"解出，提前用 window.hcaptcha.execute() 囤的验证码无法使用；
// 正常用户的流程天然是 点击 → 取凭证 → 弹验证码，不受影响。

const (
	// receiveTokenTTL 凭证有效期
	receiveTokenTTL = 2 * time.Minute
	// receiveTokenBytes 凭证随机字节数
	receiveTokenBytes = 32
	// receiveBodyMaxBytes 领取请求体上限
	receiveBodyMaxBytes = 64 << 10
	// captchaTokenMaxLength 验证码 token 长度上限
	captchaTokenMaxLength = 8192
	// captchaClockSkew 允许 hCaptcha 与本服务之间的时钟偏差（challenge_ts 精度 1s，双方均 NTP 对时）
	captchaClockSkew = 3 * time.Second
	// defaultCaptchaVerifyURL hCaptcha 官方校验地址
	defaultCaptchaVerifyURL = "https://api.hcaptcha.com/siteverify"
)

// receiveTokenConsumeScript 原子比较并删除：token 一致才删除并返回存储值（含签发时间），保证一次性
var receiveTokenConsumeScript = redis.NewScript(`
local v = redis.call('GET', KEYS[1])
if v and string.sub(v, 1, #ARGV[1] + 1) == ARGV[1] .. ':' then
  redis.call('DEL', KEYS[1])
  return v
end
return false
`)

// ReceiveTokenResponseData 领取凭证响应
type ReceiveTokenResponseData struct {
	Token     string `json:"token"`
	ExpiresIn int    `json:"expires_in"`
}

type receiveRequestBody struct {
	CaptchaToken string `json:"captcha_token"`
	ReceiveToken string `json:"receive_token"`
}

type captchaVerifyResponse struct {
	Success     bool     `json:"success"`
	ChallengeTS string   `json:"challenge_ts"`
	ErrorCodes  []string `json:"error-codes"`
}

func receiveTokenKey(projectID string, userID uint64) string {
	return fmt.Sprintf("project:%s:receive_token:%d", projectID, userID)
}

// GetReceiveToken
// @Tags project
// @Summary 获取领取凭证
// @Description 项目可领取时签发一次性凭证，领取时需与 captcha_token 一并提交
// @Produce json
// @Param id path string true "项目ID"
// @Success 200 {object} ProjectResponse{data=ReceiveTokenResponseData}
// @Router /api/v1/projects/{id}/receive/token [get]
func GetReceiveToken(c *gin.Context) {
	ctx := c.Request.Context()
	project, ok := GetProjectFromContext(c)
	if !ok || project == nil {
		c.JSON(http.StatusInternalServerError, ProjectResponse{ErrorMsg: UnknownError})
		return
	}

	raw := make([]byte, receiveTokenBytes)
	if _, err := rand.Read(raw); err != nil {
		c.JSON(http.StatusInternalServerError, ProjectResponse{ErrorMsg: err.Error()})
		return
	}
	token := hex.EncodeToString(raw)

	// 存储格式：token:签发时间(unix 秒)
	value := token + ":" + strconv.FormatInt(time.Now().Unix(), 10)
	if err := db.Redis.Set(ctx, receiveTokenKey(project.ID, oauth.GetUserIDFromContext(c)), value, receiveTokenTTL).Err(); err != nil {
		c.JSON(http.StatusInternalServerError, ProjectResponse{ErrorMsg: err.Error()})
		return
	}

	c.JSON(http.StatusOK, ProjectResponse{Data: ReceiveTokenResponseData{
		Token:     token,
		ExpiresIn: int(receiveTokenTTL / time.Second),
	}})
}

// consumeReceiveToken 消费凭证，返回签发时间；凭证无效返回 ok=false
func consumeReceiveToken(ctx context.Context, projectID string, userID uint64, token string) (issuedAt time.Time, ok bool, err error) {
	if len(token) != receiveTokenBytes*2 {
		return time.Time{}, false, nil
	}
	if _, decErr := hex.DecodeString(token); decErr != nil {
		return time.Time{}, false, nil
	}
	value, err := receiveTokenConsumeScript.Run(ctx, db.Redis, []string{receiveTokenKey(projectID, userID)}, token).Text()
	if errors.Is(err, redis.Nil) {
		return time.Time{}, false, nil
	}
	if err != nil {
		return time.Time{}, false, err
	}
	unix, parseErr := strconv.ParseInt(strings.TrimPrefix(value, token+":"), 10, 64)
	if parseErr != nil {
		return time.Time{}, false, nil
	}
	return time.Unix(unix, 0), true, nil
}

// verifyCaptcha 调用 hCaptcha siteverify。
// 返回 (用户可见错误, 服务端错误)：前者非空表示校验不通过；后者非空表示校验服务异常。
func verifyCaptcha(ctx context.Context, token, remoteIP string, issuedAt time.Time) (string, error) {
	cfg := config.Config.Captcha
	if cfg.SecretKey == "" {
		return "", errors.New("captcha secret_key is not configured")
	}
	verifyURL := cfg.VerifyURL
	if verifyURL == "" {
		verifyURL = defaultCaptchaVerifyURL
	}

	form := url.Values{}
	form.Set("secret", cfg.SecretKey)
	form.Set("response", token)
	if remoteIP != "" {
		form.Set("remoteip", remoteIP)
	}

	resp, err := utils.Request(ctx, http.MethodPost, verifyURL, strings.NewReader(form.Encode()),
		map[string]string{"Content-Type": "application/x-www-form-urlencoded"}, nil)
	if err != nil {
		return "", err
	}
	defer func() { _ = resp.Body.Close() }()
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("captcha verify status %d", resp.StatusCode)
	}

	var result captchaVerifyResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	if !result.Success {
		for _, code := range result.ErrorCodes {
			switch code {
			case "timeout-or-duplicate":
				return CaptchaExpired, nil
			case "invalid-input-secret", "missing-input-secret", "sitekey-secret-mismatch":
				return "", fmt.Errorf("captcha verify config error: %v", result.ErrorCodes)
			}
		}
		return CaptchaInvalid, nil
	}

	// 顺序校验：验证码必须在凭证签发之后解出
	challengeTS, err := time.Parse(time.RFC3339, result.ChallengeTS)
	if err != nil {
		return CaptchaInvalid, nil
	}
	if challengeTS.Add(captchaClockSkew).Before(issuedAt) {
		return CaptchaSolvedTooEarly, nil
	}
	return "", nil
}

// ReceiveTokenMiddleware 校验并消费领取凭证，然后在服务端完成人机验证；需在 ReceiveProjectMiddleware 之后
func ReceiveTokenMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		project, ok := GetProjectFromContext(c)
		if !ok || project == nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, ProjectResponse{ErrorMsg: UnknownError})
			return
		}

		// 读取 body 并回填，保证后续 handler 仍可读取
		var body receiveRequestBody
		if c.Request.Body != nil {
			raw, err := io.ReadAll(io.LimitReader(c.Request.Body, receiveBodyMaxBytes))
			_ = c.Request.Body.Close()
			if err != nil {
				c.AbortWithStatusJSON(http.StatusBadRequest, ProjectResponse{ErrorMsg: ReceiveTokenInvalid})
				return
			}
			c.Request.Body = io.NopCloser(bytes.NewReader(raw))
			if len(raw) > 0 {
				_ = json.Unmarshal(raw, &body)
			}
		}
		body.CaptchaToken = strings.TrimSpace(body.CaptchaToken)
		body.ReceiveToken = strings.TrimSpace(body.ReceiveToken)

		if body.CaptchaToken == "" || len(body.CaptchaToken) > captchaTokenMaxLength {
			c.AbortWithStatusJSON(http.StatusBadRequest, ProjectResponse{ErrorMsg: CaptchaRequired})
			return
		}

		// 1. 消费凭证（一次性）
		issuedAt, valid, err := consumeReceiveToken(ctx, project.ID, oauth.GetUserIDFromContext(c), body.ReceiveToken)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, ProjectResponse{ErrorMsg: err.Error()})
			return
		}
		if !valid {
			c.AbortWithStatusJSON(http.StatusBadRequest, ProjectResponse{ErrorMsg: ReceiveTokenInvalid})
			return
		}

		// 2. 服务端人机验证 + 顺序校验
		userErr, err := verifyCaptcha(ctx, body.CaptchaToken, c.ClientIP(), issuedAt)
		if err != nil {
			logger.ErrorF(ctx, "[Captcha] verify failed: %v", err)
			c.AbortWithStatusJSON(http.StatusServiceUnavailable, ProjectResponse{ErrorMsg: CaptchaUnavailable})
			return
		}
		if userErr != "" {
			c.AbortWithStatusJSON(http.StatusBadRequest, ProjectResponse{ErrorMsg: userErr})
			return
		}

		c.Next()
	}
}
