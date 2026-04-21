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

const (
	ErrPaymentDisabled          = "支付功能未启用"
	ErrInvalidAmount            = "金额必须大于 0 且最多 2 位小数"
	ErrPriceRequiresOneForEach  = "仅一码一用分发支持设置金额"
	ErrCreatorNotConfigured     = "项目创建者尚未配置支付凭据,无法发起支付"
	ErrPaymentConfigNotFound    = "尚未配置支付凭据"
	ErrEncryptionKeyMissing     = "服务端未配置支付密钥加密密钥"
	ErrInvalidClientCredentials = "clientID 与 clientSecret 不能为空"
	ErrOrderNotFound            = "订单不存在"
	ErrOrderExpired             = "订单已过期"
	ErrCannotDeleteHasActive    = "存在未结束的付费项目,无法删除支付配置"
	ErrInvalidPriceDecimals     = "金额最多保留 2 位小数"
	ErrPriceTooLarge            = "金额超出允许范围"
)
