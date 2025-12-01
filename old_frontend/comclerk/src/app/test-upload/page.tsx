"use client"

import { FileUpload } from "@/components/FileUpload"
import { Toaster } from "@/components/ui/sonner"
import { useState } from "react"

interface PDFFileData {
  name: string;
  size: number;
  data?: ArrayBuffer; // Optional - loaded on demand
  file: File; // Keep File object for lazy loading
  path: string;
}

export default function TestUploadPage() {
  const [selectedFiles, setSelectedFiles] = useState<PDFFileData[]>([])

  const handleFolderSelect = (files: PDFFileData[]) => {
    console.log("Folder selected with files:", files.map(f => f.name))
    setSelectedFiles(files)
  }

  const handleFolderError = (error: string) => {
    console.error("Folder selection error:", error)
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">파일 업로드 테스트</h1>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">PDF 폴더 선택</h2>
          <FileUpload
            onFolderSelect={handleFolderSelect}
            onError={handleFolderError}
            maxFileSize={10 * 1024 * 1024} // 10MB
            className="border-2 border-dashed border-gray-300 rounded-lg p-6"
          />
        </div>

        {selectedFiles.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">선택된 PDF 파일들:</h3>
            <ul className="space-y-2">
              {selectedFiles.map((file, index) => (
                <li key={file.path} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>{index + 1}. {file.name}</span>
                  <span className="text-sm text-gray-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-sm text-gray-600 space-y-2">
          <h3 className="font-medium">테스트 시나리오:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>PDF 파일이 포함된 폴더를 선택</li>
            <li>폴더 내 PDF 파일들이 자동으로 필터링되어 표시</li>
            <li>비PDF 파일은 자동으로 제외</li>
            <li>큰 파일 (10MB 초과) 에러 메시지 확인</li>
            <li>처리 중 진행률 표시 확인</li>
            <li>키보드 네비게이션 (Tab, Enter/Space) 테스트</li>
          </ul>
        </div>
      </div>

      <Toaster />
    </div>
  )
}