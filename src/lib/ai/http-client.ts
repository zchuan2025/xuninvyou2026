import { ProviderName } from './contracts';
import { createHttpStatusError, normalizeProviderError } from './errors';

interface RequestOptions {
  provider: ProviderName;
  url: string;
  headers: HeadersInit;
  body: unknown;
  timeoutMs: number;
}

async function executeRequest(options: RequestOptions): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    return await fetch(options.url, {
      method: 'POST',
      headers: options.headers,
      body: JSON.stringify(options.body),
      signal: controller.signal,
    });
  } catch (error) {
    throw normalizeProviderError(options.provider, error, 'Provider request failed');
  } finally {
    clearTimeout(timeout);
  }
}

async function safeReadResponseText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

export async function postJson<T>(options: RequestOptions): Promise<T> {
  const response = await executeRequest(options);

  if (!response.ok) {
    const responseText = await safeReadResponseText(response);
    throw createHttpStatusError(options.provider, response.status, responseText);
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw normalizeProviderError(
      options.provider,
      error,
      'Provider returned invalid JSON response',
    );
  }
}

export async function postStream(options: RequestOptions): Promise<Response> {
  const response = await executeRequest(options);

  if (!response.ok) {
    const responseText = await safeReadResponseText(response);
    throw createHttpStatusError(options.provider, response.status, responseText);
  }

  return response;
}
