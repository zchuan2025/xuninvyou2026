import { ChatProviderAdapter, ImageProviderAdapter, ProviderName, TtsProviderAdapter } from './contracts';
import { ArkImageProvider } from './providers/ark-image';
import { CozeChatProvider } from './providers/coze-chat';
import { CozeImageProvider } from './providers/coze-image';
import { CozeTtsProvider } from './providers/coze-tts';
import { DeepSeekChatProvider } from './providers/deepseek-chat';
import { OpenSpeechTtsProvider } from './providers/openspeech-tts';

export function getChatProvider(
  provider: ProviderName,
  requestHeaders?: Headers,
): ChatProviderAdapter {
  switch (provider) {
    case 'deepseek':
      return new DeepSeekChatProvider();
    case 'coze':
      return new CozeChatProvider(requestHeaders);
    default:
      throw new Error(`Unsupported chat provider: ${provider}`);
  }
}

export function getImageProvider(
  provider: ProviderName,
  requestHeaders?: Headers,
): ImageProviderAdapter {
  switch (provider) {
    case 'ark':
      return new ArkImageProvider();
    case 'coze':
      return new CozeImageProvider(requestHeaders);
    default:
      throw new Error(`Unsupported image provider: ${provider}`);
  }
}

export function getTtsProvider(
  provider: ProviderName,
  requestHeaders?: Headers,
): TtsProviderAdapter {
  switch (provider) {
    case 'openspeech':
      return new OpenSpeechTtsProvider();
    case 'coze':
      return new CozeTtsProvider(requestHeaders);
    default:
      throw new Error(`Unsupported TTS provider: ${provider}`);
  }
}
