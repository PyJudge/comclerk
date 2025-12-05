// [COMCLERK-ADDED] 2025-12-01: Agent list component
'use client'

import { cn } from '@/lib/utils'
import type { AgentFull } from '@/types'
import { Plus, Lock, Bot } from 'lucide-react'

interface AgentListProps {
  agents: AgentFull[]
  selectedAgent: string | null
  onSelect: (name: string | null) => void
  onCreateNew: () => void
}

export function AgentList({ agents, selectedAgent, onSelect, onCreateNew }: AgentListProps) {
  // Separate built-in and custom agents
  const builtInAgents = agents.filter((a) => a.builtIn)
  const customAgents = agents.filter((a) => !a.builtIn)

  return (
    <div className="flex-1 overflow-auto">
      {/* Create New Button */}
      <div className="p-3">
        <button
          onClick={onCreateNew}
          className="w-full flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-border hover:border-primary hover:bg-muted/50 transition-colors"
        >
          <Plus className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm font-medium">새 에이전트</span>
        </button>
      </div>

      {/* Custom Agents */}
      {customAgents.length > 0 && (
        <div className="px-3 pb-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
            사용자 에이전트
          </h3>
          <div className="space-y-1">
            {customAgents.map((agent) => (
              <AgentItem
                key={agent.name}
                agent={agent}
                isSelected={selectedAgent === agent.name}
                onClick={() => onSelect(agent.name)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Built-in Agents */}
      <div className="px-3 pb-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
          기본 에이전트
        </h3>
        <div className="space-y-1">
          {builtInAgents.map((agent) => (
            <AgentItem
              key={agent.name}
              agent={agent}
              isSelected={selectedAgent === agent.name}
              onClick={() => onSelect(agent.name)}
              isBuiltIn
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface AgentItemProps {
  agent: AgentFull
  isSelected: boolean
  onClick: () => void
  isBuiltIn?: boolean
}

function AgentItem({ agent, isSelected, onClick, isBuiltIn }: AgentItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors',
        isSelected
          ? 'bg-primary/10 border border-primary/20'
          : 'hover:bg-muted/50'
      )}
    >
      {/* Color indicator or icon */}
      <div
        className={cn(
          'w-8 h-8 rounded-md flex items-center justify-center shrink-0',
          isBuiltIn ? 'bg-muted' : 'bg-primary/20'
        )}
        style={agent.color ? { backgroundColor: agent.color + '20' } : undefined}
      >
        {isBuiltIn ? (
          <Lock className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Bot className="w-4 h-4" style={agent.color ? { color: agent.color } : undefined} />
        )}
      </div>

      {/* Agent info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{agent.name}</span>
          {agent.mode && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {agent.mode}
            </span>
          )}
        </div>
        {agent.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {agent.description}
          </p>
        )}
      </div>
    </button>
  )
}
