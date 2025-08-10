'use client'

import { useChatMessage, getAnnotationData } from '@llamaindex/chat-ui'

interface ToolCallData {
  id: string
  args: Object
  name: string
}
interface ToolResponseData {
  id: string
  response: Object
  name: string
}

// A custom annotation component that is used to display function calling information in a chat message
// The data is extracted from annotations in the message that has type 'functionCall' or 'functionResponse'
export function ToolCallAnnotation() {
  const { message } = useChatMessage()
  console.log("message", message);
  const toolData = getAnnotationData<ToolCallData>(message, 'functionCall')
  console.log("toolData", toolData);
  if (toolData.length === 0) return null
  return <ToolCard data={toolData[0]} isResponse={false}/>
}

export function ToolResponseAnnotation() {
  const { message } = useChatMessage()
  const toolData = getAnnotationData<ToolResponseData>(message, 'functionResponse')

  if (toolData.length === 0) return null
  return <ToolCard data={toolData[0]} isResponse={true}/>
}

function ToolCard({ data, isResponse }: { data: ToolCallData | ToolResponseData; isResponse: boolean }) {
  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
      <div className="flex items-center gap-3">
          <span className="text-md">
            {isResponse ? '✅' : '🛠️'}
          </span>
        <div className="flex-1">
          <h3 className="font-semibold text-purple-900">{data.name}</h3>
        </div>
      </div>
    </div>
  )
}
