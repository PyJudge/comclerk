// [COMCLERK-ADDED] 2024-12-01: 워크스페이스 클라이언트 컴포넌트

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useSessions, useCreateSession, useDeleteAllSessions } from '@/hooks'
import { Plus } from 'lucide-react'
import { ChatContainer } from '@/components/chat/chat-container'
import { PDFViewer, FileList } from '@/components/pdf'
import { usePanelResize } from '@/hooks/use-panel-resize'
import type { PDFFileMeta, PDFFileData } from '@/types/pdf'
import { useRef } from 'react'

interface WorkspaceClientProps {
  initialFiles: PDFFileMeta[]
}

export default function WorkspaceClient({ initialFiles }: WorkspaceClientProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { leftPanelWidth, rightPanelWidth, isDragging, handleMouseDown } = usePanelResize(
    containerRef as React.RefObject<HTMLDivElement>
  )

  // 서버에서 받은 파일 메타를 PDFFileData로 변환
  const pdfFiles = useMemo<PDFFileData[]>(
    () =>
      initialFiles.map((f) => ({
        name: f.name,
        size: f.size,
        path: f.path,
      })),
    [initialFiles]
  )

  const [selectedFile, setSelectedFile] = useState<PDFFileData | null>(
    pdfFiles.length > 0 ? pdfFiles[0] : null
  )
  const [loadedFiles, setLoadedFiles] = useState<Map<string, ArrayBuffer>>(new Map())

  // 세션 관리
  const { data: sessions, isLoading: sessionsLoading } = useSessions()
  const createSession = useCreateSession()
  const deleteAllSessions = useDeleteAllSessions()
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [sessionInitAttempted, setSessionInitAttempted] = useState(false)
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false)

  // 새 채팅 시작 (모든 세션 삭제 후 새 세션 생성)
  const handleNewChat = useCallback(async () => {
    if (isCreatingNewChat) return

    setIsCreatingNewChat(true)
    try {
      // 기존 세션들 삭제
      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map((s) => s.id)
        await deleteAllSessions.mutateAsync(sessionIds)
      }

      // 새 세션 생성
      const session = await createSession.mutateAsync('PDF 분석 세션')
      setCurrentSessionId(session.id)
      toast.success('새 채팅을 시작합니다')
    } catch (error) {
      console.error('Failed to create new chat:', error)
      toast.error('새 채팅 생성 실패')
    } finally {
      setIsCreatingNewChat(false)
    }
  }, [sessions, deleteAllSessions, createSession, isCreatingNewChat])

  // 세션 자동 생성/선택 (한 번만 시도)
  useEffect(() => {
    if (currentSessionId || sessionsLoading || sessionInitAttempted) return

    const initSession = async () => {
      setSessionInitAttempted(true)

      // 세션이 있으면 첫 번째 세션 선택
      if (sessions && sessions.length > 0) {
        setCurrentSessionId(sessions[0].id)
        return
      }

      // 세션이 없으면 자동 생성 (에러 시에도 한 번만 시도)
      try {
        const session = await createSession.mutateAsync('PDF 분석 세션')
        setCurrentSessionId(session.id)
      } catch (error) {
        console.error('Failed to create session:', error)
        toast.error('세션 생성 실패. 백엔드 서버를 확인해주세요.')
      }
    }

    initSession()
  }, [sessions, sessionsLoading, currentSessionId, sessionInitAttempted, createSession])

  // PDF 파일 로드 (fetch로 가져오기)
  const loadFileData = useCallback(
    async (fileData: PDFFileData): Promise<PDFFileData> => {
      // 이미 로드된 파일이면 캐시된 데이터 반환
      const cached = loadedFiles.get(fileData.path)
      if (cached) {
        return { ...fileData, data: cached }
      }

      try {
        const response = await fetch(fileData.path)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const arrayBuffer = await response.arrayBuffer()

        // 캐시에 저장
        setLoadedFiles((prev) => new Map(prev).set(fileData.path, arrayBuffer))

        return { ...fileData, data: arrayBuffer }
      } catch {
        toast.error(`파일 로딩 실패: ${fileData.name}`)
        throw new Error(`파일 로딩 실패: ${fileData.name}`)
      }
    },
    [loadedFiles]
  )

  // 파일 선택 처리
  const handleFileSelect = useCallback(
    async (file: PDFFileData) => {
      setSelectedFile(file)

      // 데이터가 없으면 로드
      if (!file.data && !loadedFiles.has(file.path)) {
        try {
          const loaded = await loadFileData(file)
          setSelectedFile(loaded)
        } catch {
          // 에러는 loadFileData에서 처리됨
        }
      } else if (loadedFiles.has(file.path)) {
        setSelectedFile({ ...file, data: loadedFiles.get(file.path) })
      }
    },
    [loadFileData, loadedFiles]
  )

  // 첫 번째 파일 자동 로드
  useEffect(() => {
    if (pdfFiles.length > 0 && !selectedFile?.data) {
      handleFileSelect(pdfFiles[0])
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="h-screen flex bg-zinc-950" ref={containerRef} data-testid="main-layout">
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
            <span className="text-xs text-zinc-500">{pdfFiles.length}개</span>
          </div>
        </div>

        {/* 파일 목록 */}
        <div className="flex-1 min-h-0">
          {pdfFiles.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-zinc-500 text-sm">PDF 파일이 없습니다</p>
              <p className="text-zinc-600 text-xs mt-2">pdfs/ 폴더에 PDF를 추가하세요</p>
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
      <div className="bg-zinc-950 transition-all duration-200 ease-out flex-1 min-w-0" data-testid="center-panel">
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
        {/* 세션 헤더 */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-100">채팅</h2>
            <button
              onClick={handleNewChat}
              disabled={isCreatingNewChat}
              data-testid="new-chat-button"
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                'bg-blue-600 text-white hover:bg-blue-500',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              title="새 채팅 시작 (기존 대화 삭제)"
            >
              {isCreatingNewChat ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              새 채팅
            </button>
          </div>
        </div>

        {/* 채팅 영역 */}
        <div className="flex-1 min-h-0">
          {sessionsLoading || (!sessionInitAttempted && !currentSessionId) ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4" />
              <p className="text-zinc-500 text-sm">세션 준비 중...</p>
            </div>
          ) : currentSessionId ? (
            <ChatContainer sessionId={currentSessionId} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-medium mb-2 text-zinc-300">백엔드 연결 실패</h3>
              <p className="text-zinc-500 text-sm mb-4">백엔드 서버가 실행 중인지 확인해주세요</p>
              <code className="text-xs text-zinc-600 bg-zinc-800 px-2 py-1 rounded">./start.sh backend</code>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
