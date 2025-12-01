import { QueryProvider } from '@/components/providers/query-provider'
import Link from 'next/link'

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryProvider>
      <div className="min-h-screen bg-background">
        <nav className="border-b">
          <div className="container max-w-2xl mx-auto px-4 h-14 flex items-center">
            <Link
              href="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Sessions
            </Link>
          </div>
        </nav>
        {children}
      </div>
    </QueryProvider>
  )
}
