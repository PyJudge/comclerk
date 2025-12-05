// [COMCLERK-ADDED] 2025-12-01: Agent editor component
'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useCreateAgent, useUpdateAgent, useDeleteAgent } from '@/hooks'
import type { AgentFull } from '@/types'
import { Save, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'

interface AgentEditorProps {
  agent: AgentFull | null
  isNew: boolean
  onSaved: (name: string) => void
  onDeleted?: () => void
  onCancel: () => void
}

const MODE_OPTIONS = [
  { value: 'primary', label: '기본', description: '직접 사용 가능' },
  { value: 'subagent', label: '서브에이전트', description: '다른 에이전트에서 호출' },
  { value: 'all', label: '전체', description: '모든 곳에서 사용 가능' },
] as const

export function AgentEditor({ agent, isNew, onSaved, onDeleted, onCancel }: AgentEditorProps) {
  const createAgent = useCreateAgent()
  const updateAgent = useUpdateAgent()
  const deleteAgent = useDeleteAgent()

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [mode, setMode] = useState<'primary' | 'subagent' | 'all'>('all')
  const [temperature, setTemperature] = useState<number | undefined>(undefined)
  const [topP, setTopP] = useState<number | undefined>(undefined)
  const [color, setColor] = useState('')
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('')

  // Advanced settings accordion
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Initialize form from agent
  useEffect(() => {
    if (agent) {
      setName(agent.name)
      setDescription(agent.description || '')
      setMode(agent.mode || 'all')
      setTemperature(agent.temperature)
      setTopP(agent.topP)
      setColor(agent.color || '')
      setPrompt(agent.prompt || '')
      setModel(agent.model || '')
    } else {
      // Reset for new agent
      setName('')
      setDescription('')
      setMode('all')
      setTemperature(undefined)
      setTopP(undefined)
      setColor('')
      setPrompt('')
      setModel('')
    }
  }, [agent])

  const isBuiltIn = agent?.builtIn ?? false
  const isSaving = createAgent.isPending || updateAgent.isPending
  const isDeleting = deleteAgent.isPending

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('에이전트 이름을 입력해주세요')
      return
    }

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      mode,
      temperature,
      topP,
      color: color.trim() || undefined,
      prompt: prompt.trim() || undefined,
      model: model.trim() || undefined,
    }

    try {
      if (isNew) {
        await createAgent.mutateAsync(data)
        toast.success('에이전트가 생성되었습니다')
        onSaved(data.name)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { name: _unusedName, ...updateData } = data
        await updateAgent.mutateAsync({ name: agent!.name, ...updateData })
        toast.success('에이전트가 저장되었습니다')
        onSaved(data.name)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '에이전트 저장에 실패했습니다')
    }
  }

  const handleDelete = async () => {
    if (!agent || isBuiltIn) return

    if (!confirm(`"${agent.name}" 에이전트를 삭제하시겠습니까?`)) {
      return
    }

    try {
      await deleteAgent.mutateAsync(agent.name)
      toast.success('에이전트가 삭제되었습니다')
      onDeleted?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '에이전트 삭제에 실패했습니다')
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h2 className="text-lg font-semibold">
            {isNew ? '새 에이전트' : isBuiltIn ? `${agent?.name} (기본)` : agent?.name}
          </h2>
          {isBuiltIn && (
            <p className="text-sm text-muted-foreground">
              기본 에이전트는 수정할 수 없습니다
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isBuiltIn && !isNew && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onCancel}
            className="px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isNew || isBuiltIn}
              placeholder="my-agent"
              className={cn(
                'w-full px-3 py-2 rounded-md border border-input bg-background text-sm',
                'focus:outline-none focus:ring-2 focus:ring-ring',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            />
            {isNew && (
              <p className="text-xs text-muted-foreground">
                영문자, 숫자, 하이픈, 언더스코어 사용 가능. 영문자로 시작해야 합니다.
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">설명</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isBuiltIn}
              placeholder="에이전트 설명"
              className={cn(
                'w-full px-3 py-2 rounded-md border border-input bg-background text-sm',
                'focus:outline-none focus:ring-2 focus:ring-ring',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            />
          </div>

          {/* Mode */}
          <div className="space-y-2">
            <label className="text-sm font-medium">모드</label>
            <div className="grid grid-cols-3 gap-2">
              {MODE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setMode(option.value)}
                  disabled={isBuiltIn}
                  className={cn(
                    'p-3 rounded-md border text-left transition-colors',
                    mode === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-input hover:border-primary/50',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium">시스템 프롬프트</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isBuiltIn}
              placeholder="시스템 프롬프트 입력"
              rows={10}
              className={cn(
                'w-full px-3 py-2 rounded-md border border-input bg-background text-sm font-mono',
                'focus:outline-none focus:ring-2 focus:ring-ring resize-y',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            />
            <p className="text-xs text-muted-foreground">
              마크다운 형식 지원
            </p>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <label className="text-sm font-medium">색상</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color || '#6366f1'}
                onChange={(e) => setColor(e.target.value)}
                disabled={isBuiltIn}
                className="w-10 h-10 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                disabled={isBuiltIn}
                placeholder="#6366f1"
                className={cn(
                  'flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-ring',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              />
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="border border-input rounded-md">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between p-4 text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              <span>고급 설정</span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="p-4 pt-0 space-y-4 border-t border-input">
                {/* Model */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">모델 지정</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    disabled={isBuiltIn}
                    placeholder="anthropic/claude-sonnet-4-20250514"
                    className={cn(
                      'w-full px-3 py-2 rounded-md border border-input bg-background text-sm',
                      'focus:outline-none focus:ring-2 focus:ring-ring',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  />
                </div>

                {/* Temperature */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Temperature: {temperature !== undefined ? temperature : '기본값'}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature ?? 1}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    disabled={isBuiltIn}
                    className="w-full disabled:opacity-50"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>정확 (0)</span>
                    <span>창의 (2)</span>
                  </div>
                </div>

                {/* Top P */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Top P: {topP !== undefined ? topP : '기본값'}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={topP ?? 1}
                    onChange={(e) => setTopP(parseFloat(e.target.value))}
                    disabled={isBuiltIn}
                    className="w-full disabled:opacity-50"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>집중 (0)</span>
                    <span>다양 (1)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      {!isBuiltIn && (
        <div className="flex items-center justify-end gap-3 p-4 border-t border-border bg-muted/30">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
              'bg-primary text-primary-foreground hover:bg-primary/90',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Save className="w-4 h-4" />
            {isSaving ? '저장 중' : isNew ? '생성' : '저장'}
          </button>
        </div>
      )}
    </div>
  )
}
