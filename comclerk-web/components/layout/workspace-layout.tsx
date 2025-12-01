// [COMCLERK-ADDED] 2024-12-01: 3패널 워크스페이스 레이아웃

'use client'

import { useRef, useCallback, useState, ReactNode } from 'react'
import { FolderOpen } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { usePanelResize } from '@/hooks/use-panel-resize'
import { PDFViewer, FileUpload, FileList } from '@/components/pdf'
import type { PDFFileData, FileUploadRef } from '@/types/pdf'

interface WorkspaceLayoutProps {
  children?: ReactNode // 우측 패널에 들어갈 채팅 컴포넌트
  className?: string
}

export function WorkspaceLayout({ children, className }: WorkspaceLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const fileUploadRef = useRef<FileUploadRef>(null)

  const { leftPanelWidth, rightPanelWidth, isDragging, handleMouseDown } = usePanelResize(
    containerRef as React.RefObject<HTMLDivElement>
  )

  const [pdfFiles, setPdfFiles] = useState<PDFFileData[]>([])
  const [selectedFile, setSelectedFile] = useState<PDFFileData | null>(null)

  // 지연 로딩: 선택된 파일의 ArrayBuffer 로드
  const loadFileData = useCallback(async (fileData: PDFFileData): Promise<PDFFileData> => {
    if (fileData.data) {
      return fileData
    }

    try {
      const arrayBuffer = await fileData.file.arrayBuffer()
      const loadedFile = {
        ...fileData,
        data: arrayBuffer,
      }

      // 파일 목록 업데이트
      setPdfFiles((prev) => prev.map((f) => (f.path === loadedFile.path ? loadedFile : f)))

      return loadedFile
    } catch {
      toast.error(`파일 로딩 실패: ${fileData.name}`)
      throw new Error(`파일 로딩 실패: ${fileData.name}`)
    }
  }, [])

  // 폴더 선택 처리
  const handleFolderSelect = useCallback(
    (files: PDFFileData[]) => {
      setPdfFiles(files)

      // 첫 번째 파일을 자동 선택하고 로드
      if (files.length > 0) {
        const firstFile = files[0]
        setSelectedFile(firstFile)

        loadFileData(firstFile)
          .then((loadedFile) => {
            setSelectedFile(loadedFile)
          })
          .catch(() => {
            // 에러는 loadFileData에서 이미 토스트로 처리됨
          })
      }
    },
    [loadFileData]
  )

  // 폴더 선택 에러 처리
  const handleFolderError = useCallback((error: string) => {
    toast.error(error)
  }, [])

  // 파일 선택 처리
  const handleFileSelect = useCallback((file: PDFFileData) => {
    setSelectedFile(file)
  }, [])

  return (
    <div className={cn('h-screen flex bg-zinc-950', className)} ref={containerRef} data-testid="main-layout">
      {/* 왼쪽 사이드바 - PDF 목록 */}
      <div
        className="border-r border-zinc-800 bg-zinc-900 flex flex-col transition-all duration-200 ease-out flex-shrink-0"
        style={{ width: `${leftPanelWidth}px` }}
        data-testid="left-panel"
      >
        {/* 헤더 */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-100">PDF 목록</h2>
            <div className="flex gap-2">
              <button
                className="hidden md:flex items-center justify-center p-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                onClick={() => fileUploadRef.current?.triggerFolderSelect()}
                title="폴더 선택 (데스크톱 전용)"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 파일 목록 */}
        <div className="flex-1 min-h-0">
          {pdfFiles.length === 0 ? (
            <div className="text-center py-8 px-4 hidden md:block">
              <p className="text-zinc-500 text-sm mb-4">PDF 폴더를 선택하세요</p>
              <button
                className="flex items-center gap-2 mx-auto px-4 py-2 border border-zinc-700 rounded-md text-zinc-300 hover:bg-zinc-800 transition-colors"
                onClick={() => fileUploadRef.current?.triggerFolderSelect()}
              >
                <FolderOpen className="w-4 h-4" />
                폴더 선택
              </button>
            </div>
          ) : (
            <FileList
              files={pdfFiles}
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
              onLoadFile={loadFileData}
            />
          )}
        </div>
      </div>

      {/* Left resize handle */}
      <div
        className={cn(
          'w-1 bg-zinc-800 hover:bg-blue-500 cursor-col-resize transition-colors duration-200 relative group flex-shrink-0',
          isDragging === 'left' && 'bg-blue-500'
        )}
        onMouseDown={(e) => handleMouseDown(e, 'left')}
        data-testid="panel-resize-handle-left"
      >
        <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-500/20 transition-colors duration-200" />
      </div>

      {/* 중앙 PDF 뷰어 */}
      <div
        className="bg-zinc-950 transition-all duration-200 ease-out flex-1 min-w-0"
        data-testid="center-panel"
      >
        <PDFViewer pdfData={selectedFile?.data} />
      </div>

      {/* Right resize handle */}
      <div
        className={cn(
          'w-1 bg-zinc-800 hover:bg-blue-500 cursor-col-resize transition-colors duration-200 relative group flex-shrink-0',
          isDragging === 'right' && 'bg-blue-500'
        )}
        onMouseDown={(e) => handleMouseDown(e, 'right')}
        data-testid="panel-resize-handle-right"
      >
        <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-500/20 transition-colors duration-200" />
      </div>

      {/* 오른쪽 채팅 패널 */}
      <div
        className="border-l border-zinc-800 bg-zinc-900 transition-all duration-200 ease-out flex-shrink-0 flex flex-col"
        style={{ width: `${rightPanelWidth}px` }}
        data-testid="right-panel"
      >
        {children}
      </div>

      {/* Hidden FileUpload component - Desktop only */}
      <div className="hidden md:block">
        <FileUpload
          ref={fileUploadRef}
          onFolderSelect={handleFolderSelect}
          onError={handleFolderError}
        />
      </div>
    </div>
  )
}

export default WorkspaceLayout
