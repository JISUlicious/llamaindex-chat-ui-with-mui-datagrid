import '@llamaindex/chat-ui';


type TableArtifact = Artifact<
{
  title: string;
  type: string;
  url: string;
  key: string; // ADK state key
  rows: Array<Object>;
  columns: GridColDef<Object>[];
  sources?: {
    id: string;
  }[];
},
"table"
>;

interface TableArtifactViewerProps {
  className?: string;
  children?: React.ReactNode;
}

declare function TableArtifactViewer({ className, children, }: TableArtifactViewerProps): react_jsx_runtime.JSX.Element | null;

interface CustomArtifactCardProps {
  data: any;
  getTitle: (artifact: any) => any;
  iconMap: any;
}

interface CustomChatCanvasProps {
  className?: string;
  children?: React.ReactNode;
}
