import {AxiosResponse} from 'axios';
import {ApiResponse} from './types';

export class ApiClientError extends Error {
  requestId?: string;
  status?: number;

  constructor(
      message: string,
      options: { requestId?: string; status?: number } = {},
  ) {
    super(appendRequestId(message, options.requestId));
    this.name = 'ApiClientError';
    this.requestId = options.requestId;
    this.status = options.status;
  }
}

export const appendRequestId = (
    message: string,
    requestId?: string,
): string => {
  if (!requestId) {
    return message;
  }

  return `${message} (Request ID: ${requestId})`;
};

export const extractRequestId = (
    response?: Pick<AxiosResponse, 'headers'>,
): string | undefined => {
  const headerValue = response?.headers?.['x-request-id'];

  if (Array.isArray(headerValue)) {
    return headerValue[0];
  }

  if (typeof headerValue === 'string' && headerValue.trim()) {
    return headerValue.trim();
  }

  return undefined;
};

export const createApiClientError = (
    message: string,
    options: { requestId?: string; status?: number } = {},
): ApiClientError => new ApiClientError(message, options);

export const createApiClientErrorFromResponse = (
    message: string,
    response?: Pick<AxiosResponse, 'headers' | 'status'>,
): ApiClientError =>
  createApiClientError(message, {
    requestId: extractRequestId(response),
    status: response?.status,
  });

export const throwIfApiResponseError = <T>(
  response: AxiosResponse<ApiResponse<T>>,
): void => {
  if (response.data.error_msg) {
    throw createApiClientErrorFromResponse(response.data.error_msg, response);
  }
};
