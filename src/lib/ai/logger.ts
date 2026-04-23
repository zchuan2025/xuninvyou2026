import { ProviderName } from './contracts';

interface ProviderLogStartInput {
  operation: string;
  provider: ProviderName;
  metadata?: Record<string, unknown>;
}

interface ProviderLogEndInput {
  operation: string;
  provider: ProviderName;
  startedAt: number;
  statusCode?: number;
  error?: unknown;
  metadata?: Record<string, unknown>;
}

function summarizeError(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return undefined;
}

export function logProviderStart(input: ProviderLogStartInput): number {
  const startedAt = Date.now();

  console.info(
    JSON.stringify({
      event: 'ai_request_start',
      operation: input.operation,
      provider: input.provider,
      startedAt,
      metadata: input.metadata ?? {},
    }),
  );

  return startedAt;
}

export function logProviderEnd(input: ProviderLogEndInput): void {
  const durationMs = Date.now() - input.startedAt;
  const payload = {
    event: 'ai_request_end',
    operation: input.operation,
    provider: input.provider,
    durationMs,
    statusCode: input.statusCode,
    errorSummary: summarizeError(input.error),
    metadata: input.metadata ?? {},
  };

  if (input.error) {
    console.error(JSON.stringify(payload));
    return;
  }

  console.info(JSON.stringify(payload));
}
