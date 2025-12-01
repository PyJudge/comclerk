import { SettingsForm } from '@/components/settings/settings-form'

export const metadata = {
  title: 'Settings - OpenCode',
}

export default function SettingsPage() {
  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your OpenCode preferences
        </p>
      </header>
      <SettingsForm />
    </div>
  )
}
