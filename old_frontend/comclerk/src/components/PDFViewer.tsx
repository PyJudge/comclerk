"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PDFViewerProps {
  fileUrl?: string | null;
  url?: string;
  pdfData?: ArrayBuffer | null; // New: support ArrayBuffer data
  className?: string;
  onError?: (error: Error) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

export function PDFViewer({ fileUrl, url, pdfData, className, onError, onLoadingChange }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [pdfjsLib, setPdfjsLib] = useState<typeof import('pdfjs-dist') | null>(null);
  const [pdf, setPdf] = useState<import('pdfjs-dist').PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageInput, setPageInput] = useState('1');

  // PDF.js 동적 로드
  useEffect(() => {
    let mounted = true;

    const loadPdfjs = async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        if (typeof window !== 'undefined') {
          // public 폴더에서 제공되는 worker 사용
          pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;
        }
        
        if (mounted) {
          setPdfjsLib(pdfjs);
        }
      } catch (err) {
        if (mounted) {
          setError('PDF 뷰어를 불러올 수 없습니다. 페이지를 새로고침해주세요.');
        }
      }
    };

    loadPdfjs();

    return () => {
      mounted = false;
    };
  }, []);

  // PDF 로드 (URL 또는 ArrayBuffer 지원)
  const loadPDF = useCallback(async (source: string | ArrayBuffer) => {
    if (!pdfjsLib) return;
    
    setIsLoading(true);
    setError(null);
    onLoadingChange?.(true);
    
    try {
      const loadingTask = pdfjsLib.getDocument(source);
      
      // 로딩 진행률 처리
      loadingTask.onProgress = (progress: any) => {
        // 진행률을 조용히 처리
      };

      const pdfDocument = await loadingTask.promise;
      
      setPdf(pdfDocument);
      setTotalPages(pdfDocument.numPages);
      setCurrentPage(1);
      setPageInput('1');
    } catch (err: any) {
      // 에러를 조용히 처리
      let errorMsg = 'PDF 파일을 읽을 수 없습니다.';
      
      if (err?.name === 'InvalidPDFException') {
        errorMsg = '유효하지 않은 PDF 파일입니다.';
      } else if (err?.name === 'MissingPDFException') {
        errorMsg = 'PDF 파일을 찾을 수 없습니다.';
      } else if (err?.name === 'UnexpectedResponseException') {
        errorMsg = '파일을 다운로드할 수 없습니다.';
      }
      
      setError(errorMsg);
      setPdf(null);
      onError?.(new Error(errorMsg));
    } finally {
      setIsLoading(false);
      onLoadingChange?.(false);
    }
  }, [pdfjsLib, onError, onLoadingChange]);

  // 페이지 렌더링
  const renderPage = useCallback(async (pageNumber: number) => {
    if (!pdf || !pdfjsLib) {
      return;
    }

    // DOM이 준비될 때까지 잠깐 대기
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const canvas = canvasRef.current;
    if (!canvas) {
      // Canvas가 준비되지 않은 경우 재시도
      setTimeout(() => renderPage(pageNumber), 200);
      return;
    }

    try {
      const page = await pdf.getPage(pageNumber);
      const context = canvas.getContext('2d');
      
      if (!context) {
        return;
      }

      // 뷰포트 계산
      const viewport = page.getViewport({ 
        scale: scale,
        rotation: rotation 
      });
      
      // Canvas 크기 설정
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = viewport.width + 'px';
      canvas.style.height = viewport.height + 'px';

      // 이전 렌더링 취소
      context.clearRect(0, 0, canvas.width, canvas.height);

      // 렌더링 컨텍스트
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      } as any;

      // 페이지 렌더링 - 에러 발생해도 앱이 중단되지 않도록 처리
      await page.render(renderContext).promise;
      
    } catch (err: any) {
      // 렌더링 오류는 조용히 처리 - 사용자에게 보이지 않음
    }
  }, [pdf, scale, rotation, pdfjsLib]);

  // 파일 URL/ArrayBuffer 변경 시 PDF 로드
  useEffect(() => {
    if (pdfData) {
      // ArrayBuffer 데이터가 있으면 이를 우선 사용
      loadPDF(pdfData);
    } else if (url || fileUrl) {
      // URL이 있으면 URL 사용
      const actualUrl = url || fileUrl;
      loadPDF(actualUrl);
    } else {
      // 둘 다 없으면 초기화
      setPdf(null);
      setError(null);
      setIsLoading(false);
    }
  }, [fileUrl, url, pdfData, loadPDF]);

  // 현재 페이지, 스케일, 회전 변경 시 페이지 렌더링
  useEffect(() => {
    if (pdf && canvasRef.current) {
      renderPage(currentPage);
    }
  }, [pdf, currentPage, scale, rotation, renderPage]);

  // 페이지 네비게이션
  const goToPrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      setPageInput(newPage.toString());
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      setPageInput(newPage.toString());
    }
  };

  const handlePageInputChange = (value: string) => {
    setPageInput(value);
  };

  const handlePageInputSubmit = () => {
    const pageNumber = parseInt(pageInput, 10);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  const handlePageInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePageInputSubmit();
    }
  };

  // 확대/축소
  const zoomIn = () => {
    if (scale < 2.0) {
      setScale(Math.min(2.0, scale + 0.25));
    }
  };

  const zoomOut = () => {
    if (scale > 0.5) {
      setScale(Math.max(0.5, scale - 0.25));
    }
  };

  // 회전
  const rotate = () => {
    setRotation((rotation + 90) % 360);
  };

  // 빈 상태
  const actualUrl = url || fileUrl;
  if (!actualUrl && !pdfData) {
    return (
      <div className={cn("flex items-center justify-center h-full bg-muted/20", className)}>
        <div className="text-center text-muted-foreground">
          <div className="text-6xl mb-4">📄</div>
          <p className="text-lg font-medium">PDF 뷰어</p>
          <p className="text-sm">폴더를 선택하여 PDF 내용을 확인하세요</p>
        </div>
      </div>
    );
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">PDF 파일을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="text-center text-destructive">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="font-medium mb-2">PDF 로딩 오류</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => fileUrl && loadPDF(fileUrl)}
          >
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* 툴바 */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          {/* 페이지 네비게이션 */}
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2">
            <Input
              value={pageInput}
              onChange={(e) => handlePageInputChange(e.target.value)}
              onBlur={handlePageInputSubmit}
              onKeyPress={handlePageInputKeyPress}
              className="w-16 text-center"
              type="number"
              min="1"
              max={totalPages}
            />
            <span className="text-sm text-muted-foreground">/ {totalPages}</span>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* 확대/축소 */}
          <Button
            variant="outline"
            size="icon"
            onClick={zoomOut}
            disabled={scale <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <span className="text-sm text-muted-foreground w-16 text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <Button
            variant="outline"
            size="icon"
            onClick={zoomIn}
            disabled={scale >= 2.0}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          {/* 회전 */}
          <Button
            variant="outline"
            size="icon"
            onClick={rotate}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF 뷰어 */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900">
        <div className="flex justify-center p-4">
          <div className="bg-white dark:bg-gray-800 shadow-lg">
            <canvas
              ref={canvasRef}
              className="block max-w-full h-auto"
              style={{ 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PDFViewer;