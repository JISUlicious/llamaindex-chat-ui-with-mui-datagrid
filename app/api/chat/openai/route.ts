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
import { NextRequest, NextResponse } from "next/server";

const TEXT_PREFIX = "0:"; // vercel ai text prefix
const ANNOTATION_PREFIX = "8:"; // vercel ai annotation prefix

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_OPENAI_API_BASE_URL || "https://api.openai.com/v1";
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  const model = process.env.NEXT_PUBLIC_OPENAI_MODEL || "gpt-4o";

  if (!apiKey) {
    return NextResponse.json(
      { detail: "OPENAI_API_KEY environment variable is not set." },
      { status: 500 }
    );
  }

  try {
    const {
      messages,
      temperature,
      max_tokens,
      stream = true,
    } = await request.json();

    // Transform messages to OpenAI format
    const openaiMessages = messages.map(
      (msg: { role: string; content: string; parts?: { text: string }[] }) => ({
        role: msg.role,
        content: msg.content || msg.parts?.[0]?.text || "",
      })
    );

    // Call OpenAI-compatible API
    const response = await fetch(`${apiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-User-Id": "default_user",
        "X-User-Roles": "admin",
      },
      body: JSON.stringify({
        model,
        messages: openaiMessages,
        stream,
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens ?? 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      return NextResponse.json(
        { detail: `OpenAI API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    // Handle non-streaming response
    if (!stream) {
      const data = await response.json();
      const message = data.choices?.[0]?.message;
      const content = message?.content || "";
      const encoder = new TextEncoder();

      let responseChunks = "";

      // Add text content
      if (content) {
        responseChunks += `${TEXT_PREFIX}${JSON.stringify(content)}\n`;
      }

      // Handle tool calls in non-streaming response
      if (message?.tool_calls) {
        for (const toolCall of message.tool_calls) {
          let parsedArgs: object = {};
          try {
            parsedArgs = JSON.parse(toolCall.function?.arguments || "{}");
          } catch {
            // Keep as empty object if parsing fails
          }

          const annotationPayload = {
            type: "functionCall",
            data: {
              id: toolCall.id,
              name: toolCall.function?.name,
              args: parsedArgs,
            },
          };
          responseChunks += `${ANNOTATION_PREFIX}${JSON.stringify([
            annotationPayload,
          ])}\n`;
        }
      }

      return new Response(encoder.encode(responseChunks), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-Vercel-AI-Data-Stream": "v1",
        },
      });
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    // Transform the OpenAI SSE stream to Vercel AI SDK format
    const aiSdkStream = response.body.pipeThrough(
      createOpenAIToAiSdkTransformStream()
    );

    return new Response(aiSdkStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Vercel-AI-Data-Stream": "v1",
        Connection: "keep-alive",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error in OpenAI route:", error);
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
 *
 * Note: OpenAI streams tool calls in chunks - name comes first, then arguments are streamed.
 * We accumulate tool call data and emit annotations when the stream ends.
 */
function createOpenAIToAiSdkTransformStream() {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  // Accumulator for tool calls (OpenAI streams them in pieces)
  const toolCallAccumulator: Record<
    number,
    { id: string; name: string; arguments: string }
  > = {};

  const emitToolCalls = (controller: TransformStreamDefaultController) => {
    const indices = Object.keys(toolCallAccumulator).map(Number);
    for (const index of indices) {
      const toolCall = toolCallAccumulator[index];
      if (toolCall.name) {
        let parsedArgs: object = {};
        try {
          parsedArgs = JSON.parse(toolCall.arguments || "{}");
        } catch {
          // Keep as empty object if parsing fails
        }

        const annotationPayload = {
          type: "functionCall",
          data: {
            id: toolCall.id,
            name: toolCall.name,
            args: parsedArgs,
          },
        };
        const formattedChunk = `${ANNOTATION_PREFIX}${JSON.stringify([
          annotationPayload,
        ])}\n`;
        controller.enqueue(encoder.encode(formattedChunk));
      }
      delete toolCallAccumulator[index];
    }
  };

  return new TransformStream({
    async transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });

      // Process complete SSE events (separated by double newlines)
      const events = buffer.split("\n");
      buffer = "";

      for (let i = 0; i < events.length; i++) {
        const line = events[i];

        // Keep incomplete lines in buffer
        if (i === events.length - 1 && !line.endsWith("\n") && line !== "") {
          buffer = line;
          continue;
        }

        const trimmedLine = line.trim();
        if (!trimmedLine || !trimmedLine.startsWith("data:")) {
          continue;
        }

        const dataContent = trimmedLine.slice(5).trim();

        // Handle stream end - emit accumulated tool calls
        if (dataContent === "[DONE]") {
          emitToolCalls(controller);
          continue;
        }

        try {
          const parsed = JSON.parse(dataContent);
          const choice = parsed.choices?.[0];
          const delta = choice?.delta;
          const finishReason = choice?.finish_reason;

          if (delta?.content) {
            const formattedChunk = `${TEXT_PREFIX}${JSON.stringify(
              delta.content
            )}\n`;
            controller.enqueue(encoder.encode(formattedChunk));
          }

          // Accumulate tool calls (they come in chunks)
          if (delta?.tool_calls) {
            for (const toolCall of delta.tool_calls) {
              const index = toolCall.index ?? 0;
              if (!toolCallAccumulator[index]) {
                toolCallAccumulator[index] = {
                  id: "",
                  name: "",
                  arguments: "",
                };
              }
              const existing = toolCallAccumulator[index];

              if (toolCall.id) {
                existing.id = toolCall.id;
              }
              if (toolCall.function?.name) {
                existing.name = toolCall.function.name;
              }
              if (toolCall.function?.arguments) {
                existing.arguments += toolCall.function.arguments;
              }
            }
          }

          // Emit tool calls when finish_reason is 'tool_calls'
          if (finishReason === "tool_calls") {
            emitToolCalls(controller);
          }
        } catch (e) {
          // Skip invalid JSON lines (common in SSE streams)
          console.debug("Skipping non-JSON SSE line:", trimmedLine);
        }
      }
    },

    flush(controller) {
      // Process any remaining buffer content
      if (buffer.trim()) {
        const trimmedLine = buffer.trim();
        if (trimmedLine.startsWith("data:")) {
          const dataContent = trimmedLine.slice(5).trim();
          if (dataContent !== "[DONE]") {
            try {
              const parsed = JSON.parse(dataContent);
              const delta = parsed.choices?.[0]?.delta;
              if (delta?.content) {
                const formattedChunk = `${TEXT_PREFIX}${JSON.stringify(
                  delta.content
                )}\n`;
                controller.enqueue(encoder.encode(formattedChunk));
              }
            } catch (e) {
              // Ignore parse errors in flush
            }
          }
        }
      }

      // Emit any remaining accumulated tool calls
      emitToolCalls(controller);
    },
  });
}
