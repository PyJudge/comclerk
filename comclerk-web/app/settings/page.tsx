// [COMCLERK-MODIFIED] 2025-12-02: 좌우 폭 확장 (max-w-2xl → max-w-6xl)
import { SettingsForm } from '@/components/settings/settings-form'

export const metadata = {
  title: '설정 - ComClerk',
}

export default function SettingsPage() {
  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">설정</h1>
      </header>
      <SettingsForm />
    </div>
  )
}
