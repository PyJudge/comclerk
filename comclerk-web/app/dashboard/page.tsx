// [COMCLERK-MODIFIED] 2024-12-01: 앱 실행 시 자동으로 새 세션 생성 후 리다이렉트
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateSession } from '@/hooks'

export default function DashboardPage() {
  const router = useRouter()
  const createSession = useCreateSession()

  useEffect(() => {
    const autoCreateSession = async () => {
      try {
        const session = await createSession.mutateAsync(undefined)
        if (session?.id) {
          router.replace(`/dashboard/session/${session.id}`)
        }
      } catch (error) {
        console.error('Failed to auto-create session:', error)
      }
    }
    autoCreateSession()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">새 세션을 생성하는 중...</p>
      </div>
    </div>
  )
}
