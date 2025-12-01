'use client'

import { useState } from 'react'
import { useSession, useSessionMessages } from '@/hooks'
import { cn } from '@/lib/utils'

interface ExportDialogProps {
  sessionId: string
  isOpen: boolean
  onClose: () => void
}

export function ExportDialog({ sessionId, isOpen, onClose }: ExportDialogProps) {
  const { data: session } = useSession(sessionId)
  const { data: messages } = useSessionMessages(sessionId)
  const [format, setFormat] = useState<'json' | 'markdown'>('json')

  if (!isOpen) return null

  const handleExport = () => {
    if (!session || !messages) return

    const exportData = {
      session: {
        id: session.id,
        name: session.title,
        created: session.time.created,
        updated: session.time.updated,
        directory: session.directory,
      },
      messages: messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        parts: msg.parts,
        time: msg.time,
      })),
      exportedAt: new Date().toISOString(),
    }

    let content: string
    let filename: string
    let mimeType: string

    if (format === 'json') {
      content = JSON.stringify(exportData, null, 2)
      filename = `opencode-session-${sessionId}.json`
      mimeType = 'application/json'
    } else {
      content = convertToMarkdown(exportData)
      filename = `opencode-session-${sessionId}.md`
      mimeType = 'text/markdown'
    }

    // Create download
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">Export Session</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Format</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFormat('json')}
                className={cn(
                  'flex-1 py-2 px-4 rounded-lg border text-sm font-medium',
                  format === 'json'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-input hover:bg-accent'
                )}
              >
                JSON
              </button>
              <button
                onClick={() => setFormat('markdown')}
                className={cn(
                  'flex-1 py-2 px-4 rounded-lg border text-sm font-medium',
                  format === 'markdown'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-input hover:bg-accent'
                )}
              >
                Markdown
              </button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Session: {session?.title || 'Untitled'}</p>
            <p>Messages: {messages?.length || 0}</p>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-lg border hover:bg-accent"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="flex-1 py-2 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  )
}

function convertToMarkdown(data: {
  session: { name?: string; created: number; directory: string }
  messages: Array<{ role: string; parts?: Array<{ type: string; text?: string }> }>
}): string {
  let md = `# ${data.session.name || 'OpenCode Session'}\n\n`
  md += `**Created:** ${new Date(data.session.created).toLocaleString()}\n`
  md += `**Directory:** ${data.session.directory}\n\n`
  md += `---\n\n`

  for (const msg of data.messages) {
    const role = msg.role === 'user' ? '**User**' : '**Assistant**'
    md += `### ${role}\n\n`

    for (const part of msg.parts || []) {
      if (part.type === 'text' && part.text) {
        md += `${part.text}\n\n`
      }
    }
  }

  return md
}
