import { NextRequest, NextResponse } from "next/server";

const TEXT_PREFIX = "0:"; // vercel ai text prefix
const ANNOTATION_PREFIX = "8:"; // vercel ai annotation prefix

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const agentServerUrlBase = process.env.NEXT_PUBLIC_AGENT_SERVER_URL;
  if (!agentServerUrlBase) {
    return NextResponse.json(
      {
        detail: "NEXT_PUBLIC_AGENT_SERVER_URL environment variable is not set.",
      },
      { status: 500 }
    );
  }

  try {
    const {
      appName,
      messages,
      userId,
      sessionId,
      stream = true,
    } = await request.json();
    const lastMessage = messages.at(-1);
    const messageText =
      lastMessage.content || lastMessage.parts?.[0]?.text || "";

    // Determine endpoint based on stream mode
    const endpoint = stream ? "/run_sse" : "/run";

    // 1. Call agent backend
    const backendResponse = await fetch(`${agentServerUrlBase}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": "default_user",
        "X-User-Roles": "admin",
      },
      body: JSON.stringify({
        appName: appName,
        userId: userId,
        sessionId: sessionId,
        new_message: {
          role: "user",
          parts: [{ text: messageText }],
        },
        // streaming: stream,
      }),
    });

    // Handle non-streaming response
    if (!stream) {
      const data = await backendResponse.json();
      const encoder = new TextEncoder();
      let responseText = "";

      // Extract text from ADK response format (exclude thinking content)
      const parts = data.content?.parts || [];
      for (const part of parts) {
        if (part.text && !part.thought) {
          responseText += part.text;
        }
      }

      const formattedResponse = `${TEXT_PREFIX}${JSON.stringify(
        responseText
      )}\n`;

      // Also send thinking, function calls/responses as annotations
      let annotationChunks = "";
      for (const part of parts) {
        if (part.text && part.thought) {
          const annotationPayload = {
            type: "thinking",
            data: { text: part.text },
          };
          annotationChunks += `${ANNOTATION_PREFIX}${JSON.stringify([
            annotationPayload,
          ])}\n`;
        } else if (part.functionCall) {
          const annotationPayload = {
            type: "functionCall",
            data: part.functionCall,
          };
          annotationChunks += `${ANNOTATION_PREFIX}${JSON.stringify([
            annotationPayload,
          ])}\n`;
        } else if (part.functionResponse) {
          const annotationPayload = {
            type: "functionResponse",
            data: part.functionResponse,
          };
          annotationChunks += `${ANNOTATION_PREFIX}${JSON.stringify([
            annotationPayload,
          ])}\n`;
        }
      }

      return new Response(
        encoder.encode(formattedResponse + annotationChunks),
        {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "X-Vercel-AI-Data-Stream": "v1",
          },
        }
      );
    }

    if (!backendResponse.body) {
      throw new Error("The backend response does not contain a body.");
    }

    // 2. Create the transform stream and pipe the backend response through it
    const aiSdkStream = backendResponse.body.pipeThrough(
      createAiSdkTransformStream()
    );

    // 3. Return the transformed stream in the response
    return new Response(aiSdkStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Vercel-AI-Data-Stream": "v1",
        Connection: "keep-alive",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    const detail = (error as Error).message;
    return NextResponse.json({ detail }, { status: 500 });
  }
}

/**
 * This function creates a TransformStream that reads an SSE stream from your backend,
 * parses it, and re-formats it into the Vercel AI SDK stream format.
 * It handles four types of content:
 * 1. Thinking content (parts with thought:true, sent as annotations with type "thinking")
 * 2. Text chunks (prefix `0:`)
 * 3. Function Calls (as annotations via the data stream, prefix `8:`)
 * 4. Function Responses (as annotations via the data stream, prefix `8:`)
 */
function createAiSdkTransformStream() {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new TransformStream({
    async transform(chunk, controller) {
      const sseString = decoder.decode(chunk, { stream: true });
      const lines = sseString
        .split("\n\n")
        .filter((line) => line.trim().startsWith("data:"));

      for (const line of lines) {
        const jsonString = line.substring(6).trim();
        if (!jsonString) continue;

        // Skip [DONE] marker
        if (jsonString === "[DONE]") continue;

        console.log("RAW SSE JSON from backend:", jsonString);

        try {
          const parsed = JSON.parse(jsonString);

          const parts = parsed.content?.parts;
          if (!parts) continue; // Skip if there are no parts
          parts.forEach(
            (part: { text: any; thought?: boolean; functionCall: any; functionResponse: any }) => {
              // Case 1: Handle thinking content (thought: true)
              if (part.text && part.thought) {
                const annotationPayload = {
                  type: "thinking",
                  data: { text: part.text },
                };
                const formattedChunk = `${ANNOTATION_PREFIX}${JSON.stringify([
                  annotationPayload,
                ])}\n`;
                controller.enqueue(encoder.encode(formattedChunk));
              }
              // Case 2: Handle a regular text chunk
              else if (part.text) {
                const formattedChunk = `${TEXT_PREFIX}${JSON.stringify(
                  part.text
                )}\n`;
                controller.enqueue(encoder.encode(formattedChunk));
              }
              // Case 3: Handle a function call
              else if (part.functionCall) {
                const annotationPayload = {
                  type: "functionCall",
                  data: part.functionCall,
                };
                const formattedChunk = `${ANNOTATION_PREFIX}${JSON.stringify([
                  annotationPayload,
                ])}\n`;
                controller.enqueue(encoder.encode(formattedChunk));
              }
              // Case 4: Handle a function response
              else if (part.functionResponse) {
                const annotationPayload = {
                  type: "functionResponse",
                  data: part.functionResponse,
                };
                const formattedChunk = `${ANNOTATION_PREFIX}${JSON.stringify([
                  annotationPayload,
                ])}\n`;
                controller.enqueue(encoder.encode(formattedChunk));
              }
            }
          );
        } catch (e) {
          console.error("Failed to parse or process SSE chunk:", jsonString, e);
        }
      }
    },
  });
}
