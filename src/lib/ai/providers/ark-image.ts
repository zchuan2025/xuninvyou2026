import { aiConfig } from '../config';
import {
  ImageProviderAdapter,
  ImageProviderInput,
  ImageProviderResult,
} from '../contracts';
import { AIProviderError, normalizeProviderError } from '../errors';
import { postJson } from '../http-client';
import { logProviderEnd, logProviderStart } from '../logger';

interface ArkImageResponse {
  data?: Array<{
    url?: string;
    size?: string;
  }>;
}

export class ArkImageProvider implements ImageProviderAdapter {
  async generateImage(input: ImageProviderInput): Promise<ImageProviderResult> {
    const startedAt = logProviderStart({
      operation: 'image.generate',
      provider: 'ark',
      metadata: {
        mode: input.mode,
        hasReferenceImage: Boolean(input.referenceImage),
        model: aiConfig.image.ark.model,
      },
    });

    try {
      const payload: Record<string, unknown> = {
        model: aiConfig.image.ark.model,
        prompt: input.prompt,
        sequential_image_generation: 'disabled',
        response_format: aiConfig.image.ark.responseFormat,
        size: input.size ?? aiConfig.image.ark.size,
        stream: false,
        watermark: input.watermark ?? aiConfig.image.ark.watermark,
      };

      if (input.mode === 'selfie' && input.referenceImage) {
        payload.image = [input.referenceImage];
      }

      const response = await postJson<ArkImageResponse>({
        provider: 'ark',
        url: `${aiConfig.image.ark.baseUrl}/images/generations`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiConfig.image.ark.apiKey}`,
        },
        body: payload,
        timeoutMs: aiConfig.requestTimeoutMs,
      });

      const imageUrl = response.data?.[0]?.url;

      if (!imageUrl) {
        throw new AIProviderError({
          type: 'provider',
          provider: 'ark',
          message: 'Ark image response does not contain a valid image URL',
          retryable: true,
          details: response,
        });
      }

      logProviderEnd({
        operation: 'image.generate',
        provider: 'ark',
        startedAt,
        statusCode: 200,
      });

      return {
        imageUrl,
        provider: 'ark',
      };
    } catch (error) {
      const normalizedError = normalizeProviderError(
        'ark',
        error,
        'Ark image request failed',
      );

      logProviderEnd({
        operation: 'image.generate',
        provider: 'ark',
        startedAt,
        error: normalizedError,
      });

      throw normalizedError;
    }
  }
}
