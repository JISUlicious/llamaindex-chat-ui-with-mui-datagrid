'use client'

import { useChatMessage, getAnnotationData } from '@llamaindex/chat-ui'
import Box from '@mui/material/Box';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

interface TableData {
  title: string
  rows: Array<Object>
  columns: GridColDef<Object>[]
}

// A custom annotation component that is used to display Table information in a chat message
// The Table data is extracted from annotations in the message that has type 'Table'
export function TableAnnotation() {
  const { message } = useChatMessage()
  const tableData = getAnnotationData<TableData>(message, 'table')

  if (tableData.length === 0) return null
  return <TableCard data={tableData[0]} />
}

function TableCard({ data }: { data: TableData }) {
  return (
    <Box sx={{ height: 400, width: '100%' }}>
      <DataGrid 
        columns={data.columns}
        rows={data.rows}
        checkboxSelection
        disableRowSelectionOnClick
      />
    </Box>
  )
}
