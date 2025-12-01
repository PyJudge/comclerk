'use client'

import { useState } from 'react'
import { useConfig } from '@/hooks'
import { AgentSelector } from './agent-selector'
import { ProviderConfig } from './provider-config'
import { OAuthLogin } from './oauth-login'
import { cn } from '@/lib/utils'

export function SettingsForm() {
  const { isLoading: configLoading } = useConfig()
  const [activeTab, setActiveTab] = useState<'account' | 'agents' | 'providers'>('account')

  const tabs = [
    { id: 'account' as const, label: 'Account' },
    { id: 'agents' as const, label: 'Agents' },
    { id: 'providers' as const, label: 'Providers' },
  ]

  if (configLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'account' && <OAuthLogin />}
        {activeTab === 'agents' && <AgentSelector />}
        {activeTab === 'providers' && <ProviderConfig />}
      </div>
    </div>
  )
}
