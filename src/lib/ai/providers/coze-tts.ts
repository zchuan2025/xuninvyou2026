import { Config, HeaderUtils, TTSClient } from 'coze-coding-dev-sdk';
import { TtsProviderAdapter, TtsProviderInput, TtsProviderResult } from '../contracts';
import { normalizeProviderError } from '../errors';
import { logProviderEnd, logProviderStart } from '../logger';

function selectCozeSpeaker(girlfriendType?: string): string {
  const voiceMap: Record<string, string> = {
    gentle: 'zh_female_xiaohe_uranus_bigtts',
    tsundere: 'saturn_zh_female_tiaopigongzhu_tob',
    mature: 'zh_female_vv_uranus_bigtts',
    lively: 'saturn_zh_female_keainvsheng_tob',
    mysterious: 'zh_female_mizai_saturn_bigtts',
  };

  return voiceMap[girlfriendType || 'gentle'] || 'zh_female_xiaohe_uranus_bigtts';
}

export class CozeTtsProvider implements TtsProviderAdapter {
  constructor(private readonly requestHeaders?: Headers) {}

  async synthesize(input: TtsProviderInput): Promise<TtsProviderResult> {
    const startedAt = logProviderStart({
      operation: 'tts.synthesize',
      provider: 'coze',
      metadata: {
        textLength: input.text.length,
      },
    });

    try {
      const customHeaders = this.requestHeaders
        ? HeaderUtils.extractForwardHeaders(this.requestHeaders)
        : {};
      const client = new TTSClient(new Config(), customHeaders);
      const response = await client.synthesize({
        uid: `user-${Date.now()}`,
        text: input.text,
        speaker: selectCozeSpeaker(input.girlfriendType),
        audioFormat: 'mp3',
        sampleRate: 24000,
        speechRate: 10,
        loudnessRate: 5,
      });

      logProviderEnd({
        operation: 'tts.synthesize',
        provider: 'coze',
        startedAt,
        statusCode: 200,
      });

      return {
        audioUri: response.audioUri,
        audioSize: response.audioSize,
        provider: 'coze',
      };
    } catch (error) {
      const normalizedError = normalizeProviderError(
        'coze',
        error,
        'Coze TTS request failed',
      );

      logProviderEnd({
        operation: 'tts.synthesize',
        provider: 'coze',
        startedAt,
        error: normalizedError,
      });

      throw normalizedError;
    }
  }
}
