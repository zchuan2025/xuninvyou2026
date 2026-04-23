import { aiConfig } from '../config';
import { ImageProviderInput, ProviderName } from '../contracts';
import { shouldAttemptFallback } from '../errors';
import { getImageProvider } from '../provider-factory';

interface GenerateConversationPhotoInput {
  prompt: string;
  mode: 'selfie' | 'requested';
  referenceImage?: string;
  requestHeaders?: Headers;
}

interface GenerateAvatarPhotosInput {
  personalityType: string;
  requestHeaders?: Headers;
}

function buildImageProviderSequence(): ProviderName[] {
  const providers: ProviderName[] = [aiConfig.image.provider];

  if (aiConfig.image.fallbackProvider) {
    providers.push(aiConfig.image.fallbackProvider);
  }

  return providers;
}

async function generateWithFallback(
  payload: ImageProviderInput,
  requestHeaders?: Headers,
): Promise<{ imageUrl: string; provider: ProviderName }> {
  const providers = buildImageProviderSequence();
  let lastError: unknown;

  for (let index = 0; index < providers.length; index += 1) {
    const providerName = providers[index];
    const provider = getImageProvider(providerName, requestHeaders);

    try {
      return await provider.generateImage(payload);
    } catch (error) {
      lastError = error;
      const isLastProvider = index === providers.length - 1;
      if (isLastProvider || !shouldAttemptFallback(error)) {
        throw error;
      }
    }
  }

  throw lastError;
}

export async function generateConversationPhoto(input: GenerateConversationPhotoInput) {
  return generateWithFallback(
    {
      prompt: input.prompt,
      mode: input.mode,
      referenceImage: input.mode === 'selfie' ? input.referenceImage : undefined,
    },
    input.requestHeaders,
  );
}

function getAvatarPromptsByPersonality(personalityType: string): string[] {
  const promptsMap: Record<string, string[]> = {
    gentle: [
      'A beautiful young Asian woman with gentle smile, soft features, warm and kind expression, natural lighting, portrait photography',
      'A lovely young woman with kind eyes, gentle demeanor, wearing casual soft-colored clothes, bright and warm atmosphere',
      'A sweet young woman with caring expression, soft flowing hair, gentle smile, natural beauty, portrait style',
    ],
    tsundere: [
      'A beautiful young Asian woman with slightly proud expression, confident pose, stylish outfit, fashionable look',
      'A cute young woman with playful expression, stylish hair, trendy clothes, confident attitude',
      'An attractive young woman with confident smile, fashion-forward style, modern aesthetic',
    ],
    mature: [
      'An elegant mature Asian woman with sophisticated expression, professional attire, poised and confident',
      'A refined young woman with elegant demeanor, wearing professional outfit, intelligent and composed',
      'A graceful young woman with sophisticated style, elegant features, confident and poised',
    ],
    lively: [
      'A cheerful young Asian woman with bright smile, energetic expression, colorful outfit, vibrant and fun',
      'A happy young woman with joyful expression, bright and lively, wearing colorful clothes',
      'An energetic young woman with big smile, bubbly personality, bright and colorful style',
    ],
    mysterious: [
      'A mysterious young Asian woman with enigmatic expression, elegant and sophisticated, atmospheric lighting',
      'A beautiful young woman with mysterious aura, subtle smile, elegant and intriguing',
      'An intriguing young woman with mysterious expression, elegant features, sophisticated style',
    ],
  };

  return promptsMap[personalityType] || promptsMap.gentle;
}

export async function generateAvatarPhotos(input: GenerateAvatarPhotosInput) {
  const prompts = getAvatarPromptsByPersonality(input.personalityType);
  const photos: string[] = [];

  for (const prompt of prompts) {
    const result = await generateWithFallback(
      {
        prompt,
        mode: 'requested',
      },
      input.requestHeaders,
    );

    photos.push(result.imageUrl);
  }

  return photos;
}
