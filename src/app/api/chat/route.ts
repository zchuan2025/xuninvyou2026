import { NextRequest } from 'next/server';
import { GameState } from '@/types';
import { getBusinessErrorMessage } from '@/lib/ai/errors';
import { streamGameChat } from '@/lib/ai/services/chat-service';

export async function POST(request: NextRequest) {
  try {
    const { message, gameState } = await request.json();

    if (!message || !gameState) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const state = gameState as GameState;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamGameChat({
            message,
            gameState: state,
            requestHeaders: request.headers,
          })) {
            if (chunk.content) {
              const data = `data: ${JSON.stringify({ content: chunk.content })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }

            if (chunk.done) {
              break;
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          const businessMessage = getBusinessErrorMessage(error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ content: businessMessage })}\n\n`),
          );
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
