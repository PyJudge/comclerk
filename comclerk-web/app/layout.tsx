import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/components/providers/query-provider'
import { ModelProvider } from '@/contexts'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OpenCode',
  description: 'AI-powered code assistant',
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
