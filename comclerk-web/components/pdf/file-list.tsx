// [COMCLERK-ADDED] 2024-12-01: PDF 파일 목록 컴포넌트

'use client'

import { cn } from '@/lib/utils'
import type { FileListProps } from '@/types/pdf'

export function FileList({
  files,
  selectedFile,
  onFileSelect,
  onLoadFile,
  className,
}: FileListProps) {
  // 파일명에서 .pdf 확장자 제거
  const getDisplayName = (fileName: string) => {
    return fileName.replace(/\.pdf$/i, '')
  }

  const handleFileClick = async (file: typeof files[0]) => {
    onFileSelect(file)

    // 선택된 파일 지연 로딩
    if (!file.data) {
      try {
        const loadedFile = await onLoadFile(file)
        onFileSelect(loadedFile)
      } catch {
        // 에러는 onLoadFile에서 처리됨
      }
    }
  }

  if (files.length === 0) {
    return (
      <div className={cn('text-center py-8 px-4', className)}>
        <p className="text-zinc-500 text-sm mb-4">PDF 폴더를 선택하세요</p>
      </div>
    )
  }

  return (
    <div className={cn('h-full overflow-y-auto', className)}>
      <div className="p-2">
        {files.map((file, index) => (
          <div key={file.path}>
            <div
              className={cn(
                'px-3 py-2 cursor-pointer transition-colors rounded-md',
                selectedFile?.path === file.path
                  ? 'bg-blue-600/20 border border-blue-500/50 text-blue-300'
                  : 'hover:bg-zinc-800 text-zinc-300'
              )}
              onClick={() => handleFileClick(file)}
              data-testid="file-item"
            >
              <div className="flex items-center gap-2">
                {/* 파일 번호 */}
                <span className="text-xs text-zinc-600 font-mono w-5 text-right">
                  {index + 1}.
                </span>

                {/* 파일 아이콘 */}
                <div className="text-red-400 flex-shrink-0">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                      clipRule="evenodd"
                    />
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
            {index < files.length - 1 && <div className="h-0.5" />}
          </div>
        ))}
      </div>
    </div>
  )
}

export default FileList
