"use client";

import {
  ChatCanvas,
  ChatInput,
  ChatMessage,
  ChatMessages,
  ChatSection,
  toInlineAnnotation,
  useChatCanvas,
  useChatUI,
} from "@llamaindex/chat-ui";
import { Message, useChat } from "@ai-sdk/react";
import { WeatherAnnotation } from "../components/custom-weather";
import { WikiCard } from "../components/custom-wiki";
import { TableArtifactViewer } from "@/components/custom-table-artifact";

const initialMessages: Message[] = [
  {
    id: "1",
    content: "Hello! How can I help you today???",
    role: "assistant",
  },
];

export default function Page(): JSX.Element {
  return (
    <div className="flex h-screen flex-col">
      <header className="w-full border-b p-4 text-center">
        <h1 className="text-2xl font-bold">
          LlamaIndex Chat UI - Next.js Example
        </h1>
        <p className="text-gray-600">
          A simple chat interface using @llamaindex/chat-ui
        </p>
      </header>
      <div className="min-h-0 flex-1">
        <ChatExample />
      </div>
    </div>
  );
}

function ChatExample() {
  const handler = useChat({
    // api: '/api/chat',

    // uncomment this to try edge runtime example in app/api/chat/edge/route.ts
    // api: '/api/chat/edge',

    // uncomment this to try advanced example in app/api/chat/advanced/route.ts
    // api: "/api/chat/advanced",

    // uncomment this to try table data example in app/api/chat/table_annotation_example/route.ts
    // api: 'api/chat/table_annotation_example',

    // uncomment this to try table data example in app/api/chat/table_artifact_example/route.ts
    api: "api/chat/table_artifact_example",

    initialMessages,
  });

  return (
    <ChatSection
      handler={handler}
      className="block h-full flex-row gap-4 p-0 md:flex md:p-5"
    >
      <div className="md:max-w-1/2 mx-auto flex h-full min-w-0 max-w-full flex-1 flex-col gap-4">
        <ChatMessages>
          <ChatMessages.List className="px-4 py-6">
            <CustomChatMessages />
          </ChatMessages.List>
        </ChatMessages>
        <div className="border-t p-4">
          <ChatInput>
            <ChatInput.Form>
              <ChatInput.Field placeholder="Type your message..." />
              <ChatInput.Submit />
            </ChatInput.Form>
          </ChatInput>
        </div>
      </div>
      <ChatCanvas className="w-full md:w-2/3">
        <ChatCanvas.DocumentArtifact />
        <ChatCanvas.CodeArtifact />
        <TableArtifactViewer />
      </ChatCanvas>
    </ChatSection>
  );
}

function CustomChatMessages() {
  const { messages, isLoading, append } = useChatUI();

  return (
    <>
      {messages.map((message, index) => (
        <ChatMessage
          key={index}
          message={message}
          isLast={index === messages.length - 1}
          className="mb-4"
        >
          <ChatMessage.Avatar>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">
              {message.role === "user" ? "U" : "AI"}
            </div>
          </ChatMessage.Avatar>
          <ChatMessage.Content isLoading={isLoading} append={append}>
            <ChatMessage.Content.Markdown
              annotationRenderers={{
                // these annotations are rendered inline with the Markdown text
                artifact: ChatCanvas.Artifact,
                wiki: WikiCard,
              }}
            />

            {/* annotation components under the Markdown text */}
            <WeatherAnnotation />
            {/* <TableAnnotation /> */}
            <ChatMessage.Content.Source />
          </ChatMessage.Content>
          <ChatMessage.Actions />
        </ChatMessage>
      ))}
    </>
  );
}
