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
	"time"

	"github.com/hibiken/asynq"
	"github.com/linux-do/cdk/internal/apps/project"
	"github.com/linux-do/cdk/internal/db"
	"go.uber.org/zap"
)

// HandleExpireStaleOrders 清理长时间未付款的 PENDING 订单。
// 查询条件:status=PENDING 且 expire_at 超时超过 5 分钟。
// 额外 5 分钟宽限期确保 epay 的异步 notify 回调在此之前已到达，
// 避免"cleanup 先置 FAILED + RPush，notify 随后到达发现已无 PENDING 订单"的竞态。
func HandleExpireStaleOrders(_ context.Context, _ *asynq.Task) error {
	ctx := context.Background()

	// expire_at 已超过 5 分钟才认为真正超时
	deadline := time.Now().Add(-5 * time.Minute)

	var orders []PaymentOrder
	if err := db.DB(ctx).
		Where("status = ? AND expire_at < ?", OrderStatusPending, deadline).
		Limit(200).
		Find(&orders).Error; err != nil {
		zap.L().Error("payment cleanup: query failed", zap.Error(err))
		return err
	}

	for _, order := range orders {
		expireOrder(ctx, &order)
	}
	return nil
}

// expireOrder 通过 CAS 将单笔 PENDING 订单置为 FAILED，并把预占的 item 归还 Redis。
// 使用 CAS (WHERE status=PENDING) 保证幂等：
//   - 若 notify 回调恰好在此同时到达并推进了状态，CAS 得 0 行，安全跳过。
func expireOrder(ctx context.Context, order *PaymentOrder) {
	rows := db.DB(ctx).Model(&PaymentOrder{}).
		Where("out_trade_no = ? AND status = ?", order.OutTradeNo, OrderStatusPending).
		Update("status", OrderStatusFailed).
		RowsAffected
	if rows == 0 {
		// 另一协程（notify 回调）已处理，跳过
		return
	}

	// 归还预占的 item，恢复项目库存
	db.Redis.RPush(ctx, project.ProjectItemsKey(order.ProjectID), order.ItemID)

	zap.L().Info("payment cleanup: order expired",
		zap.String("out_trade_no", order.OutTradeNo),
		zap.Uint64("item_id", order.ItemID),
	)
}
