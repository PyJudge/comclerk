// [COMCLERK-ADDED] 2024-12-01: 워크스페이스 클라이언트 컴포넌트
// [COMCLERK-MODIFIED] 2025-12-02: 세션 드롭다운 메뉴 추가, 생성 중 스피너 추가

'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useSessions, useCreateSession, useDeleteSession, useUpdateSession } from '@/hooks'
import { Settings, ChevronDown, Trash2, Plus, Loader2, Pencil, Check, X } from 'lucide-react'
import { useChatStore } from '@/stores/chat-store'
import Link from 'next/link'
import { ChatContainer } from '@/components/chat/chat-container'
import { PDFViewer, FileList } from '@/components/pdf'
import { usePanelResize } from '@/hooks/use-panel-resize'
import type { PDFFileMeta, PDFFileData } from '@/types/pdf'

interface WorkspaceClientProps {
  initialFiles: PDFFileMeta[]
}

export default function WorkspaceClient({ initialFiles }: WorkspaceClientProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isGenerating = useChatStore((state) => state.isGenerating)

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
  const deleteSession = useDeleteSession()
  const updateSession = useUpdateSession()
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [sessionInitAttempted, setSessionInitAttempted] = useState(false)
  const [sessionDropdownOpen, setSessionDropdownOpen] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editingTitle, setEditingTitle] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  // 현재 세션 정보
  const currentSession = useMemo(
    () => sessions?.find((s) => s.id === currentSessionId),
    [sessions, currentSessionId]
  )
  const currentSessionTitle = currentSession?.title || '새 채팅'

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSessionDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 새 채팅 생성
  const handleNewChat = useCallback(async () => {
    setSessionDropdownOpen(false)
    try {
      const session = await createSession.mutateAsync('새 채팅')
      setCurrentSessionId(session.id)
    } catch (error) {
      console.error('Failed to create session:', error)
      toast.error('채팅 생성에 실패했습니다')
    }
  }, [createSession])

  // 세션 선택
  const handleSelectSession = useCallback((sessionId: string) => {
    setSessionDropdownOpen(false)
    setCurrentSessionId(sessionId)
  }, [])

  // 세션 삭제
  const handleDeleteSession = useCallback(
    async (e: React.MouseEvent, sessionId: string) => {
      e.stopPropagation() // 드롭다운 항목 클릭 방지
      try {
        await deleteSession.mutateAsync(sessionId)
        const remaining = sessions?.filter((s) => s.id !== sessionId)

        // 삭제된 세션이 현재 세션이면 다른 세션 선택
        if (sessionId === currentSessionId) {
          if (remaining && remaining.length > 0) {
            setCurrentSessionId(remaining[0].id)
          } else {
            // 세션이 모두 삭제되면 자동으로 새 채팅 생성
            setSessionDropdownOpen(false)
            const newSession = await createSession.mutateAsync('새 채팅')
            setCurrentSessionId(newSession.id)
            return
          }
        }
      } catch (error) {
        console.error('Failed to delete session:', error)
        toast.error('채팅 삭제에 실패했습니다')
      }
    },
    [deleteSession, currentSessionId, sessions, createSession]
  )

  // 제목 편집 시작
  const handleStartEditTitle = useCallback(() => {
    setEditingTitle(currentSessionTitle)
    setIsEditingTitle(true)
    // Focus input after state update
    setTimeout(() => titleInputRef.current?.focus(), 0)
  }, [currentSessionTitle])

  // 제목 저장
  const handleSaveTitle = useCallback(async () => {
    if (!currentSessionId || !editingTitle.trim()) return

    try {
      await updateSession.mutateAsync({ id: currentSessionId, title: editingTitle.trim() })
      setIsEditingTitle(false)
    } catch (error) {
      console.error('Failed to update session title:', error)
      toast.error('제목 변경에 실패했습니다')
    }
  }, [currentSessionId, editingTitle, updateSession])

  // 제목 편집 취소
  const handleCancelEditTitle = useCallback(() => {
    setIsEditingTitle(false)
    setEditingTitle('')
  }, [])

  // 제목 입력 키 핸들러
  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveTitle()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEditTitle()
    }
  }, [handleSaveTitle, handleCancelEditTitle])

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
        <div className="h-[65px] px-4 border-b border-zinc-800 bg-zinc-900 flex items-center">
          <div className="flex items-center justify-between w-full">
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
        <div className="h-[65px] px-4 border-b border-zinc-800 bg-zinc-900 flex items-center">
          <div className="flex items-center justify-between w-full">
            {/* 세션 제목 (편집 가능) */}
            <div className="relative flex items-center gap-2" ref={dropdownRef}>
              {isEditingTitle ? (
                // 편집 모드
                <div className="flex items-center gap-1">
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={handleTitleKeyDown}
                    onBlur={handleSaveTitle}
                    className="text-lg font-semibold bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[240px]"
                    data-testid="session-title-input"
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="p-1 rounded hover:bg-zinc-700 text-green-400"
                    title="저장 (Enter)"
                    data-testid="save-title-button"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancelEditTitle}
                    className="p-1 rounded hover:bg-zinc-700 text-zinc-400"
                    title="취소 (ESC)"
                    data-testid="cancel-edit-button"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                // 표시 모드
                <>
                  <button
                    onClick={() => setSessionDropdownOpen(!sessionDropdownOpen)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors',
                      'hover:bg-zinc-800 text-zinc-100'
                    )}
                    data-testid="session-dropdown-trigger"
                  >
                    <span className="text-lg font-semibold truncate max-w-[240px]">
                      {currentSessionTitle}
                    </span>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 transition-transform',
                        sessionDropdownOpen && 'rotate-180'
                      )}
                    />
                  </button>
                  <button
                    onClick={handleStartEditTitle}
                    className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                    title="제목 편집"
                    data-testid="edit-title-button"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* 드롭다운 메뉴 */}
              {sessionDropdownOpen && (
                <div
                  className="absolute top-full left-0 mt-1 w-64 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-50 overflow-hidden"
                  data-testid="session-dropdown-menu"
                >
                  {/* 세션 목록 */}
                  <div className="max-h-60 overflow-y-auto">
                    {sessions && sessions.length > 0 ? (
                      sessions.map((session) => (
                        <div
                          key={session.id}
                          onClick={() => handleSelectSession(session.id)}
                          className={cn(
                            'flex items-center justify-between px-3 py-2 cursor-pointer transition-colors',
                            session.id === currentSessionId
                              ? 'bg-blue-600/20 text-blue-400'
                              : 'hover:bg-zinc-700 text-zinc-300'
                          )}
                          data-testid={`session-item-${session.id}`}
                        >
                          <span className="truncate flex-1 text-sm">
                            {session.title || '제목 없음'}
                          </span>
                          <button
                            onClick={(e) => handleDeleteSession(e, session.id)}
                            className="p-1 rounded hover:bg-zinc-600 text-zinc-400 hover:text-red-400 transition-colors ml-2"
                            title="삭제"
                            data-testid={`delete-session-${session.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center text-zinc-500 text-sm">
                        채팅 기록이 없습니다
                      </div>
                    )}
                  </div>

                  {/* 구분선 */}
                  <div className="border-t border-zinc-700" />

                  {/* 새 채팅 버튼 */}
                  <button
                    onClick={handleNewChat}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-blue-400 hover:bg-zinc-700 transition-colors"
                    data-testid="new-chat-button"
                  >
                    <Plus className="w-4 h-4" />
                    새 채팅
                  </button>
                </div>
              )}
            </div>

            {/* 생성 중 스피너 + 설정 버튼 */}
            <div className="flex items-center gap-2">
              {isGenerating && (
                <div className="flex items-center gap-1.5 text-blue-400" title="AI 응답 생성 중...">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">생성 중</span>
                </div>
              )}
              <Link
                href="/settings"
                data-testid="settings-button"
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100'
                )}
                title="설정"
              >
                <Settings className="w-4 h-4" />
              </Link>
            </div>
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
