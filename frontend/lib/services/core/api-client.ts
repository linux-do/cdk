import axios, {AxiosError, AxiosResponse} from 'axios';
import {showRiskWarningToast} from '@/components/common/risk/risk-warning-toast';
import {ApiError, ApiResponse} from './types';

/**
 * API客户端实例
 * 统一处理请求配置、响应解析和错误处理
 */
const apiClient = axios.create({
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const RISK_LEVEL_HEADER = 'x-credit-risk-level';
const RISK_LABELS_HEADER = 'x-credit-risk-labels';
const RISK_ITEMS_HEADER = 'x-credit-risks';
const RISK_BLOCKED_CODE = 'RISK_BLOCKED';
const RISK_BLOCKED_EVENT = 'credit-risk-blocked';

interface RiskItem {
  label: string;
  value?: string;
  desc?: string;
}

interface RiskInfo {
  risk_level: string;
  risk_labels: string[];
  risks: RiskItem[];
}

class ApiClientError extends Error {
  code?: string;
  details?: unknown;
  status?: number;

  constructor(
      message: string,
      code?: string,
      details?: unknown,
      status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

function getHeader(
    headers: AxiosResponse['headers'],
    name: string,
): string | undefined {
  const maybeAxiosHeaders = headers as { get?: (key: string) => unknown };
  const value = maybeAxiosHeaders.get?.(name);
  if (typeof value === 'string') return value;

  const plainHeaders = headers as Record<string, unknown>;
  const lowerValue = plainHeaders[name.toLowerCase()];
  if (typeof lowerValue === 'string') return lowerValue;

  const directValue = plainHeaders[name];
  return typeof directValue === 'string' ? directValue : undefined;
}

function decodeBase64JSON(value?: string): unknown {
  if (!value || typeof window === 'undefined') return [];

  try {
    const binary = window.atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  } catch {
    return [];
  }
}

function normalizeRiskItems(value: unknown): RiskItem[] {
  if (!Array.isArray(value)) return [];

  return value.reduce<RiskItem[]>((items, item) => {
    if (!item || typeof item !== 'object') return items;

    const label =
      'label' in item ? (item as { label?: unknown }).label : undefined;
    if (typeof label !== 'string' || !label.trim()) return items;

    const value =
      'value' in item ? (item as { value?: unknown }).value : undefined;
    const desc =
      'desc' in item ? (item as { desc?: unknown }).desc : undefined;
    items.push({
      label: label.trim(),
      value: typeof value === 'string' ? value.trim() : undefined,
      desc: typeof desc === 'string' ? desc.trim() : undefined,
    });

    return items;
  }, []);
}

function normalizeRiskLabels(value: unknown): string[] {
  return Array.isArray(value) ?
    value
        .filter(
            (label): label is string =>
              typeof label === 'string' && !!label.trim(),
        )
        .map((label) => label.trim()) :
    [];
}

function riskLabelsFromItems(items: RiskItem[]): string[] {
  return items.map((item) => item.label).filter(Boolean);
}

function riskInfoFromHeaders(
    headers: AxiosResponse['headers'],
): RiskInfo | null {
  const riskLevel = getHeader(headers, RISK_LEVEL_HEADER);
  if (!riskLevel) return null;

  const risks = normalizeRiskItems(
      decodeBase64JSON(getHeader(headers, RISK_ITEMS_HEADER)),
  );
  const labels = normalizeRiskLabels(
      decodeBase64JSON(getHeader(headers, RISK_LABELS_HEADER)),
  );

  return {
    risk_level: riskLevel,
    risk_labels: labels.length ? labels : riskLabelsFromItems(risks),
    risks,
  };
}

function riskInfoFromDetails(details: unknown): RiskInfo | null {
  if (!details || typeof details !== 'object') return null;

  const riskLevel =
    'risk_level' in details ?
      (details as { risk_level?: unknown }).risk_level :
      undefined;
  const riskLabels =
    'risk_labels' in details ?
      (details as { risk_labels?: unknown }).risk_labels :
      undefined;
  const riskItems =
    'risks' in details ? (details as { risks?: unknown }).risks : undefined;
  if (typeof riskLevel !== 'string' || !riskLevel) return null;

  const risks = normalizeRiskItems(riskItems);
  const labels = normalizeRiskLabels(riskLabels);

  return {
    risk_level: riskLevel,
    risk_labels: labels.length ? labels : riskLabelsFromItems(risks),
    risks,
  };
}

function showRiskBlockedDialog(riskInfo: RiskInfo): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
      new CustomEvent<RiskInfo>(RISK_BLOCKED_EVENT, {detail: riskInfo}),
  );
}

/**
 * 请求拦截器
 * 确保所有请求带上凭证
 */
apiClient.interceptors.request.use(
    (config) => {
      config.withCredentials = true;
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      return config;
    },
    (error) => Promise.reject(error),
);

/**
 * 直接启动OAuth登录流程
 * @param currentPath - 当前路径，用于登录成功后重定向回来
 */
function initiateLogin(currentPath: string): Promise<never> {
  // 防止循环重定向
  if (
    !currentPath.startsWith('/login') &&
    !currentPath.startsWith('/callback')
  ) {
    // 动态导入AuthService避免循环依赖
    import('../auth/auth.service').then(({AuthService}) => {
      // 直接调用登录方法，传入当前路径作为重定向目标
      AuthService.login(currentPath);
    });
  }

  // 返回永不解决的Promise
  return new Promise<never>(() => {});
}

/**
 * 响应拦截器
 * 处理API响应和统一错误处理
 */
apiClient.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      const riskInfo = riskInfoFromHeaders(response.headers);
      if (riskInfo) {
        showRiskWarningToast(riskInfo);
      }
      return response;
    },
    (error: AxiosError<ApiError>) => {
    // 处理401未授权错误
      if (error.response?.status === 401) {
        return initiateLogin(window.location.pathname);
      }

      // 处理风控阻断
      if (
        error.response?.status === 403 &&
      error.response.data?.error_code === RISK_BLOCKED_CODE
      ) {
        const riskInfo =
        riskInfoFromDetails(error.response.data.details) ||
        riskInfoFromHeaders(error.response.headers);
        if (riskInfo) {
          showRiskBlockedDialog(riskInfo);
        }

        return Promise.reject(
            new ApiClientError(
                error.response.data?.error_msg || '账号存在风险',
                RISK_BLOCKED_CODE,
                error.response.data?.details,
                403,
            ),
        );
      }

      // 处理后端返回的错误信息
      if (error.response?.data?.error_msg) {
        const apiError = new ApiClientError(
            error.response.data.error_msg,
            error.response.data.error_code,
            error.response.data.details,
            error.response.status,
        );
        return Promise.reject(apiError);
      }

      // 处理网络错误
      if (error.code === 'ECONNABORTED') {
        return Promise.reject(new Error('请求超时，请检查网络连接'));
      }

      // 处理权限错误
      if (error.response?.status === 403) {
        return Promise.reject(
            new ApiClientError('权限不足', 'FORBIDDEN', undefined, 403),
        );
      }

      // 处理服务器错误
      if (error.response && error.response.status >= 500) {
        return Promise.reject(new Error('服务器内部错误，请稍后重试'));
      }

      return Promise.reject(new Error(error.message || '网络请求失败'));
    },
);

export default apiClient;
