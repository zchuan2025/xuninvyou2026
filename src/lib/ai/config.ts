import { ProviderName } from './contracts';

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  return value.toLowerCase() === 'true';
}

function parseNumber(value: string | undefined, defaultValue: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}

function parseProviderName(
  value: string | undefined,
  defaultValue: ProviderName,
): ProviderName {
  switch (value) {
    case 'coze':
    case 'deepseek':
    case 'ark':
    case 'openspeech':
      return value;
    default:
      return defaultValue;
  }
}

function parseOptionalProviderName(value: string | undefined): ProviderName | undefined {
  if (!value) {
    return undefined;
  }

  return parseProviderName(value, 'coze');
}

function normalizeFallbackProvider(
  provider: ProviderName,
  fallbackProvider: ProviderName | undefined,
): ProviderName | undefined {
  if (!fallbackProvider || fallbackProvider === provider) {
    return undefined;
  }

  return fallbackProvider;
}

export const aiConfig = {
  requestTimeoutMs: parseNumber(process.env.AI_REQUEST_TIMEOUT_MS, 60_000),
  chat: {
    provider: parseProviderName(process.env.AI_CHAT_PROVIDER, 'deepseek'),
    fallbackProvider: normalizeFallbackProvider(
      parseProviderName(process.env.AI_CHAT_PROVIDER, 'deepseek'),
      parseOptionalProviderName(process.env.AI_CHAT_FALLBACK_PROVIDER),
    ),
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY ?? '',
      baseUrl: process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com',
      model: process.env.DEEPSEEK_CHAT_MODEL ?? 'deepseek-chat',
    },
    coze: {
      model: process.env.COZE_CHAT_MODEL ?? 'doubao-seed-1-8-251228',
      temperature: parseNumber(process.env.COZE_CHAT_TEMPERATURE, 0.8),
    },
  },
  image: {
    provider: parseProviderName(process.env.AI_IMAGE_PROVIDER, 'ark'),
    fallbackProvider: normalizeFallbackProvider(
      parseProviderName(process.env.AI_IMAGE_PROVIDER, 'ark'),
      parseOptionalProviderName(process.env.AI_IMAGE_FALLBACK_PROVIDER),
    ),
    ark: {
      apiKey: process.env.ARK_API_KEY ?? '',
      baseUrl: process.env.ARK_BASE_URL ?? 'https://ark.cn-beijing.volces.com/api/v3',
      model: process.env.ARK_IMAGE_MODEL ?? 'doubao-seedream-5-0-260128',
      size: process.env.ARK_IMAGE_SIZE ?? '2K',
      watermark: parseBoolean(process.env.ARK_IMAGE_WATERMARK, false),
      responseFormat: process.env.ARK_IMAGE_RESPONSE_FORMAT ?? 'url',
    },
    coze: {
      size: process.env.COZE_IMAGE_SIZE ?? '2K',
      watermark: parseBoolean(process.env.COZE_IMAGE_WATERMARK, false),
    },
  },
  tts: {
    provider: parseProviderName(process.env.AI_TTS_PROVIDER, 'openspeech'),
    fallbackProvider: normalizeFallbackProvider(
      parseProviderName(process.env.AI_TTS_PROVIDER, 'openspeech'),
      parseOptionalProviderName(process.env.AI_TTS_FALLBACK_PROVIDER),
    ),
    openspeech: {
      appId: process.env.OPENSPEECH_APP_ID ?? '',
      apiKey: process.env.OPENSPEECH_API_KEY ?? '',
      baseUrl:
        process.env.OPENSPEECH_BASE_URL ??
        'https://openspeech.bytedance.com/api/v3/tts/unidirectional',
      resourceId: process.env.OPENSPEECH_RESOURCE_ID ?? 'seed-tts-2.0',
      audioFormat: process.env.OPENSPEECH_AUDIO_FORMAT ?? 'mp3',
      sampleRate: parseNumber(process.env.OPENSPEECH_SAMPLE_RATE, 24000),
      defaultSpeaker:
        process.env.OPENSPEECH_DEFAULT_SPEAKER ??
        'zh_female_shuangkuaisisi_moon_bigtts',
      voiceModel: process.env.OPENSPEECH_VOICE_MODEL ?? 'BV104_streaming',
    },
  },
};
