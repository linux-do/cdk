import apiClient from '../core/api-client';
import {
  GetPaymentConfigResponse,
  PaymentConfigData,
  UpsertPaymentConfigRequest,
  UpsertPaymentConfigResponse,
} from './types';

/**
 * 支付相关 API 服务
 */
export class PaymentService {
  private static readonly base = '/api/v1/users/payment-config';

  static async getConfig(): Promise<PaymentConfigData> {
    const response = await apiClient.get<GetPaymentConfigResponse>(this.base);
    if (response.data.error_msg) {
      throw new Error(response.data.error_msg);
    }
    return response.data.data;
  }

  static async getConfigSafe(): Promise<{success: boolean; data?: PaymentConfigData; error?: string}> {
    try {
      const data = await this.getConfig();
      return {success: true, data};
    } catch (err) {
      return {success: false, error: err instanceof Error ? err.message : '获取支付配置失败'};
    }
  }

  static async updateConfig(payload: UpsertPaymentConfigRequest): Promise<void> {
    const response = await apiClient.put<UpsertPaymentConfigResponse>(this.base, payload);
    if (response.data.error_msg) {
      throw new Error(response.data.error_msg);
    }
  }

  static async updateConfigSafe(payload: UpsertPaymentConfigRequest): Promise<{success: boolean; error?: string}> {
    try {
      await this.updateConfig(payload);
      return {success: true};
    } catch (err) {
      return {success: false, error: err instanceof Error ? err.message : '保存支付配置失败'};
    }
  }

  static async deleteConfig(): Promise<void> {
    const response = await apiClient.delete<UpsertPaymentConfigResponse>(this.base);
    if (response.data.error_msg) {
      throw new Error(response.data.error_msg);
    }
  }

  static async deleteConfigSafe(): Promise<{success: boolean; error?: string}> {
    try {
      await this.deleteConfig();
      return {success: true};
    } catch (err) {
      return {success: false, error: err instanceof Error ? err.message : '删除支付配置失败'};
    }
  }
}
