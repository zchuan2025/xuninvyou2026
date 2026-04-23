import { aiConfig } from '../config';
import { AIProviderError, normalizeProviderError } from '../errors';
import { postStream } from '../http-client';
import { logProviderEnd, logProviderStart } from '../logger';
import { TtsProviderAdapter, TtsProviderInput, TtsProviderResult } from '../contracts';

function selectOpenSpeechSpeaker(girlfriendType?: string): string {
  const voiceMap: Record<string, string> = {
    gentle: 'zh_female_xiaohe_uranus_bigtts',
    tsundere: 'saturn_zh_female_tiaopigongzhu_tob',
    mature: 'zh_female_vv_uranus_bigtts',
    lively: 'saturn_zh_female_keainvsheng_tob',
    mysterious: 'zh_female_mizai_saturn_bigtts',
  };

  return (
    voiceMap[girlfriendType || 'gentle'] ||
    aiConfig.tts.openspeech.defaultSpeaker
  );
}

function getAudioMimeType(format: string): string {
  if (format === 'ogg') {
    return 'audio/ogg';
  }

  if (format === 'wav') {
    return 'audio/wav';
  }

  return 'audio/mpeg';
}

async function collectAudioChunks(response: Response): Promise<Buffer[]> {
  const reader = response.body?.getReader();

  if (!reader) {
    throw new AIProviderError({
      type: 'provider',
      provider: 'openspeech',
      message: 'OpenSpeech response body is empty',
      retryable: true,
    });
  }

  const decoder = new TextDecoder();
  let buffer = '';
  const chunks: Buffer[] = [];

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

      if (!line) {
        lineBreakIndex = buffer.indexOf('\n');
        continue;
      }

      const payload = JSON.parse(line);
      const code = payload.code;

      if (code === 0 && payload.data) {
        chunks.push(Buffer.from(payload.data, 'base64'));
      } else if (code === 20000000) {
        return chunks;
      } else if (code !== undefined) {
        throw new AIProviderError({
          type: 'provider',
          provider: 'openspeech',
          message: payload.message || 'OpenSpeech synthesis failed',
          retryable: true,
          details: payload,
        });
      }

      lineBreakIndex = buffer.indexOf('\n');
    }
  }

  const remainingLine = buffer.trim();
  if (remainingLine) {
    const payload = JSON.parse(remainingLine);
    const code = payload.code;
    if (code === 0 && payload.data) {
      chunks.push(Buffer.from(payload.data, 'base64'));
    } else if (code !== 20000000) {
      throw new AIProviderError({
        type: 'provider',
        provider: 'openspeech',
        message: payload.message || 'OpenSpeech synthesis failed',
        retryable: true,
        details: payload,
      });
    }
  }

  return chunks;
}

export class OpenSpeechTtsProvider implements TtsProviderAdapter {
  async synthesize(input: TtsProviderInput): Promise<TtsProviderResult> {
    const startedAt = logProviderStart({
      operation: 'tts.synthesize',
      provider: 'openspeech',
      metadata: {
        textLength: input.text.length,
        resourceId: aiConfig.tts.openspeech.resourceId,
      },
    });

    try {
      const response = await postStream({
        provider: 'openspeech',
        url: aiConfig.tts.openspeech.baseUrl,
        headers: {
          'X-Api-App-Id': aiConfig.tts.openspeech.appId,
          'X-Api-Access-Key': aiConfig.tts.openspeech.apiKey,
          'X-Api-Resource-Id': aiConfig.tts.openspeech.resourceId,
          'X-Api-Request-Id': `tts-${crypto.randomUUID()}`,
          'Content-Type': 'application/json',
        },
        body: {
          user: {
            uid: `user-${Date.now()}`,
          },
          req_params: {
            text: input.text,
            speaker: selectOpenSpeechSpeaker(input.girlfriendType),
            audio_params: {
              format: aiConfig.tts.openspeech.audioFormat,
              sample_rate: aiConfig.tts.openspeech.sampleRate,
            },
          },
        },
        timeoutMs: aiConfig.requestTimeoutMs,
      });

      const chunks = await collectAudioChunks(response);
      const audioBuffer = Buffer.concat(chunks);

      if (audioBuffer.length === 0) {
        throw new AIProviderError({
          type: 'provider',
          provider: 'openspeech',
          message: 'OpenSpeech returned empty audio data',
          retryable: true,
        });
      }

      const mimeType = getAudioMimeType(aiConfig.tts.openspeech.audioFormat);
      const audioUri = `data:${mimeType};base64,${audioBuffer.toString('base64')}`;

      logProviderEnd({
        operation: 'tts.synthesize',
        provider: 'openspeech',
        startedAt,
        statusCode: 200,
        metadata: {
          audioSize: audioBuffer.length,
          voiceModel: aiConfig.tts.openspeech.voiceModel,
        },
      });

      return {
        audioUri,
        audioSize: audioBuffer.length,
        provider: 'openspeech',
      };
    } catch (error) {
      const normalizedError = normalizeProviderError(
        'openspeech',
        error,
        'OpenSpeech TTS request failed',
      );

      logProviderEnd({
        operation: 'tts.synthesize',
        provider: 'openspeech',
        startedAt,
        error: normalizedError,
      });

      throw normalizedError;
    }
  }
}
