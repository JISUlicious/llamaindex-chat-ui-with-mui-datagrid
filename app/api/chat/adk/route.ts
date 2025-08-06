
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const agentServerUrlBase = process.env.NEXT_PUBLIC_AGENT_SERVER_URL;
  if (!agentServerUrlBase) {
    return NextResponse.json({ detail: "NEXT_PUBLIC_AGENT_SERVER_URL environment variable is not set." }, { status: 500 });
  }

  try {
    const { appName, messages, userId, sessionId } = await request.json();
    // const lastMessage = messages[messages.length - 1];
    const lastMessage = messages.at(-1);
    // const allMesssages = await request.json();
    // console.log("allMesssages", allMesssages);
    // 1. Call your actual chat backend
    const backendResponse = await fetch(`${agentServerUrlBase}/run_sse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appName: appName,
        userId: userId,
        sessionId: sessionId,
        new_message: {
          role: 'user',
          parts: [{ text: lastMessage.parts[0].text }],
        },
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

/**
 * This function creates a TransformStream that reads an SSE stream from your backend,
 * parses the text content, and re-formats it into the Vercel AI SDK stream format.
 */
function createAiSdkTransformStream() {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new TransformStream({
    async transform(chunk, controller) {
      // Decode the raw chunk from the backend
      const sseString = decoder.decode(chunk, { stream: true });

      // SSE messages are separated by double newlines.
      const lines = sseString.split('\n\n').filter((line) => line.trim().startsWith('data:'));

      for (const line of lines) {
        const jsonString = line.substring(6).trim(); // Remove "data: " prefix and trim whitespace
        if (!jsonString) continue; // Skip if the data part is empty

        // --- THIS IS THE MOST IMPORTANT LOG NOW ---
        // It will show you the exact data structure from your Python backend.
        console.log('RAW SSE JSON from backend:', jsonString);
        // ---

        try {
          const parsed = JSON.parse(jsonString);

          // Let's try to find the text chunk based on the raw log output.
          // We are temporarily relaxing the condition to see if we can process *any* text.
          const textChunk = parsed.content?.parts?.[0]?.text; // This is a GUESS based on your original code

          if (textChunk) {
            // If this works, you will see the "Enqueuing" log
            const formattedChunk = `0:${JSON.stringify(textChunk)}\n`;
            console.log('SUCCESS: Enqueuing chunk for Vercel SDK:', formattedChunk);
            controller.enqueue(encoder.encode(formattedChunk));
          } else {
            // If the textChunk isn't found, this log will appear.
            console.log('INFO: Did not find text in the expected structure. Parsed object:', parsed);
          }

        } catch (e) {
          console.error('ERROR: Failed to parse or process SSE chunk:', jsonString, e);
        }
      }
    },
  });
}

/**
 * This function creates a TransformStream that reads an SSE stream from your backend,
 * parses the text content, and re-formats it into the Vercel AI SDK stream format.
 */
// function createAiSdkTransformStream() {
//   const decoder = new TextDecoder();
//   const encoder = new TextEncoder();

//   return new TransformStream({
//     async transform(chunk, controller) {
//       // Decode the SSE chunk from your backend
//       const sseString = decoder.decode(chunk, { stream: true });

//       // An SSE chunk can contain multiple "data:" events
//       const lines = sseString.split('\n\n').filter((line) => line.trim().startsWith('data:'));

//       for (const line of lines) {
//         const jsonString = line.substring(6); // Remove "data: " prefix
//         try {
//           const parsed = JSON.parse(jsonString);
          
//           // Extract the text chunk from your backend's specific JSON structure
//           if (parsed.content?.parts?.[0]?.text && parsed.partial === true) {
//             const textChunk = parsed.content.parts[0].text;

//             // Format for Vercel AI SDK: `0:"<json_stringified_text>"\n`
//             const formattedChunk = `0:${JSON.stringify(textChunk)}\n`;
            
//             // Enqueue the transformed and encoded chunk
//             console.log('Enqueuing chunk:', formattedChunk);
//             controller.enqueue(encoder.encode(formattedChunk));
//           }
//         } catch (e) {
//           console.error('Failed to parse SSE chunk:', jsonString, e);
//         }
//       }
//     },
//   });
// }
