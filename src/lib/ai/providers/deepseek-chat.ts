import { aiConfig } from '../config';
import { ChatProviderAdapter, ChatProviderInput, ChatStreamChunk } from '../contracts';
import { AIProviderError, normalizeProviderError } from '../errors';
import { postStream } from '../http-client';
import { logProviderEnd, logProviderStart } from '../logger';

function extractDeepSeekContent(payload: any): string {
  const choice = payload?.choices?.[0];

  if (!choice) {
    return '';
  }

  const deltaContent = choice.delta?.content;
  if (typeof deltaContent === 'string') {
    return deltaContent;
  }

  const messageContent = choice.message?.content;
  if (typeof messageContent === 'string') {
    return messageContent;
  }

  const textContent = choice.text;
  if (typeof textContent === 'string') {
    return textContent;
  }

  return '';
}

async function* parseSseStream(response: Response): AsyncIterable<string> {
  const reader = response.body?.getReader();

  if (!reader) {
    throw new AIProviderError({
      type: 'provider',
      provider: 'deepseek',
      message: 'DeepSeek response body is empty',
      retryable: true,
    });
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    let lineBreakIndex = buffer.indexOf('\n');
    while (lineBreakIndex !== -1) {
      const rawLine = buffer.slice(0, lineBreakIndex);
      buffer = buffer.slice(lineBreakIndex + 1);
      const line = rawLine.trim();

      if (line.startsWith('data:')) {
        const data = line.slice(5).trim();

        if (data === '[DONE]') {
          return;
        }

        if (data) {
          yield data;
        }
      }

      lineBreakIndex = buffer.indexOf('\n');
    }
  }

  const remainingLine = buffer.trim();
  if (remainingLine.startsWith('data:')) {
    const data = remainingLine.slice(5).trim();
    if (data && data !== '[DONE]') {
      yield data;
    }
  }
}

export class DeepSeekChatProvider implements ChatProviderAdapter {
  async *streamChat(input: ChatProviderInput): AsyncIterable<ChatStreamChunk> {
    const startedAt = logProviderStart({
      operation: 'chat.stream',
      provider: 'deepseek',
      metadata: {
        model: aiConfig.chat.deepseek.model,
        messageCount: input.messages.length,
      },
    });

    try {
      const response = await postStream({
        provider: 'deepseek',
        url: `${aiConfig.chat.deepseek.baseUrl}/chat/completions`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiConfig.chat.deepseek.apiKey}`,
        },
        body: {
          model: aiConfig.chat.deepseek.model,
          messages: input.messages,
          stream: true,
          temperature: input.temperature,
        },
        timeoutMs: aiConfig.requestTimeoutMs,
      });

      for await (const data of parseSseStream(response)) {
        const payload = JSON.parse(data);
        const content = extractDeepSeekContent(payload);

        if (content) {
          yield {
            content,
            provider: 'deepseek',
          };
        }
      }

      logProviderEnd({
        operation: 'chat.stream',
        provider: 'deepseek',
        startedAt,
        statusCode: 200,
      });

      yield { done: true, provider: 'deepseek' };
    } catch (error) {
      const normalizedError = normalizeProviderError(
        'deepseek',
        error,
        'DeepSeek chat request failed',
      );

      logProviderEnd({
        operation: 'chat.stream',
        provider: 'deepseek',
        startedAt,
        error: normalizedError,
      });

      throw normalizedError;
    }
  }
}
