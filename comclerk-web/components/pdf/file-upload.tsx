// [COMCLERK-ADDED] 2024-12-01: 폴더 선택 컴포넌트

'use client'

import * as React from 'react'
import { toast } from 'sonner'
import type { PDFFileData, FileUploadProps, FileUploadRef } from '@/types/pdf'

export const FileUpload = React.forwardRef<FileUploadRef, FileUploadProps>(
  ({ onFolderSelect, onError, maxFileSize = 10 * 1024 * 1024 }, ref) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    // PDF validation
    const validatePDF = (file: File): string | null => {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        return `${file.name}은(는) PDF 파일이 아닙니다.`
      }

      if (file.size > maxFileSize) {
        const maxMB = maxFileSize / (1024 * 1024)
        return `${file.name} 파일 크기가 너무 큽니다. 최대 ${maxMB}MB까지 허용됩니다.`
      }

      return null
    }

    // Process folder PDFs
    const processFolderPDFs = async (files: FileList) => {
      const folderFiles = Array.from(files).filter((file) => {
        const pathParts = file.webkitRelativePath.split('/')
        return (
          pathParts.length === 2 &&
          (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))
        )
      })

      if (folderFiles.length === 0) {
        const errorMsg = '선택한 폴더에 PDF 파일이 없습니다.'
        toast.error(errorMsg)
        onError?.(errorMsg)
        return
      }

      try {
        const pdfData: PDFFileData[] = []

        for (const file of folderFiles) {
          const validationError = validatePDF(file)
          if (validationError) {
            toast.warning(validationError)
            continue
          }

          pdfData.push({
            name: file.name,
            size: file.size,
            file: file,
            path: file.webkitRelativePath,
          })
        }

        if (pdfData.length > 0) {
          toast.success(`${pdfData.length}개의 PDF 파일을 불러왔습니다!`)
          onFolderSelect?.(pdfData)
        } else {
          throw new Error('처리할 수 있는 PDF 파일이 없습니다.')
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
        toast.error(errorMessage)
        onError?.(errorMessage)
      }
    }

    // Handle folder selection
    const handleFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return

      processFolderPDFs(files)

      // Reset input value
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }

    // Trigger folder selection
    const triggerFolderSelect = () => {
      fileInputRef.current?.click()
    }

    // Expose the trigger function via ref
    React.useImperativeHandle(ref, () => ({
      triggerFolderSelect,
    }))

    return (
      <input
        ref={fileInputRef}
        type="file"
        {...({ webkitdirectory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
        multiple
        onChange={handleFolderInputChange}
        className="sr-only"
        aria-label="PDF 파일이 포함된 폴더 선택"
        data-testid="upload-area"
      />
    )
  }
)

FileUpload.displayName = 'FileUpload'
