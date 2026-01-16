/**
 * OpenAI-compatible API Route
 *
 * This route handles chat requests to an OpenAI-compatible server:
 * - Accepts messages in the standard format used by the frontend
 * - Forwards requests to an OpenAI-compatible API endpoint
 * - Transforms the streaming response to Vercel AI SDK format
 *
 * Environment variables:
 * - OPENAI_API_BASE_URL: Base URL for the OpenAI-compatible API (e.g., https://api.openai.com/v1)
 * - OPENAI_API_KEY: API key for authentication
 * - OPENAI_MODEL: Model to use (default: gpt-4o)
 */
import { NextRequest, NextResponse } from 'next/server';

const TEXT_PREFIX = '0:'; // vercel ai text prefix
const ANNOTATION_PREFIX = '8:'; // vercel ai annotation prefix

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_OPENAI_API_BASE_URL || 'https://api.openai.com/v1';
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  const model = process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4o';

  if (!apiKey) {
    return NextResponse.json(
      { detail: 'OPENAI_API_KEY environment variable is not set.' },
      { status: 500 }
    );
  }

  try {
    const { messages, temperature, max_tokens } = await request.json();

    // Transform messages to OpenAI format
    const openaiMessages = messages.map((msg: { role: string; content: string; parts?: { text: string }[] }) => ({
      role: msg.role,
      content: msg.content || msg.parts?.[0]?.text || '',
    }));

    // Call OpenAI-compatible API
    const response = await fetch(`${apiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: openaiMessages,
        stream: true,
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens ?? 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return NextResponse.json(
        { detail: `OpenAI API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    // Transform the OpenAI SSE stream to Vercel AI SDK format
    const aiSdkStream = response.body.pipeThrough(createOpenAIToAiSdkTransformStream());

    return new Response(aiSdkStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Vercel-AI-Data-Stream': 'v1',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error in OpenAI route:', error);
    const detail = (error as Error).message;
    return NextResponse.json({ detail }, { status: 500 });
  }
}

/**
 * Creates a TransformStream that converts OpenAI streaming format to Vercel AI SDK format.
 *
 * OpenAI format:
 *   data: {"id":"...","object":"chat.completion.chunk","choices":[{"delta":{"content":"Hello"}}]}
 *   data: [DONE]
 *
 * Vercel AI SDK format:
 *   0:"Hello"
 */
function createOpenAIToAiSdkTransformStream() {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  return new TransformStream({
    async transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });

      // Process complete SSE events (separated by double newlines)
      const events = buffer.split('\n');
      buffer = '';

      for (let i = 0; i < events.length; i++) {
        const line = events[i];

        // Keep incomplete lines in buffer
        if (i === events.length - 1 && !line.endsWith('\n') && line !== '') {
          buffer = line;
          continue;
        }

        const trimmedLine = line.trim();
        if (!trimmedLine || !trimmedLine.startsWith('data:')) {
          continue;
        }

        const dataContent = trimmedLine.slice(5).trim();

        // Handle stream end
        if (dataContent === '[DONE]') {
          continue;
        }

        try {
          const parsed = JSON.parse(dataContent);
          const delta = parsed.choices?.[0]?.delta;

          if (delta?.content) {
            const formattedChunk = `${TEXT_PREFIX}${JSON.stringify(delta.content)}\n`;
            controller.enqueue(encoder.encode(formattedChunk));
          }

          // Handle function/tool calls if present
          if (delta?.tool_calls) {
            for (const toolCall of delta.tool_calls) {
              if (toolCall.function) {
                const annotationPayload = {
                  type: 'functionCall',
                  data: {
                    name: toolCall.function.name,
                    args: toolCall.function.arguments,
                    id: toolCall.id,
                  },
                };
                const formattedChunk = `${ANNOTATION_PREFIX}${JSON.stringify([annotationPayload])}\n`;
                controller.enqueue(encoder.encode(formattedChunk));
              }
            }
          }
        } catch (e) {
          // Skip invalid JSON lines (common in SSE streams)
          console.debug('Skipping non-JSON SSE line:', trimmedLine);
        }
      }
    },

    flush(controller) {
      // Process any remaining buffer content
      if (buffer.trim()) {
        const trimmedLine = buffer.trim();
        if (trimmedLine.startsWith('data:')) {
          const dataContent = trimmedLine.slice(5).trim();
          if (dataContent !== '[DONE]') {
            try {
              const parsed = JSON.parse(dataContent);
              const delta = parsed.choices?.[0]?.delta;
              if (delta?.content) {
                const formattedChunk = `${TEXT_PREFIX}${JSON.stringify(delta.content)}\n`;
                controller.enqueue(encoder.encode(formattedChunk));
              }
            } catch (e) {
              // Ignore parse errors in flush
            }
          }
        }
      }
    },
  });
}
