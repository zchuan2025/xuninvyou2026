import { Config, HeaderUtils, LLMClient } from 'coze-coding-dev-sdk';
import { aiConfig } from '../config';
import { ChatProviderAdapter, ChatProviderInput, ChatStreamChunk } from '../contracts';
import { normalizeProviderError } from '../errors';
import { logProviderEnd, logProviderStart } from '../logger';

export class CozeChatProvider implements ChatProviderAdapter {
  constructor(private readonly requestHeaders?: Headers) {}

  async *streamChat(input: ChatProviderInput): AsyncIterable<ChatStreamChunk> {
    const startedAt = logProviderStart({
      operation: 'chat.stream',
      provider: 'coze',
      metadata: {
        messageCount: input.messages.length,
        model: aiConfig.chat.coze.model,
      },
    });

    try {
      const customHeaders = this.requestHeaders
        ? HeaderUtils.extractForwardHeaders(this.requestHeaders)
        : {};
      const client = new LLMClient(new Config(), customHeaders);
      const stream = client.stream(input.messages, {
        model: aiConfig.chat.coze.model,
        temperature: input.temperature ?? aiConfig.chat.coze.temperature,
        thinking: 'disabled',
        caching: 'enabled',
      });

      for await (const chunk of stream) {
        if (chunk.content) {
          yield {
            content: chunk.content.toString(),
            provider: 'coze',
          };
        }
      }

      logProviderEnd({
        operation: 'chat.stream',
        provider: 'coze',
        startedAt,
        statusCode: 200,
      });

      yield { done: true, provider: 'coze' };
    } catch (error) {
      const normalizedError = normalizeProviderError(
        'coze',
        error,
        'Coze chat request failed',
      );

      logProviderEnd({
        operation: 'chat.stream',
        provider: 'coze',
        startedAt,
        error: normalizedError,
      });

      throw normalizedError;
    }
  }
}
