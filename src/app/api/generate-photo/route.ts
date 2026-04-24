import { NextRequest } from 'next/server';
import { getBusinessErrorMessage, getHttpStatusFromError } from '@/lib/ai/errors';
import { generateConversationPhoto } from '@/lib/ai/services/image-service';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const {
      prompt,
      referenceImage,
      mode = 'selfie',
    } = await request.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (mode === 'selfie' && !referenceImage) {
      return new Response(JSON.stringify({ error: 'Missing required parameter: referenceImage' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await generateConversationPhoto({
      prompt,
      mode,
      referenceImage,
      requestHeaders: request.headers,
    });

    return new Response(JSON.stringify({
      imageUrl: result.imageUrl,
      success: true,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Photo generation API error:', error);
    return new Response(JSON.stringify({ error: getBusinessErrorMessage(error) }), {
      status: getHttpStatusFromError(error),
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
