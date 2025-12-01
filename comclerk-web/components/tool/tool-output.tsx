'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import { ToolPart } from '@/types'

interface ToolOutputProps {
  part: ToolPart
}

export function ToolOutput({ part }: ToolOutputProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const toolName = part.tool || 'Unknown Tool'
  const state = part.state || 'pending'

  const stateConfig: Record<string, { color: string; bg: string }> = {
    pending: { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10' },
    running: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
    completed: { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
    error: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
  }

  const config = stateConfig[state] ?? stateConfig.pending
  const inputSummary = getInputSummary(toolName, part.input)

  return (
    <div className="rounded-lg border overflow-hidden bg-card">
      {/* Header - clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium', config.bg, config.color)}>
            {state === 'running' ? '⏳' : state === 'completed' ? '✓' : state === 'error' ? '✕' : '○'}
          </span>
          <span className="font-mono text-sm font-medium">{toolName}</span>
          {inputSummary && (
            <span className="text-xs text-muted-foreground truncate">{inputSummary}</span>
          )}
        </div>
        <svg
          className={cn('w-4 h-4 transition-transform flex-shrink-0', isExpanded && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t">
          {/* Output */}
          {part.output !== undefined && part.output !== null && (
            <div className="max-h-96 overflow-auto">
              <MarkdownOutput content={formatOutput(toolName, part.output)} />
            </div>
          )}

          {/* Error */}
          {part.error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm font-mono">
              {part.error}
            </div>
          )}

          {/* No output yet */}
          {!part.output && !part.error && state === 'running' && (
            <div className="p-3 text-sm text-muted-foreground">Running...</div>
          )}
        </div>
      )}
    </div>
  )
}

// Get a short summary of the input for display in header
function getInputSummary(tool: string, input?: Record<string, unknown>): string {
  if (!input) return ''

  const toolLower = tool.toLowerCase()

  if (toolLower === 'bash' && input.command) {
    const cmd = String(input.command)
    return cmd.length > 50 ? cmd.slice(0, 50) + '...' : cmd
  }
  if ((toolLower === 'read' || toolLower === 'write' || toolLower === 'edit') && (input.file_path || input.filePath)) {
    return String(input.file_path || input.filePath)
  }
  if (toolLower === 'grep' && input.pattern) {
    return `/${input.pattern}/`
  }
  if (toolLower === 'glob' && input.pattern) {
    return String(input.pattern)
  }
  if (input.description) {
    return String(input.description)
  }

  return ''
}

// Format output as markdown based on content type detection
function formatOutput(tool: string, output: unknown): string {
  // Handle string output directly
  if (typeof output === 'string') {
    return wrapInCodeBlock(output, detectLanguage(tool, output))
  }

  // Handle bash output
  if (isObject(output) && ('stdout' in output || 'stderr' in output)) {
    const parts: string[] = []
    if (output.stdout) parts.push(String(output.stdout))
    if (output.stderr) parts.push(`**stderr:**\n${output.stderr}`)
    if ('exitCode' in output && output.exitCode !== 0) {
      parts.push(`\n_Exit code: ${output.exitCode}_`)
    }
    if ('code' in output && output.code !== 0) {
      parts.push(`\n_Exit code: ${output.code}_`)
    }
    return wrapInCodeBlock(parts.join('\n\n'), 'bash')
  }

  // Handle diff output
  if (isObject(output) && 'diff' in output) {
    return wrapInCodeBlock(String(output.diff), 'diff')
  }

  // Handle file content output
  if (isObject(output) && 'content' in output) {
    return wrapInCodeBlock(String(output.content), detectLanguageFromPath(output.path as string))
  }

  // Handle array (file list, search results, etc.)
  if (Array.isArray(output)) {
    if (output.length === 0) return '_No results_'
    // Check if it's a simple string array
    if (output.every(item => typeof item === 'string')) {
      return output.map(f => `- \`${f}\``).join('\n')
    }
    return wrapInCodeBlock(JSON.stringify(output, null, 2), 'json')
  }

  // Default: JSON
  return wrapInCodeBlock(JSON.stringify(output, null, 2), 'json')
}

function wrapInCodeBlock(content: string, lang: string): string {
  return `\`\`\`${lang}\n${content}\n\`\`\``
}

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val)
}

function detectLanguage(tool: string, content: string): string {
  const toolLower = tool.toLowerCase()
  if (toolLower === 'bash') return 'bash'
  if (toolLower === 'grep') return 'text'

  // Try to detect from content
  if (content.startsWith('diff ') || content.includes('\n+') && content.includes('\n-')) {
    return 'diff'
  }
  if (content.startsWith('{') || content.startsWith('[')) {
    return 'json'
  }

  return 'text'
}

function detectLanguageFromPath(path?: string): string {
  if (!path) return 'text'

  const ext = path.split('.').pop()?.toLowerCase()
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    md: 'markdown',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    html: 'html',
    css: 'css',
    sh: 'bash',
    bash: 'bash',
  }

  return langMap[ext || ''] || 'text'
}

// Markdown renderer with styling
function MarkdownOutput({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none p-3 prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-code:text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ children }) => (
            <pre className="bg-zinc-900 text-zinc-100 p-3 rounded-md overflow-x-auto text-sm">
              {children}
            </pre>
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className
            if (isInline) {
              return (
                <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>
                  {children}
                </code>
              )
            }
            return <code className={className} {...props}>{children}</code>
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
