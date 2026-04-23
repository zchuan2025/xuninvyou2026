import { AIErrorType, ProviderName } from './contracts';

interface AIProviderErrorOptions {
  type: AIErrorType;
  provider: ProviderName;
  message: string;
  statusCode?: number;
  retryable?: boolean;
  details?: unknown;
}

export class AIProviderError extends Error {
  readonly type: AIErrorType;
  readonly provider: ProviderName;
  readonly statusCode?: number;
  readonly retryable: boolean;
  readonly details?: unknown;

  constructor(options: AIProviderErrorOptions) {
    super(options.message);
    this.name = 'AIProviderError';
    this.type = options.type;
    this.provider = options.provider;
    this.statusCode = options.statusCode;
    this.retryable = options.retryable ?? false;
    this.details = options.details;
  }
}

export function createHttpStatusError(
  provider: ProviderName,
  statusCode: number,
  responseText: string,
): AIProviderError {
  if (statusCode === 400) {
    return new AIProviderError({
      type: 'bad_request',
      provider,
      message: responseText || 'Bad request',
      statusCode,
      retryable: false,
      details: responseText,
    });
  }

  if (statusCode === 401) {
    return new AIProviderError({
      type: 'auth',
      provider,
      message: responseText || 'Unauthorized',
      statusCode,
      retryable: false,
      details: responseText,
    });
  }

  if (statusCode === 403) {
    return new AIProviderError({
      type: 'permission',
      provider,
      message: responseText || 'Forbidden',
      statusCode,
      retryable: false,
      details: responseText,
    });
  }

  if (statusCode === 429) {
    return new AIProviderError({
      type: 'rate_limit',
      provider,
      message: responseText || 'Rate limited',
      statusCode,
      retryable: true,
      details: responseText,
    });
  }

  if (statusCode >= 500) {
    return new AIProviderError({
      type: 'provider',
      provider,
      message: responseText || 'Provider server error',
      statusCode,
      retryable: true,
      details: responseText,
    });
  }

  return new AIProviderError({
    type: 'unknown',
    provider,
    message: responseText || 'Unknown provider error',
    statusCode,
    retryable: false,
    details: responseText,
  });
}

export function normalizeProviderError(
  provider: ProviderName,
  error: unknown,
  defaultMessage: string,
): AIProviderError {
  if (error instanceof AIProviderError) {
    return error;
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return new AIProviderError({
      type: 'timeout',
      provider,
      message: `${defaultMessage}: request timed out`,
      retryable: true,
      details: error,
    });
  }

  if (error instanceof TypeError) {
    return new AIProviderError({
      type: 'network',
      provider,
      message: `${defaultMessage}: network error`,
      retryable: true,
      details: error.message,
    });
  }

  if (error instanceof Error) {
    return new AIProviderError({
      type: 'unknown',
      provider,
      message: error.message || defaultMessage,
      retryable: false,
      details: error.stack,
    });
  }

  return new AIProviderError({
    type: 'unknown',
    provider,
    message: defaultMessage,
    retryable: false,
    details: error,
  });
}

export function getBusinessErrorMessage(error: unknown): string {
  if (!(error instanceof AIProviderError)) {
    return 'AI 服务发生未知错误，请稍后再试。';
  }

  switch (error.type) {
    case 'auth':
      return 'AI 服务认证失败，请检查服务端 API Key 配置。';
    case 'permission':
      return 'AI 服务没有访问权限，请检查账号权限配置。';
    case 'rate_limit':
      return 'AI 服务当前请求较多，请稍后再试。';
    case 'timeout':
      return 'AI 服务响应超时，请稍后再试。';
    case 'provider':
      return 'AI 服务暂时不可用，请稍后再试。';
    case 'bad_request':
      return '请求参数有误，暂时无法处理。';
    case 'network':
      return 'AI 服务网络异常，请稍后再试。';
    default:
      return 'AI 服务发生未知错误，请稍后再试。';
  }
}

export function getHttpStatusFromError(error: unknown): number {
  if (error instanceof AIProviderError && error.statusCode) {
    return error.statusCode;
  }

  return 500;
}

export function shouldAttemptFallback(error: unknown): boolean {
  return error instanceof AIProviderError && error.retryable;
}
