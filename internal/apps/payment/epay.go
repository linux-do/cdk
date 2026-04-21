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
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/url"
	"strings"

	"github.com/linux-do/cdk/internal/config"
	"github.com/linux-do/cdk/internal/utils"
)

// submitURL 构造 /epay/pay/submit.php 的完整 GET 跳转 URL,由浏览器直接访问。
// 不在后端跟随 302,以确保 credit.linux.do/paying 的付款会话对用户浏览器可见。
func submitURL(clientID, secret, name, money, outTradeNo, notifyURL, returnURL string) string {
	params := map[string]string{
		"pid":          clientID,
		"type":         "epay",
		"name":         name,
		"money":        money,
		"out_trade_no": outTradeNo,
		"notify_url":   notifyURL,
		"return_url":   returnURL,
		"sign_type":    "MD5",
	}
	params["sign"] = BuildSign(params, secret)
	values := url.Values{}
	for k, v := range params {
		values.Set(k, v)
	}
	return strings.TrimRight(config.Config.Payment.ApiUrl, "/") + "/pay/submit.php?" + values.Encode()
}

// callbackNotifyURL 返回异步通知地址,用于下单参数与前端展示。
func callbackNotifyURL() string {
	return strings.TrimRight(config.Config.Payment.NotifyBaseURL, "/") + "/api/v1/payment/notify"
}

// callbackReturnURL 返回同步回跳地址。
func callbackReturnURL() string {
	return strings.TrimRight(config.Config.Payment.NotifyBaseURL, "/") + "/api/v1/payment/return"
}

// refundResponse 易支付退款接口响应
type refundResponse struct {
	Code int    `json:"code"`
	Msg  string `json:"msg"`
}

// doEpayRefund 调用易支付兼容 /api.php 完成全额退款。
// 参考文档:pid+key+trade_no+money 作为 form 参数,返回 {"code":1,"msg":"退款成功"}。
// 不需要 sign,凭 key 直接鉴权。
func doEpayRefund(ctx context.Context, clientID, clientSecret, tradeNo, money string) error {
	form := url.Values{}
	form.Set("act", "refund")
	form.Set("pid", clientID)
	form.Set("key", clientSecret)
	form.Set("trade_no", tradeNo)
	form.Set("money", money)

	endpoint := strings.TrimRight(config.Config.Payment.ApiUrl, "/") + "/api.php"

	resp, err := utils.Request(
		ctx,
		"POST",
		endpoint,
		strings.NewReader(form.Encode()),
		map[string]string{"Content-Type": "application/x-www-form-urlencoded"},
		nil,
	)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	var rr refundResponse
	if err := json.Unmarshal(body, &rr); err != nil {
		return fmt.Errorf("parse refund response: %w (raw=%s)", err, string(body))
	}
	if rr.Code != 1 {
		return fmt.Errorf("refund rejected: %s", rr.Msg)
	}
	return nil
}

// extractQueryMap 把 gin 的 query 拉平成 map[string]string,便于签名校验
func extractQueryMap(values url.Values) map[string]string {
	m := make(map[string]string, len(values))
	for k, v := range values {
		if len(v) > 0 {
			m[k] = v[0]
		}
	}
	return m
}

// validateEncryptionKeyConfigured 检查加密密钥是否配置
func validateEncryptionKeyConfigured() error {
	if config.Config.Payment.ConfigEncryptionKey == "" {
		return errors.New(ErrEncryptionKeyMissing)
	}
	return nil
}
