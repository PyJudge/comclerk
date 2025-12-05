// [COMCLERK-ADDED] 2024-12-01: PDF.js 기반 PDF 뷰어 컴포넌트

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PDFViewerProps } from '@/types/pdf'

export function PDFViewer({
  fileUrl,
  url,
  pdfData,
  className,
  onError,
  onLoadingChange,
}: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [pdfjsLib, setPdfjsLib] = useState<typeof import('pdfjs-dist') | null>(null)
  const [pdf, setPdf] = useState<import('pdfjs-dist').PDFDocumentProxy | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const scale = 1.0
  const rotation = 0
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pageInput, setPageInput] = useState('1')

  // PDF.js 동적 로드
  useEffect(() => {
    let mounted = true

    const loadPdfjs = async () => {
      try {
        const pdfjs = await import('pdfjs-dist')
        if (typeof window !== 'undefined') {
          pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`
        }

        if (mounted) {
          setPdfjsLib(pdfjs)
        }
      } catch (err) {
        console.error('PDF.js load error:', err)
        if (mounted) {
          setError('PDF 뷰어를 불러올 수 없습니다. 페이지를 새로고침해주세요.')
        }
      }
    }

    loadPdfjs()

    return () => {
      mounted = false
    }
  }, [])

  // PDF 로드
  const loadPDF = useCallback(
    async (source: string | ArrayBuffer) => {
      if (!pdfjsLib) return

      setIsLoading(true)
      setError(null)
      onLoadingChange?.(true)

      try {
        const loadingTask = pdfjsLib.getDocument(source)
        const pdfDocument = await loadingTask.promise

        setPdf(pdfDocument)
        setTotalPages(pdfDocument.numPages)
        setCurrentPage(1)
        setPageInput('1')
      } catch (err: unknown) {
        let errorMsg = 'PDF 파일을 읽을 수 없습니다.'

        if (err && typeof err === 'object' && 'name' in err) {
          const pdfError = err as { name: string }
          if (pdfError.name === 'InvalidPDFException') {
            errorMsg = '유효하지 않은 PDF 파일입니다.'
          } else if (pdfError.name === 'MissingPDFException') {
            errorMsg = 'PDF 파일을 찾을 수 없습니다.'
          } else if (pdfError.name === 'UnexpectedResponseException') {
            errorMsg = '파일을 다운로드할 수 없습니다.'
          }
        }

        setError(errorMsg)
        setPdf(null)
        onError?.(new Error(errorMsg))
      } finally {
        setIsLoading(false)
        onLoadingChange?.(false)
      }
    },
    [pdfjsLib, onError, onLoadingChange]
  )

  // 페이지 렌더링 (깜빡임 방지를 위한 오프스크린 캔버스 사용)
  const renderPage = useCallback(
    async (pageNumber: number) => {
      if (!pdf || !pdfjsLib) return

      const canvas = canvasRef.current
      if (!canvas) {
        setTimeout(() => renderPage(pageNumber), 50)
        return
      }

      try {
        const page = await pdf.getPage(pageNumber)
        const context = canvas.getContext('2d')

        if (!context) return

        const viewport = page.getViewport({
          scale: scale,
          rotation: rotation,
        })

        // 오프스크린 캔버스에 먼저 렌더링 (깜빡임 방지)
        const offscreenCanvas = document.createElement('canvas')
        offscreenCanvas.width = viewport.width
        offscreenCanvas.height = viewport.height
        const offscreenContext = offscreenCanvas.getContext('2d')

        if (!offscreenContext) return

        const renderContext = {
          canvasContext: offscreenContext,
          viewport: viewport,
        }

        await page.render(renderContext as Parameters<typeof page.render>[0]).promise

        // 렌더링 완료 후 메인 캔버스에 복사 (크기 변경 최소화)
        if (canvas.width !== viewport.width || canvas.height !== viewport.height) {
          canvas.width = viewport.width
          canvas.height = viewport.height
          canvas.style.width = viewport.width + 'px'
          canvas.style.height = viewport.height + 'px'
        }

        context.drawImage(offscreenCanvas, 0, 0)
      } catch {
        // 렌더링 오류는 조용히 처리
      }
    },
    [pdf, pdfjsLib]
  )

  // 파일 URL/ArrayBuffer 변경 시 PDF 로드
  useEffect(() => {
    if (pdfData) {
      loadPDF(pdfData)
    } else if (url || fileUrl) {
      const actualUrl = url || fileUrl
      if (actualUrl) loadPDF(actualUrl)
    } else {
      setPdf(null)
      setError(null)
      setIsLoading(false)
    }
  }, [fileUrl, url, pdfData, loadPDF])

  // 페이지 렌더링
  useEffect(() => {
    if (pdf && canvasRef.current) {
      renderPage(currentPage)
    }
  }, [pdf, currentPage, renderPage])

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!pdf) return

      // 입력 필드에서는 무시
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.key) {
        case 'PageUp':
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault()
          if (currentPage > 1) {
            const newPage = currentPage - 1
            setCurrentPage(newPage)
            setPageInput(newPage.toString())
          }
          break
        case 'PageDown':
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault()
          if (currentPage < totalPages) {
            const newPage = currentPage + 1
            setCurrentPage(newPage)
            setPageInput(newPage.toString())
          }
          break
        case 'Home':
          e.preventDefault()
          setCurrentPage(1)
          setPageInput('1')
          break
        case 'End':
          e.preventDefault()
          setCurrentPage(totalPages)
          setPageInput(totalPages.toString())
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pdf, currentPage, totalPages])

  // 페이지 네비게이션
  const goToPrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1
      setCurrentPage(newPage)
      setPageInput(newPage.toString())
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1
      setCurrentPage(newPage)
      setPageInput(newPage.toString())
    }
  }

  const handlePageInputChange = (value: string) => {
    setPageInput(value)
  }

  const handlePageInputSubmit = () => {
    const pageNumber = parseInt(pageInput, 10)
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    } else {
      setPageInput(currentPage.toString())
    }
  }

  const handlePageInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePageInputSubmit()
    }
  }

  // 빈 상태
  const actualUrl = url || fileUrl
  if (!actualUrl && !pdfData) {
    return (
      <div className={cn('flex items-center justify-center h-full bg-zinc-950', className)}>
        <div className="text-center text-zinc-500">
          <div className="w-20 h-20 mx-auto mb-4 text-zinc-700">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
            </svg>
          </div>
          <p className="text-lg font-medium text-zinc-400">PDF 뷰어</p>
          <p className="text-sm text-zinc-600">폴더를 선택하여 PDF 내용을 확인하세요</p>
        </div>
      </div>
    )
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center h-full bg-zinc-950', className)}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-zinc-400">PDF 파일을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className={cn('flex items-center justify-center h-full bg-zinc-950', className)}>
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="font-medium mb-2 text-red-400">PDF 로딩 오류</p>
          <p className="text-sm text-zinc-500">{error}</p>
          <button
            className="mt-4 px-4 py-2 border border-zinc-700 rounded-md text-zinc-300 hover:bg-zinc-800 transition-colors"
            onClick={() => fileUrl && loadPDF(fileUrl)}
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full bg-zinc-950', className)}>
      {/* 툴바 */}
      <div className="h-[65px] flex items-center justify-center px-4 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-2">
          {/* 페이지 네비게이션 */}
          <button
            className="p-2 border border-zinc-700 rounded-md text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            data-testid="prev-page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2">
            <input
              value={pageInput}
              onChange={(e) => handlePageInputChange(e.target.value)}
              onBlur={handlePageInputSubmit}
              onKeyPress={handlePageInputKeyPress}
              className="w-16 text-center border border-zinc-700 rounded-md px-2 py-1 bg-zinc-800 text-zinc-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              type="number"
              min="1"
              max={totalPages}
              data-testid="page-input"
            />
            <span className="text-sm text-zinc-500" data-testid="page-indicator">
              / {totalPages}
            </span>
          </div>

          <button
            className="p-2 border border-zinc-700 rounded-md text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
            data-testid="next-page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

      </div>

      {/* PDF 뷰어 */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-zinc-950">
        <div className="flex justify-center p-6">
          <div className="shadow-2xl shadow-black/50 rounded-sm overflow-hidden">
            <canvas
              ref={canvasRef}
              className="block max-w-full h-auto"
              data-testid="pdf-canvas"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default PDFViewer
