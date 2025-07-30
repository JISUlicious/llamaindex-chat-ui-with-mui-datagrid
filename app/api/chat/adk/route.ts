
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * This function creates a TransformStream that reads an SSE stream from your backend,
 * parses the text content, and re-formats it into the Vercel AI SDK stream format.
 */
function createAiSdkTransformStream() {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new TransformStream({
    async transform(chunk, controller) {
      // Decode the SSE chunk from your backend
      const sseString = decoder.decode(chunk, { stream: true });

      // An SSE chunk can contain multiple "data:" events
      const lines = sseString.split('\n\n').filter((line) => line.trim().startsWith('data:'));

      for (const line of lines) {
        const jsonString = line.substring(6); // Remove "data: " prefix
        try {
          const parsed = JSON.parse(jsonString);
          
          // Extract the text chunk from your backend's specific JSON structure
          if (parsed.content?.parts?.[0]?.text && parsed.partial === true) {
            const textChunk = parsed.content.parts[0].text;

            // Format for Vercel AI SDK: `0:"<json_stringified_text>"\n`
            const formattedChunk = `0:${JSON.stringify(textChunk)}\n`;
            
            // Enqueue the transformed and encoded chunk
            console.log('Enqueuing chunk:', formattedChunk);
            controller.enqueue(encoder.encode(formattedChunk));
          }
        } catch (e) {
          console.error('Failed to parse SSE chunk:', jsonString, e);
        }
      }
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    const lastMessage = messages[messages.length - 1];

    // 1. Call your actual chat backend
    const backendResponse = await fetch('http://localhost:8000/run_sse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // This body matches the format your backend expects
        appName: 'agent',
        userId: 'u_123', // Replace with dynamic user/session IDs
        sessionId: 's_123',
        newMessage: {
          role: 'user',
          parts: [{ text: lastMessage.content }],
        },
        streaming: true,
      }),
    });

    if (!backendResponse.body) {
      throw new Error("The backend response does not contain a body.");
    }

    // 2. Create the transform stream and pipe the backend response through it
    const aiSdkStream = backendResponse.body.pipeThrough(createAiSdkTransformStream());

    // 3. Return the transformed stream in the response
    return new Response(aiSdkStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Vercel-AI-Data-Stream': 'v1',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    const detail = (error as Error).message;
    return NextResponse.json({ detail }, { status: 500 });
  }
}