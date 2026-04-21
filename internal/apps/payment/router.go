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

package payment

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/cdk/internal/apps/oauth"
	"github.com/linux-do/cdk/internal/apps/project"
	"github.com/linux-do/cdk/internal/config"
	"github.com/linux-do/cdk/internal/db"
	"gorm.io/gorm"
)

// Response 统一的 payment 响应壳,保持与其他 app 一致
type Response struct {
	ErrorMsg string      `json:"error_msg"`
	Data     interface{} `json:"data"`
}

// GetPaymentConfigResponseData 当前用户支付配置的安全视图
type GetPaymentConfigResponseData struct {
	HasConfig         bool   `json:"has_config"`
	ClientID          string `json:"client_id"`
	SecretLast4       string `json:"secret_last4"`
	CallbackNotifyURL string `json:"callback_notify_url"`
	CallbackReturnURL string `json:"callback_return_url"`
	PaymentEnabled    bool   `json:"payment_enabled"`
}

// GetPaymentConfig GET /api/v1/users/payment-config
// @Summary 获取当前用户的支付配置(不返回明文 secret)
func GetPaymentConfig(c *gin.Context) {
	userID := oauth.GetUserIDFromContext(c)
	cfg, err := GetUserPaymentConfig(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{ErrorMsg: err.Error()})
		return
	}
	notifyURL, returnURL := CallbackURLs()
	resp := GetPaymentConfigResponseData{
		CallbackNotifyURL: notifyURL,
		CallbackReturnURL: returnURL,
		PaymentEnabled:    config.Config.Payment.Enabled,
	}
	if cfg != nil {
		resp.HasConfig = true
		resp.ClientID = cfg.ClientID
		resp.SecretLast4 = cfg.SecretLast4
	}
	c.JSON(http.StatusOK, Response{Data: resp})
}

// UpsertPaymentConfigRequest PUT 请求体
type UpsertPaymentConfigRequest struct {
	ClientID     string `json:"client_id" binding:"required,min=1,max=64"`
	ClientSecret string `json:"client_secret" binding:"required,min=1,max=256"`
}

// UpsertPaymentConfig PUT /api/v1/users/payment-config
func UpsertPaymentConfig(c *gin.Context) {
	if !config.Config.Payment.Enabled {
		c.JSON(http.StatusForbidden, Response{ErrorMsg: ErrPaymentDisabled})
		return
	}
	var req UpsertPaymentConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{ErrorMsg: err.Error()})
		return
	}
	userID := oauth.GetUserIDFromContext(c)
	if err := SaveUserPaymentConfig(c.Request.Context(), userID, req.ClientID, req.ClientSecret); err != nil {
		c.JSON(http.StatusInternalServerError, Response{ErrorMsg: err.Error()})
		return
	}
	c.JSON(http.StatusOK, Response{})
}

// DeletePaymentConfig DELETE /api/v1/users/payment-config
func DeletePaymentConfig(c *gin.Context) {
	userID := oauth.GetUserIDFromContext(c)
	if err := DeleteUserPaymentConfig(c.Request.Context(), userID); err != nil {
		c.JSON(http.StatusBadRequest, Response{ErrorMsg: err.Error()})
		return
	}
	c.JSON(http.StatusOK, Response{})
}

// ReceiveResponse 领取接口的统一响应:免费返回 itemContent;付费返回支付跳转信息。
type ReceiveResponse struct {
	ItemContent    string `json:"itemContent,omitempty"`
	RequirePayment bool   `json:"require_payment,omitempty"`
	PayURL         string `json:"pay_url,omitempty"`
	OutTradeNo     string `json:"out_trade_no,omitempty"`
	Amount         string `json:"amount,omitempty"`
	ExpireAt       string `json:"expire_at,omitempty"`
}

// DispatchReceive POST /api/v1/projects/:id/receive
// 运行在 project.ReceiveProjectMiddleware() 之后,已通过资格校验并在 context 注入 project。
// 付费项目:返回 {require_payment:true, pay_url, ...};前端直接跳转 pay_url。
// 免费项目:执行原领取事务,返回 {itemContent}。
func DispatchReceive(c *gin.Context) {
	ctx := c.Request.Context()
	currentUser, _ := oauth.GetUserFromContext(c)
	p, ok := project.GetProjectFromContext(c)
	if !ok || p == nil {
		// 兜底:若 middleware 未注入(例如后续重构),按主键再查一次
		p = &project.Project{}
		if err := p.Exact(db.DB(ctx), c.Param("id"), true); err != nil {
			c.JSON(http.StatusNotFound, project.ProjectResponse{ErrorMsg: err.Error()})
			return
		}
	}

	// 付费分叉
	if p.IsPaid() {
		init, err := InitiatePayment(ctx, p, currentUser, c.ClientIP())
		if err != nil {
			if err.Error() == ErrPendingOrderExists {
				c.JSON(http.StatusBadRequest, Response{ErrorMsg: err.Error()})
				return
			}
			c.JSON(http.StatusInternalServerError, Response{ErrorMsg: err.Error()})
			return
		}
		c.JSON(http.StatusOK, project.ProjectResponse{Data: ReceiveResponse{
			RequirePayment: true,
			PayURL:         init.PayURL,
			OutTradeNo:     init.OutTradeNo,
			Amount:         init.Amount,
			ExpireAt:       init.ExpireAt.Format("2006-01-02 15:04:05"),
		}})
		return
	}

	// 免费分支:复用 project 的预占 + 发放事务
	itemID, err := p.PrepareReceive(ctx, currentUser.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, project.ProjectResponse{ErrorMsg: err.Error()})
		return
	}
	var item project.ProjectItem
	if err := item.Exact(db.DB(ctx), itemID); err != nil {
		// 预占成功但 item 记录找不到,回滚
		db.Redis.RPush(ctx, p.ItemsKey(), itemID)
		c.JSON(http.StatusNotFound, project.ProjectResponse{ErrorMsg: err.Error()})
		return
	}
	if err := db.DB(ctx).Transaction(func(tx *gorm.DB) error {
		return p.FulfillForReceiver(ctx, tx, &item, currentUser.ID, c.ClientIP())
	}); err != nil {
		if p.DistributionType == project.DistributionTypeOneForEach {
			db.Redis.RPush(ctx, p.ItemsKey(), itemID)
		}
		c.JSON(http.StatusInternalServerError, project.ProjectResponse{ErrorMsg: err.Error()})
		return
	}
	c.JSON(http.StatusOK, project.ProjectResponse{Data: ReceiveResponse{ItemContent: item.Content}})
}

// HandleNotifyHTTP GET /api/v1/payment/notify
// 易支付兼容回调,返回纯文本 "success" / "fail"。
func HandleNotifyHTTP(c *gin.Context) {
	ok, _ := HandleNotify(c.Request.Context(), extractQueryMap(c.Request.URL.Query()))
	if ok {
		c.String(http.StatusOK, "success")
	} else {
		c.String(http.StatusOK, "fail")
	}
}

// 保留 GORM ErrRecordNotFound 的判断以防将来需要细分
var _ = errors.Is
