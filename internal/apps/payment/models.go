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
	"time"

	"github.com/shopspring/decimal"
)

// OrderStatus 订单状态机
//
//	PENDING(0)   -> PAID(1) -> COMPLETED(2)           // 正常路径
//	                        -> REFUNDING(3) -> REFUNDED(4)  // 发放失败
//	PENDING      -> FAILED(5)                         // 未付款超时 / 创建失败
type OrderStatus int8

const (
	OrderStatusPending   OrderStatus = 0
	OrderStatusPaid      OrderStatus = 1
	OrderStatusCompleted OrderStatus = 2
	OrderStatusRefunding OrderStatus = 3
	OrderStatusRefunded  OrderStatus = 4
	OrderStatusFailed    OrderStatus = 5
)

// UserPaymentConfig 用户的商户凭据(一对一绑定 User)
type UserPaymentConfig struct {
	UserID          uint64    `gorm:"primaryKey" json:"user_id"`
	ClientID        string    `gorm:"size:64;not null" json:"client_id"`
	ClientSecretEnc string    `gorm:"size:512;not null" json:"-"`
	SecretLast4     string    `gorm:"size:8" json:"secret_last4"`
	CreatedAt       time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt       time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

// PaymentOrder 支付订单(一次付费领取 = 一个订单)
//
// 联合索引：
//   - idx_project_payer_status (project_id, payer_id, status)：查询某用户在某项目的待支付订单
//   - idx_payer_status         (payer_id, status)：按用户快速查询待支付订单
//   - idx_status_expire        (status, expire_at)：清理任务扫描超时 PENDING 订单
type PaymentOrder struct {
	ID            uint64          `gorm:"primaryKey;autoIncrement" json:"id"`
	OutTradeNo    string          `gorm:"size:64;uniqueIndex;not null" json:"out_trade_no"`
	TradeNo       string          `gorm:"size:64;index" json:"trade_no"`
	ProjectID     string          `gorm:"size:64;not null;index:idx_project_payer_status,priority:1" json:"project_id"`
	ItemID        uint64          `gorm:"index;not null" json:"item_id"`
	PayerID       uint64          `gorm:"not null;index:idx_project_payer_status,priority:2;index:idx_payer_status,priority:1" json:"payer_id"`
	PayeeID       uint64          `gorm:"index;not null" json:"payee_id"`
	PayeeClientID string          `gorm:"size:64" json:"payee_client_id"`
	Amount        decimal.Decimal `gorm:"type:decimal(10,2);not null" json:"amount"`
	Status        OrderStatus     `gorm:"default:0;index:idx_project_payer_status,priority:3;index:idx_payer_status,priority:2;index:idx_status_expire,priority:1" json:"status"`
	PaidAt        *time.Time      `json:"paid_at"`
	RefundedAt    *time.Time      `json:"refunded_at"`
	FailReason    string          `gorm:"size:255" json:"fail_reason"`
	ExpireAt      time.Time       `gorm:"index:idx_status_expire,priority:2" json:"expire_at"`
	ClientIP      string          `gorm:"size:64" json:"client_ip"`
	CreatedAt     time.Time       `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt     time.Time       `gorm:"autoUpdateTime" json:"updated_at"`
}

// TableName 自定义表名
func (PaymentOrder) TableName() string { return "payment_orders" }

// TableName 自定义表名
func (UserPaymentConfig) TableName() string { return "user_payment_configs" }
