import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/components/providers/query-provider'
import { ModelProvider } from '@/contexts'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '컴연권',
  description: '법률 문서 분석 AI 어시스턴트',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <ModelProvider>
            {children}
            <Toaster position="top-right" />
          </ModelProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
