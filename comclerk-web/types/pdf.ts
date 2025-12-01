// [COMCLERK-ADDED] 2024-12-01: PDF 관련 타입 정의

export interface PDFFileData {
  name: string
  size: number
  data?: ArrayBuffer
  file: File
  path: string
}

export interface PDFViewerProps {
  fileUrl?: string | null
  url?: string
  pdfData?: ArrayBuffer | null
  className?: string
  onError?: (error: Error) => void
  onLoadingChange?: (isLoading: boolean) => void
}

export interface FileUploadProps {
  onFolderSelect?: (files: PDFFileData[]) => void
  onError?: (error: string) => void
  maxFileSize?: number
  className?: string
}

export interface FileUploadRef {
  triggerFolderSelect: () => void
}

export interface FileListProps {
  files: PDFFileData[]
  selectedFile: PDFFileData | null
  onFileSelect: (file: PDFFileData) => void
  onLoadFile: (file: PDFFileData) => Promise<PDFFileData>
  className?: string
}
