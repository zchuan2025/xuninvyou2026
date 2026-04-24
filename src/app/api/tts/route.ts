import { NextRequest } from 'next/server';
import { getBusinessErrorMessage, getHttpStatusFromError } from '@/lib/ai/errors';
import { synthesizeSpeech } from '@/lib/ai/services/tts-service';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { text, girlfriendType } = await request.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'Missing required parameter: text' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await synthesizeSpeech({
      text,
      girlfriendType,
      requestHeaders: request.headers,
    });

    return new Response(JSON.stringify({
      audioUri: result.audioUri,
      audioSize: result.audioSize,
      success: true,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('TTS API error:', error);
    return new Response(JSON.stringify({ error: getBusinessErrorMessage(error) }), {
      status: getHttpStatusFromError(error),
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
