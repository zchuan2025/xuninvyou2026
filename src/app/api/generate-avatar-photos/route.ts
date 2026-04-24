import { NextRequest } from 'next/server';
import { getBusinessErrorMessage, getHttpStatusFromError } from '@/lib/ai/errors';
import { generateAvatarPhotos } from '@/lib/ai/services/image-service';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { personalityType } = await request.json();

    if (!personalityType) {
      return new Response(JSON.stringify({ error: 'Missing required parameter: personalityType' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const photos = await generateAvatarPhotos({
      personalityType,
      requestHeaders: request.headers,
    });

    return new Response(JSON.stringify({
      photos,
      success: true,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Avatar photos generation API error:', error);
    return new Response(JSON.stringify({ error: getBusinessErrorMessage(error) }), {
      status: getHttpStatusFromError(error),
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
