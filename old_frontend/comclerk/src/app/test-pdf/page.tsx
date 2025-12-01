"use client"

import { useState } from 'react'
import PDFViewer from '@/components/PDFViewer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestPDFPage() {
  const [selectedPDF, setSelectedPDF] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  // 테스트용 PDF URLs
  const testPDFs = [
    {
      name: 'Sample PDF (Mozilla)',
      url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
    },
    {
      name: 'Lorem Ipsum PDF',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
    }
  ]

  const handleError = (err: Error) => {
    setError(err.message)
    console.error('PDF Error:', err)
  }

  const handleLoadingChange = (isLoading: boolean) => {
    setLoading(isLoading)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">PDF Viewer 테스트</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-150px)]">
          {/* PDF 선택 사이드바 */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>테스트 PDF 선택</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {testPDFs.map((pdf, index) => (
                  <Button
                    key={index}
                    variant={selectedPDF === pdf.url ? "default" : "outline"}
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => {
                      setSelectedPDF(pdf.url)
                      setError('')
                    }}
                  >
                    <div>
                      <div className="font-medium">{pdf.name}</div>
                      <div className="text-xs opacity-70 mt-1 truncate">
                        {pdf.url}
                      </div>
                    </div>
                  </Button>
                ))}
                
                <div className="border-t pt-3 mt-4">
                  <div className="text-sm font-medium mb-2">또는 URL 입력:</div>
                  <input
                    type="url"
                    placeholder="PDF URL을 입력하세요"
                    className="w-full p-2 border rounded text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const url = (e.target as HTMLInputElement).value
                        if (url) {
                          setSelectedPDF(url)
                          setError('')
                        }
                      }
                    }}
                  />
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    <strong>오류:</strong> {error}
                  </div>
                )}

                {loading && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
                    PDF를 로딩하는 중...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* PDF 뷰어 메인 영역 */}
          <div className="lg:col-span-3">
            {selectedPDF ? (
              <PDFViewer
                url={selectedPDF}
                className="h-full"
                onError={handleError}
                onLoadingChange={handleLoadingChange}
              />
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center">
                  <div className="text-6xl mb-4">📄</div>
                  <h3 className="text-xl font-semibold mb-2">PDF 파일을 선택하세요</h3>
                  <p className="text-muted-foreground">
                    왼쪽에서 테스트 PDF를 선택하거나 URL을 입력하세요
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* 기능 설명 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>PDF 뷰어 기능</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">🖱️ 마우스 컨트롤</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• 이전/다음 버튼으로 페이지 이동</li>
                  <li>• +/- 버튼으로 확대/축소</li>
                  <li>• 줌 퍼센트 클릭으로 원본 크기</li>
                  <li>• 페이지 번호 입력으로 직접 이동</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">⌨️ 키보드 단축키</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• ← → : 페이지 이동</li>
                  <li>• + / = : 확대</li>
                  <li>• - : 축소</li>
                  <li>• 0 : 원본 크기로 복원</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">📱 반응형 기능</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• 컨테이너 크기에 자동 맞춤</li>
                  <li>• 고해상도 디스플레이 지원</li>
                  <li>• 창 크기 변경시 자동 조절</li>
                  <li>• 모바일 친화적 터치 지원</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}