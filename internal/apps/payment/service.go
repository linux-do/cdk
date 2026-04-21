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
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/linux-do/cdk/internal/apps/oauth"
	"github.com/linux-do/cdk/internal/apps/project"
	"github.com/linux-do/cdk/internal/config"
	"github.com/linux-do/cdk/internal/db"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

// GetUserPaymentConfig 读取指定用户的支付配置,不存在返回 (nil, nil)。
func GetUserPaymentConfig(ctx context.Context, userID uint64) (*UserPaymentConfig, error) {
	var cfg UserPaymentConfig
	err := db.DB(ctx).Where("user_id = ?", userID).First(&cfg).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &cfg, nil
}

// SaveUserPaymentConfig 保存/更新用户的支付凭据,clientSecret 明文进入后会被加密。
func SaveUserPaymentConfig(ctx context.Context, userID uint64, clientID, clientSecret string) error {
	if clientID == "" || clientSecret == "" {
		return errors.New(ErrInvalidClientCredentials)
	}
	if err := validateEncryptionKeyConfigured(); err != nil {
		return err
	}
	enc, err := EncryptSecret(clientSecret, config.Config.Payment.ConfigEncryptionKey)
	if err != nil {
		return err
	}
	last4 := clientSecret
	if len(last4) > 4 {
		last4 = last4[len(last4)-4:]
	}
	cfg := &UserPaymentConfig{}
	queryErr := db.DB(ctx).Where("user_id = ?", userID).First(cfg).Error
	if errors.Is(queryErr, gorm.ErrRecordNotFound) {
		cfg.UserID = userID
		cfg.ClientID = clientID
		cfg.ClientSecretEnc = enc
		cfg.SecretLast4 = last4
		return db.DB(ctx).Create(cfg).Error
	} else if queryErr != nil {
		return queryErr
	}
	cfg.ClientID = clientID
	cfg.ClientSecretEnc = enc
	cfg.SecretLast4 = last4
	return db.DB(ctx).Save(&cfg).Error
}

// DeleteUserPaymentConfig 删除用户支付配置。
// 若该用户存在 Price>0 且未结束的自有项目则拒绝删除,避免后续领取者无法付款。
func DeleteUserPaymentConfig(ctx context.Context, userID uint64) error {
	var cnt int64
	err := db.DB(ctx).
		Model(&project.Project{}).
		Where("creator_id = ? AND price > 0 AND end_time > ? AND is_completed = 0 AND status = ?",
			userID, time.Now(), project.ProjectStatusNormal).
		Count(&cnt).Error
	if err != nil {
		return err
	}
	if cnt > 0 {
		return errors.New(ErrCannotDeleteHasActive)
	}
	return db.DB(ctx).Where("user_id = ?", userID).Delete(&UserPaymentConfig{}).Error
}

// decryptUserClientSecret 解密指定配置的 clientSecret。
func decryptUserClientSecret(cfg *UserPaymentConfig) (string, error) {
	if err := validateEncryptionKeyConfigured(); err != nil {
		return "", err
	}
	return DecryptSecret(cfg.ClientSecretEnc, config.Config.Payment.ConfigEncryptionKey)
}

// genOutTradeNo 生成本地订单号:CDK + yyyyMMddHHmmss + 8 位随机十六进制。
func genOutTradeNo() string {
	var b [4]byte
	_, _ = rand.Read(b[:])
	return fmt.Sprintf("CDK%s%s", time.Now().Format("20060102150405"), hex.EncodeToString(b[:]))
}

// moneyString 将 decimal 金额格式化为"两位小数"字符串,与 epay 的金额要求保持一致。
func moneyString(d decimal.Decimal) string {
	return d.StringFixed(2)
}

// PaymentInitiation 返回给前端的发起支付信息
type PaymentInitiation struct {
	OutTradeNo string    `json:"out_trade_no"`
	PayURL     string    `json:"pay_url"`
	Amount     string    `json:"amount"`
	ExpireAt   time.Time `json:"expire_at"`
}

// InitiatePayment 为付费项目的一次领取行为创建支付订单,并返回前端可直接跳转的支付 URL。
// 调用方已通过 ReceiveProjectMiddleware 的前置校验。
// 流程:载入商户凭据 → Redis LPop 预占 item → 持久化订单 PENDING → 构造 submit URL 返回。
// 若创建订单失败或拼接失败,需立即把 itemID RPush 回 Redis 以恢复库存。
func InitiatePayment(ctx context.Context, p *project.Project, payer *oauth.User, clientIP string) (*PaymentInitiation, error) {
	if !config.Config.Payment.Enabled {
		return nil, errors.New(ErrPaymentDisabled)
	}
	if !p.IsPaid() {
		return nil, errors.New(ErrInvalidAmount)
	}

	cfg, err := GetUserPaymentConfig(ctx, p.CreatorID)
	if err != nil {
		return nil, err
	}
	if cfg == nil {
		return nil, errors.New(ErrCreatorNotConfigured)
	}
	secret, err := decryptUserClientSecret(cfg)
	if err != nil {
		return nil, err
	}

	// 预占 item(Redis LPOP 原子)
	itemID, err := p.PrepareReceive(ctx, payer.Username)
	if err != nil {
		return nil, err
	}

	// 订单过期时间
	expireMin := config.Config.Payment.OrderExpireMinutes
	if expireMin <= 0 {
		expireMin = 10
	}
	expireAt := time.Now().Add(time.Duration(expireMin) * time.Minute)

	outTradeNo := genOutTradeNo()
	order := PaymentOrder{
		OutTradeNo:    outTradeNo,
		ProjectID:     p.ID,
		ItemID:        itemID,
		PayerID:       payer.ID,
		PayeeID:       p.CreatorID,
		PayeeClientID: cfg.ClientID,
		Amount:        p.Price,
		Status:        OrderStatusPending,
		ExpireAt:      expireAt,
		ClientIP:      clientIP,
	}
	if err := db.DB(ctx).Create(&order).Error; err != nil {
		// 回滚预占
		db.Redis.RPush(ctx, p.ItemsKey(), itemID)
		return nil, err
	}

	// 构造支付跳转 URL(名称最长 64)
	name := truncateRuneLen("CDK-"+p.Name, 60)
	payURL := submitURL(cfg.ClientID, secret, name, moneyString(p.Price), outTradeNo, callbackNotifyURL(), callbackReturnURL())

	return &PaymentInitiation{
		OutTradeNo: outTradeNo,
		PayURL:     payURL,
		Amount:     moneyString(p.Price),
		ExpireAt:   expireAt,
	}, nil
}

// truncateRuneLen 按 rune 长度截断字符串,避免多字节字符被拦腰截断
func truncateRuneLen(s string, max int) string {
	rs := []rune(s)
	if len(rs) <= max {
		return s
	}
	return string(rs[:max])
}

// HandleNotifyParams 易支付回调需要的全部字段
type HandleNotifyParams struct {
	Query map[string]string
}

// HandleNotify 处理异步支付回调。
// 返回 (success bool, reason string):success=true 表示应返回文本 "success";
// 否则返回 "fail",epay 最多重试 5 次,每次间隔由对方决定。
// 实现关键点:
//  1. 拉起订单 → 验签(使用订单记录的 PayeeID 对应凭据) → 校验 trade_status/pid/money
//  2. 幂等:若订单已是 COMPLETED/REFUNDED 直接 success
//  3. CAS 推进 PENDING → PAID,成功者执行 fulfill 事务
//  4. fulfill 失败 → 调 refund,成功后 RPush item 回 Redis,置 REFUNDED;本次返回 fail 让对方重试,
//     再次进入时因状态非 PENDING 直接 success
func HandleNotify(ctx context.Context, q map[string]string) (bool, string) {
	outTradeNo := q["out_trade_no"]
	if outTradeNo == "" {
		return false, "missing out_trade_no"
	}
	var order PaymentOrder
	if err := db.DB(ctx).Where("out_trade_no = ?", outTradeNo).First(&order).Error; err != nil {
		return false, fmt.Sprintf("order not found: %v", err)
	}
	cfg, err := GetUserPaymentConfig(ctx, order.PayeeID)
	if err != nil || cfg == nil {
		return false, "payee config missing"
	}
	secret, err := decryptUserClientSecret(cfg)
	if err != nil {
		return false, "decrypt secret failed"
	}
	if !VerifySign(q, secret) {
		return false, "sign mismatch"
	}
	if q["trade_status"] != "TRADE_SUCCESS" {
		return false, "trade_status not success"
	}
	if q["pid"] != cfg.ClientID {
		return false, "pid mismatch"
	}
	if q["money"] != moneyString(order.Amount) {
		return false, "money mismatch"
	}

	// 幂等分支
	if order.Status == OrderStatusCompleted || order.Status == OrderStatusRefunded {
		return true, "idempotent"
	}

	// 增加对 Refunding 状态的处理
	if order.Status == OrderStatusRefunding {
		refundErr := doEpayRefund(ctx, cfg.ClientID, secret, order.TradeNo, moneyString(order.Amount))
		if refundErr == nil {
			tNow := time.Now()
			if updateErr := db.DB(ctx).
				Model(&PaymentOrder{}).
				Where("out_trade_no = ?", outTradeNo).
				Updates(map[string]any{"status": OrderStatusRefunded, "refunded_at": &tNow}).
				Error; updateErr != nil {
				return false, "update order status failed"
			}
			db.Redis.RPush(ctx, project.ProjectItemsKey(order.ProjectID), order.ItemID)
			return true, "refund retry ok"
		}
		return false, "refund retry failed"
	}

	// CAS: PENDING -> PAID
	now := time.Now()
	rows := db.DB(ctx).Model(&PaymentOrder{}).
		Where("out_trade_no = ? AND status = ?", outTradeNo, OrderStatusPending).
		Updates(map[string]any{
			"status":   OrderStatusPaid,
			"trade_no": q["trade_no"],
			"paid_at":  &now,
		}).RowsAffected
	if rows == 0 {
		// 并发下另一个回调在处理,或订单已过期被扫描任务置 FAILED(itemID 已回滚),此时不再处理
		// 仍返回 success 让对方停止重试,结果以订单最终状态为准
		return true, "concurrent or non-pending"
	}

	// 重新读一次订单
	if err := db.DB(ctx).Where("out_trade_no = ?", outTradeNo).First(&order).Error; err != nil {
		return false, err.Error()
	}

	// 发放
	if err := fulfillPaidOrder(ctx, &order); err != nil {
		// 退款 + RPush
		refundErr := doEpayRefund(ctx, cfg.ClientID, secret, order.TradeNo, moneyString(order.Amount))
		updates := map[string]any{
			"fail_reason": truncateRuneLen(err.Error(), 200),
		}
		if refundErr == nil {
			tNow := time.Now()
			updates["status"] = OrderStatusRefunded
			updates["refunded_at"] = &tNow
			// 把 item 推回 Redis 队列恢复库存
			db.Redis.RPush(ctx, project.ProjectItemsKey(order.ProjectID), order.ItemID)
		} else {
			updates["status"] = OrderStatusRefunding
		}
		db.DB(ctx).Model(&PaymentOrder{}).
			Where("out_trade_no = ?", outTradeNo).Updates(updates)
		// 让 epay 重试,再次进入时因状态非 PENDING 会回到 idempotent 分支
		return false, fmt.Sprintf("fulfill failed: %v", err)
	}

	// 成功
	db.DB(ctx).Model(&PaymentOrder{}).
		Where("out_trade_no = ?", outTradeNo).Update("status", OrderStatusCompleted)
	return true, "ok"
}

// fulfillPaidOrder 在已确认付款的前提下执行发放事务,复用 project.FulfillForReceiver。
func fulfillPaidOrder(ctx context.Context, order *PaymentOrder) error {
	return db.DB(ctx).Transaction(func(tx *gorm.DB) error {
		var p project.Project
		if err := p.Exact(tx, order.ProjectID, true); err != nil {
			return err
		}
		var item project.ProjectItem
		if err := item.Exact(tx, order.ItemID); err != nil {
			return err
		}
		return p.FulfillForReceiver(ctx, tx, &item, order.PayerID, order.ClientIP)
	})
}

// CallbackURLs 返回当前平台配置的回调地址,用于前端展示给用户。
func CallbackURLs() (notifyURL, returnURL string) {
	return callbackNotifyURL(), callbackReturnURL()
}

// ErrOrderNotFoundSentinel 外部判断
var ErrOrderNotFoundSentinel = errors.New(ErrOrderNotFound)
