export type ProviderName = 'coze' | 'deepseek' | 'ark' | 'openspeech';

export type AIErrorType =
  | 'bad_request'
  | 'auth'
  | 'permission'
  | 'rate_limit'
  | 'timeout'
  | 'provider'
  | 'network'
  | 'unknown';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatStreamChunk {
  content?: string;
  done?: boolean;
  provider: ProviderName;
}

export interface ChatProviderInput {
  messages: ChatMessage[];
  temperature?: number;
}

export interface ImageProviderInput {
  prompt: string;
  mode: 'selfie' | 'requested';
  referenceImage?: string;
  size?: string;
  watermark?: boolean;
}

export interface ImageProviderResult {
  imageUrl: string;
  provider: ProviderName;
}

export interface TtsProviderInput {
  text: string;
  girlfriendType?: string;
}

export interface TtsProviderResult {
  audioUri: string;
  audioSize?: number;
  provider: ProviderName;
}

export interface ChatProviderAdapter {
  streamChat(input: ChatProviderInput): AsyncIterable<ChatStreamChunk>;
}

export interface ImageProviderAdapter {
  generateImage(input: ImageProviderInput): Promise<ImageProviderResult>;
}

export interface TtsProviderAdapter {
  synthesize(input: TtsProviderInput): Promise<TtsProviderResult>;
}
