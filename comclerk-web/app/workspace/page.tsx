// [COMCLERK-ADDED] 2024-12-01: 워크스페이스 페이지 (3패널 레이아웃 + 채팅)

import { promises as fs } from 'fs'
import path from 'path'
import type { PDFFileMeta } from '@/types/pdf'
import WorkspaceClient from './workspace-client'

// 서버에서 PDF 파일 목록 읽기
async function getPdfFiles(): Promise<PDFFileMeta[]> {
  const pdfDir = path.join(process.cwd(), 'public', 'pdfs')

  try {
    const files = await fs.readdir(pdfDir)
    const pdfFiles: PDFFileMeta[] = []

    for (const file of files) {
      if (!file.toLowerCase().endsWith('.pdf')) continue

      const filePath = path.join(pdfDir, file)
      const stat = await fs.stat(filePath)

      if (stat.isFile()) {
        pdfFiles.push({
          name: file,
          size: stat.size,
          path: `/pdfs/${file}`, // public URL
        })
      }
    }

    // 이름순 정렬
    return pdfFiles.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  } catch {
    // pdfs 폴더가 없거나 읽기 실패 시 빈 배열 반환
    return []
  }
}

export default async function WorkspacePage() {
  const initialFiles = await getPdfFiles()

  return <WorkspaceClient initialFiles={initialFiles} />
}
