// [COMCLERK-MODIFIED] 2025-12-02: Back 버튼 클릭 시 캐시 무효화 추가
import { QueryProvider } from '@/components/providers/query-provider'
import { BackToWorkspace } from './back-to-workspace'

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryProvider>
      <div className="min-h-screen bg-background">
        <nav className="border-b">
          <div className="container max-w-6xl mx-auto px-4 h-14 flex items-center">
            <BackToWorkspace />
          </div>
        </nav>
        {children}
      </div>
    </QueryProvider>
  )
}
