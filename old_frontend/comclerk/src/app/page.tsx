"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileUpload, FileUploadRef } from '@/components/FileUpload';
import { PDFViewer } from '@/components/PDFViewer';
import { ChatPanel } from '@/components/ChatPanel';
import { FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types/chat';

interface PDFFileData {
  name: string;
  size: number;
  data?: ArrayBuffer; // Optional - loaded on demand
  file: File; // Keep File object for lazy loading
  path: string;
}

export default function Home() {
  const [pdfFiles, setPdfFiles] = useState<PDFFileData[]>([]);
  const [selectedFile, setSelectedFile] = useState<PDFFileData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Resizable panel state
  const [leftPanelWidth, setLeftPanelWidth] = useState(320); // Default 320px (w-80)
  const [rightPanelWidth, setRightPanelWidth] = useState(384); // Default 384px (w-96)
  const [isDragging, setIsDragging] = useState<'left' | 'right' | null>(null);
  const fileUploadRef = React.useRef<FileUploadRef>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number>(0);
  const dragStartLeftWidth = useRef<number>(0);
  const dragStartRightWidth = useRef<number>(0);

  // Panel constraints
  const MIN_LEFT_WIDTH = 200;
  const MAX_LEFT_WIDTH = 500;
  const MIN_RIGHT_WIDTH = 300;
  const MAX_RIGHT_WIDTH = 600;
  const MIN_CENTER_WIDTH = 400; // Minimum center panel width

  // 지연 로딩: 선택된 파일의 ArrayBuffer 로드
  const loadFileData = useCallback(async (fileData: PDFFileData): Promise<PDFFileData> => {
    if (fileData.data) {
      // 이미 로드된 경우 그대로 반환
      return fileData;
    }

    try {
      // ArrayBuffer 로드
      const arrayBuffer = await fileData.file.arrayBuffer();
      return {
        ...fileData,
        data: arrayBuffer
      };
    } catch (error) {
      toast.error(`파일 로딩 실패: ${fileData.name}`);
      throw error;
    }
  }, []);

  // 폴더 선택 처리
  const handleFolderSelect = useCallback((files: PDFFileData[]) => {
    setPdfFiles(files);
    
    // 첫 번째 파일을 자동 선택하고 로드
    if (files.length > 0) {
      const firstFile = files[0];
      setSelectedFile(firstFile);
      
      // 첫 번째 파일 지연 로딩
      loadFileData(firstFile)
        .then(loadedFile => {
          setSelectedFile(loadedFile);
          setPdfFiles(prev => prev.map(f => 
            f.path === loadedFile.path ? loadedFile : f
          ));
        })
        .catch(() => {
          // 에러는 loadFileData에서 이미 토스트로 처리됨
        });
    }
  }, [loadFileData]);

  // 폴더 선택 에러 처리
  const handleFolderError = useCallback((error: string) => {
    toast.error(error);
  }, []);


  // 채팅 메시지 전송
  const handleSendMessage = async (message: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (response.ok) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let aiContent = '';

        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: '',
          role: 'ai',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, aiMessage]);

        if (reader) {
          let isFirstChunk = true;
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // 첫 번째 청크가 도착하면 로딩 상태 해제
            if (isFirstChunk) {
              setIsChatLoading(false);
              isFirstChunk = false;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') break;
                
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.isComplete) {
                    break;
                  }
                  
                  aiContent += parsed.message;
                  setMessages(prev => 
                    prev.map(msg => 
                      msg.id === aiMessage.id 
                        ? { ...msg, content: aiContent }
                        : msg
                    )
                  );
                } catch {
                  // JSON 파싱 실패 시 원본 데이터 사용
                  aiContent += data;
                  setMessages(prev => 
                    prev.map(msg => 
                      msg.id === aiMessage.id 
                        ? { ...msg, content: aiContent }
                        : msg
                    )
                  );
                }
              }
            }
          }
        }
      } else {
        toast.error('메시지 전송에 실패했습니다.');
      }
    } catch {
      toast.error('채팅 중 오류가 발생했습니다.');
      setIsChatLoading(false); // 오류 발생 시에만 로딩 해제
    }
  };

  // Handle drag start for resize handles
  const handleMouseDown = useCallback((e: React.MouseEvent, handle: 'left' | 'right') => {
    e.preventDefault();
    setIsDragging(handle);
    dragStartX.current = e.clientX;
    dragStartLeftWidth.current = leftPanelWidth;
    dragStartRightWidth.current = rightPanelWidth;
    
    // Add global styles for drag state
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [leftPanelWidth, rightPanelWidth]);

  // Handle mouse move during drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const totalWidth = containerRect.width;
    const deltaX = e.clientX - dragStartX.current;

    if (isDragging === 'left') {
      const newLeftWidth = dragStartLeftWidth.current + deltaX;
      const maxAllowedLeft = Math.min(
        MAX_LEFT_WIDTH,
        totalWidth - rightPanelWidth - MIN_CENTER_WIDTH
      );
      
      const constrainedWidth = Math.max(MIN_LEFT_WIDTH, Math.min(newLeftWidth, maxAllowedLeft));
      setLeftPanelWidth(constrainedWidth);
    } else if (isDragging === 'right') {
      const newRightWidth = dragStartRightWidth.current - deltaX;
      const maxAllowedRight = Math.min(
        MAX_RIGHT_WIDTH,
        totalWidth - leftPanelWidth - MIN_CENTER_WIDTH
      );
      
      const constrainedWidth = Math.max(MIN_RIGHT_WIDTH, Math.min(newRightWidth, maxAllowedRight));
      setRightPanelWidth(constrainedWidth);
    }
  }, [isDragging, leftPanelWidth, rightPanelWidth]);

  // Handle mouse up to end drag
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(null);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }, [isDragging]);

  // Add global mouse event listeners for drag functionality
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle window resize to maintain proportional layout
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const totalWidth = containerRect.width;
      const minTotalWidth = MIN_LEFT_WIDTH + MIN_CENTER_WIDTH + MIN_RIGHT_WIDTH;
      
      if (totalWidth < minTotalWidth) {
        // If window is too small, reset to minimum widths
        setLeftPanelWidth(MIN_LEFT_WIDTH);
        setRightPanelWidth(MIN_RIGHT_WIDTH);
      } else {
        // Ensure current widths don't exceed available space
        const availableWidth = totalWidth - MIN_CENTER_WIDTH;
        const currentTotal = leftPanelWidth + rightPanelWidth;
        
        if (currentTotal > availableWidth) {
          // Proportionally reduce panel widths
          const leftRatio = leftPanelWidth / currentTotal;
          const rightRatio = rightPanelWidth / currentTotal;
          
          setLeftPanelWidth(Math.max(MIN_LEFT_WIDTH, Math.floor(availableWidth * leftRatio)));
          setRightPanelWidth(Math.max(MIN_RIGHT_WIDTH, Math.floor(availableWidth * rightRatio)));
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [leftPanelWidth, rightPanelWidth]);

  // 파일명에서 .pdf 확장자 제거
  const getDisplayName = (fileName: string) => {
    return fileName.replace(/\.pdf$/i, '');
  };


  return (
    <div className="h-screen flex" ref={containerRef} data-testid="main-layout">
      {/* 왼쪽 사이드바 - PDF 목록 */}
      <div 
        className="border-r bg-gray-50 flex flex-col transition-all duration-200 ease-out flex-shrink-0"
        style={{ width: `${leftPanelWidth}px` }}
        data-testid="left-panel"
      >
        {/* 헤더 */}
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">PDF 목록</h2>
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => fileUploadRef.current?.triggerFolderSelect()}
                className="hidden md:flex"
                title="폴더 선택 (데스크톱 전용)"
              >
                <FolderOpen className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>


        {/* 파일 목록 */}
        <div className="flex-1 min-h-0">
          {pdfFiles.length === 0 ? (
            <div className="text-center py-8 px-4 hidden md:block">
              <p className="text-gray-500 text-sm mb-4">PDF 폴더를 선택하세요</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileUploadRef.current?.triggerFolderSelect()}
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                폴더 선택
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-4">
                {pdfFiles.map((file, index) => (
                  <div key={file.path}>
                    <div
                      className={cn(
                        "px-3 py-2 cursor-pointer transition-colors hover:bg-blue-50 rounded-md",
                        selectedFile?.path === file.path 
                          ? "bg-blue-100 border border-blue-300" 
                          : "hover:bg-gray-100"
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedFile(file);
                        
                        // 선택된 파일 지연 로딩
                        if (!file.data) {
                          loadFileData(file)
                            .then(loadedFile => {
                              setSelectedFile(loadedFile);
                              setPdfFiles(prev => prev.map(f => 
                                f.path === loadedFile.path ? loadedFile : f
                              ));
                            })
                            .catch(() => {
                              // 에러는 loadFileData에서 이미 처리됨
                            });
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        {/* 파일 번호 */}
                        <span className="text-xs text-gray-400 font-mono w-4 text-right">
                          {index + 1}.
                        </span>
                        
                        {/* 파일 아이콘 */}
                        <div className="text-red-500 flex-shrink-0">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                        </div>
                        
                        {/* 파일명 */}
                        <p 
                          className="text-sm truncate leading-tight flex-1" 
                          title={file.name}
                          data-testid="file-name-display"
                        >
                          {getDisplayName(file.name)}
                        </p>
                      </div>
                    </div>
                    
                    {/* 구분선 (마지막 항목 제외) */}
                    {index < pdfFiles.length - 1 && (
                      <div className="h-1"></div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
      
      {/* Left resize handle */}
      <div
        className={cn(
          "w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors duration-200 relative group flex-shrink-0",
          isDragging === 'left' && "bg-blue-500"
        )}
        onMouseDown={(e) => handleMouseDown(e, 'left')}
        data-testid="panel-resize-handle-left"
      >
        <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-200 group-hover:bg-opacity-30 transition-colors duration-200" />
      </div>
      
      {/* 중앙 PDF 뷰어 */}
      <div 
        className="bg-white transition-all duration-200 ease-out flex-1 min-w-0"
        data-testid="center-panel"
      >
        <PDFViewer pdfData={selectedFile?.data} />
      </div>
      
      {/* Right resize handle */}
      <div
        className={cn(
          "w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors duration-200 relative group flex-shrink-0",
          isDragging === 'right' && "bg-blue-500"
        )}
        onMouseDown={(e) => handleMouseDown(e, 'right')}
        data-testid="panel-resize-handle-right"
      >
        <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-200 group-hover:bg-opacity-30 transition-colors duration-200" />
      </div>
      
      {/* 오른쪽 채팅 패널 */}
      <div 
        className="border-l bg-gray-50 transition-all duration-200 ease-out flex-shrink-0"
        style={{ width: `${rightPanelWidth}px` }}
        data-testid="right-panel"
      >
        <ChatPanel 
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isChatLoading}
        />
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
  );
}