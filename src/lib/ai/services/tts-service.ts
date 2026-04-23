import { aiConfig } from '../config';
import { ProviderName } from '../contracts';
import { AIProviderError, shouldAttemptFallback } from '../errors';
import { getTtsProvider } from '../provider-factory';

interface SynthesizeSpeechInput {
  text: string;
  girlfriendType?: string;
  requestHeaders?: Headers;
}

function buildTtsProviderSequence(): ProviderName[] {
  const providers: ProviderName[] = [aiConfig.tts.provider];

  if (aiConfig.tts.fallbackProvider) {
    providers.push(aiConfig.tts.fallbackProvider);
  }

  return providers;
}

function shouldAttemptTtsFallback(error: unknown): boolean {
  if (error instanceof AIProviderError) {
    if (error.type === 'bad_request' || error.type === 'permission') {
      return false;
    }

    return true;
  }

  return shouldAttemptFallback(error);
}

export async function synthesizeSpeech(input: SynthesizeSpeechInput) {
  const providers = buildTtsProviderSequence();
  let lastError: unknown;

  for (let index = 0; index < providers.length; index += 1) {
    const providerName = providers[index];
    const provider = getTtsProvider(providerName, input.requestHeaders);

    try {
      return await provider.synthesize({
        text: input.text,
        girlfriendType: input.girlfriendType,
      });
    } catch (error) {
      lastError = error;
      const isLastProvider = index === providers.length - 1;
      if (isLastProvider || !shouldAttemptTtsFallback(error)) {
        throw error;
      }
    }
  }

  throw lastError;
}
