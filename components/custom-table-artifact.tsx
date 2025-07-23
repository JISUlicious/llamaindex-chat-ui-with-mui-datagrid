import * as react_jsx_runtime from "react/jsx-runtime";
import { Artifact, useChatCanvas } from "@llamaindex/chat-ui";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useState } from "react";
import { ChatCanvas } from "@llamaindex/chat-ui";
import { FileText } from "lucide-react";
import { Box } from "@mui/material";
import { TableArtifact, TableArtifactViewerProps } from "@/types/custom";

function TableArtifactViewer({
  className,
  children,
}: TableArtifactViewerProps) {
  const { displayedArtifact, updateArtifact } = useChatCanvas();
  const [updatedContent, setUpdatedContent] = useState();
  if ((displayedArtifact == null ? void 0 : displayedArtifact.type) !== "table")
    return null;
  const tableArtifact = displayedArtifact as TableArtifact;
  const {
    data: { rows, title, columns, type },
  } = tableArtifact;

  return (
    <div className={"flex min-h-0 flex-1 flex-col " + className}>
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="flex items-center gap-3 text-gray-600">
          <FileText className="text-primary size-8"></FileText>
          <div className="flex flex-col">
            <div className="text font-semibold">{title}</div>
            <div className="text-xs text-gray-500">{type}</div>
          </div>
        </h3>
        <ChatCanvas.Actions></ChatCanvas.Actions>
      </div>
      <div className="relative mx-20 flex min-h-0 flex-1 flex-col items-stretch gap-4 py-2">
        {children != null ? (
          children
        ) : (
          <Box sx={{ height: 400, width: "100%" }}>
            <DataGrid
              columns={columns}
              rows={rows}
              checkboxSelection
              disableRowSelectionOnClick
            />
          </Box>
        )}
      </div>
    </div>
  );
}

export { TableArtifactViewer };
