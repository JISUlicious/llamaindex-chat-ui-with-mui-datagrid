"use client";

import { useChatMessage, getAnnotationData } from "@llamaindex/chat-ui";

interface ToolCallData {
  id: string;
  args: Object;
  name: string;
}
interface ToolResponseData {
  id: string;
  response: {
    result: null | {
      status: "success" | "error";
      message: null | String;
      data: null | Object;
    };
  };
  name: string;
}
interface ThinkingData {
  text: string;
}

// A custom annotation component that is used to display function calling information in a chat message
// The data is extracted from annotations in the message that has type 'functionCall' or 'functionResponse'
export function ToolCallAnnotation() {
  const { message } = useChatMessage();
  const toolData = getAnnotationData<ToolCallData>(message, "functionCall");

  if (toolData.length === 0) return null;
  return (
    <>
      {toolData.map((data, idx) => (
        <ToolCallCard key={data.id || idx} data={data} />
      ))}
    </>
  );
}

export function ToolResponseAnnotation() {
  const { message } = useChatMessage();
  const toolData = getAnnotationData<ToolResponseData>(
    message,
    "functionResponse"
  );

  if (toolData.length === 0) return null;
  return (
    <>
      {toolData.map((data, idx) => (
        <ToolResponseCard key={data.id || idx} data={data} />
      ))}
    </>
  );
}

export function ThinkingAnnotation() {
  const { message } = useChatMessage();
  const thinkingData = getAnnotationData<ThinkingData>(message, "thinking");

  if (thinkingData.length === 0) return null;
  return (
    <>
      {thinkingData.map((data, idx) => (
        <ThinkingCard key={idx} data={data} />
      ))}
    </>
  );
}

function ToolCallCard({ data }: { data: ToolCallData }) {
  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
      <div className="flex items-center gap-3">
        <span className="text-md">{"🛠️"}</span>
        <div className="flex-1">
          <h3 className="font-semibold text-purple-900">{data.name}</h3>
        </div>
      </div>
    </div>
  );
}

function ToolResponseCard({ data }: { data: ToolResponseData }) {
  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
      <div className="flex items-center gap-3">
        <span className="text-md">
          {data.response.result?.status === "error"
            ? "❎"
            : "✅"}
        </span>
        <div className="flex-1">
          <h3 className="font-semibold text-purple-900">{data.name}</h3>
        </div>
      </div>
    </div>
  );
}

function ThinkingCard({ data }: { data: ThinkingData }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-start gap-3">
        <span className="text-md">{"💭"}</span>
        <div className="flex-1">
          <p className="text-sm text-gray-600 italic whitespace-pre-wrap">{data.text}</p>
        </div>
      </div>
    </div>
  );
}
