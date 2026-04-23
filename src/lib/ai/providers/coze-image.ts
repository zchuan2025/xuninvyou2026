import { Config, HeaderUtils, ImageGenerationClient } from 'coze-coding-dev-sdk';
import { aiConfig } from '../config';
import {
  ImageProviderAdapter,
  ImageProviderInput,
  ImageProviderResult,
} from '../contracts';
import { AIProviderError, normalizeProviderError } from '../errors';
import { logProviderEnd, logProviderStart } from '../logger';

function buildCozePrompt(input: ImageProviderInput): string {
  if (input.mode === 'selfie') {
    return `A realistic selfie photo of the same woman from the reference image, ${input.prompt}. The image must keep the same facial features, identity, and overall appearance as the reference image. High quality, natural lighting, realistic style.`;
  }

  return `Create an image that matches this user request exactly: "${input.prompt}". Keep the main subject exactly as requested. If the request asks for a cat, it must be a cat. If it asks for a dog, it must be a dog. Do not replace the requested subject with another animal, person, or object. High quality, realistic style unless the request itself asks for a different style.`;
}

export class CozeImageProvider implements ImageProviderAdapter {
  constructor(private readonly requestHeaders?: Headers) {}

  async generateImage(input: ImageProviderInput): Promise<ImageProviderResult> {
    const startedAt = logProviderStart({
      operation: 'image.generate',
      provider: 'coze',
      metadata: {
        mode: input.mode,
        hasReferenceImage: Boolean(input.referenceImage),
      },
    });

    try {
      const customHeaders = this.requestHeaders
        ? HeaderUtils.extractForwardHeaders(this.requestHeaders)
        : {};
      const client = new ImageGenerationClient(new Config(), customHeaders);
      const payload: {
        prompt: string;
        image?: string;
        size: string;
        watermark: boolean;
        responseFormat: 'url';
      } = {
        prompt: buildCozePrompt(input),
        size: input.size ?? aiConfig.image.coze.size,
        watermark: input.watermark ?? aiConfig.image.coze.watermark,
        responseFormat: 'url',
      };

      if (input.mode === 'selfie' && input.referenceImage) {
        payload.image = input.referenceImage;
      }

      const response = await client.generate(payload);
      const helper = client.getResponseHelper(response);

      if (!helper.success || helper.imageUrls.length === 0) {
        throw new AIProviderError({
          type: 'provider',
          provider: 'coze',
          message: helper.errorMessages.join(', ') || 'Image generation failed',
          retryable: true,
          details: helper.errorMessages,
        });
      }

      logProviderEnd({
        operation: 'image.generate',
        provider: 'coze',
        startedAt,
        statusCode: 200,
      });

      return {
        imageUrl: helper.imageUrls[0],
        provider: 'coze',
      };
    } catch (error) {
      const normalizedError = normalizeProviderError(
        'coze',
        error,
        'Coze image request failed',
      );

      logProviderEnd({
        operation: 'image.generate',
        provider: 'coze',
        startedAt,
        error: normalizedError,
      });

      throw normalizedError;
    }
  }
}
