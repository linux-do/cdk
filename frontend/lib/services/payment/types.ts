import {BackendResponse} from '../project/types';

/**
 * 用户的支付配置视图(后端不返回明文 secret)
 */
export interface PaymentConfigData {
  /** 是否已配置 */
  has_config: boolean;
  /** 商户 pid */
  client_id: string;
  /** clientSecret 末 4 位,展示用 */
  secret_last4: string;
  /** 上次校验成功时间 */
  last_verified_at?: string;
  /** 应该填写在 LDC 商户后台的异步通知地址 */
  callback_notify_url: string;
  /** 应该填写在 LDC 商户后台的同步回跳地址 */
  callback_return_url: string;
  /** 平台是否启用付费功能 */
  payment_enabled: boolean;
}

export type GetPaymentConfigResponse = BackendResponse<PaymentConfigData>;

/**
 * 写入/更新支付配置请求
 */
export interface UpsertPaymentConfigRequest {
  client_id: string;
  client_secret: string;
}

export type UpsertPaymentConfigResponse = BackendResponse<null>;
