// [COMCLERK-ADDED] 2025-12-02: Back 버튼 - 클릭 시 캐시 무효화 후 이동
'use client'

import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'

export function BackToWorkspace() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const handleClick = () => {
    // Invalidate agents cache so workspace gets fresh data
    queryClient.invalidateQueries({ queryKey: ['agents'] })
    router.push('/workspace')
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      워크스페이스로 돌아가기
    </button>
  )
}
