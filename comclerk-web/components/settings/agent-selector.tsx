'use client'

import { useAgents } from '@/hooks'
import { cn } from '@/lib/utils'

export function AgentSelector() {
  const { data: agents, isLoading, error } = useAgents()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Failed to load agents. Please try again.
      </div>
    )
  }

  if (!agents || agents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No agents available.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select an agent to use for your coding sessions.
      </p>

      <div className="space-y-3">
        {agents.map((agent) => (
          <div
            key={agent.name}
            className={cn(
              'p-4 rounded-lg border bg-card cursor-pointer',
              'hover:border-primary transition-colors'
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">{agent.name}</h3>
                {agent.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {agent.description}
                  </p>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {agent.model?.modelID}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
