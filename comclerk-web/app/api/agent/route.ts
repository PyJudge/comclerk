// [COMCLERK-ADDED] 2025-12-01: Agent CRUD API - Create agent
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import yaml from 'yaml'

const PDFS_DIR = path.join(process.cwd(), 'public', 'pdfs')
const AGENT_DIR = path.join(PDFS_DIR, '.opencode', 'agent')
const CONFIG_PATH = path.join(PDFS_DIR, 'opencode.json')

const BUILT_IN_AGENTS = ['general', 'explore', 'build', 'plan']

interface AgentInput {
  name: string
  description?: string
  mode?: 'primary' | 'subagent' | 'all'
  temperature?: number
  topP?: number
  color?: string
  prompt?: string
  model?: string
  permission?: Record<string, unknown>
  tools?: Record<string, boolean>
}

// Helper: Read and parse opencode.json
async function readOpencodeJson(): Promise<Record<string, unknown>> {
  try {
    const content = await fs.readFile(CONFIG_PATH, 'utf-8')
    return JSON.parse(content)
  } catch {
    return {}
  }
}

// Helper: Write opencode.json
async function writeOpencodeJson(config: Record<string, unknown>): Promise<void> {
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2))
}

// Helper: Update agent section in opencode.json
async function updateOpencodeJson(
  agentName: string,
  settings: Record<string, unknown> | null
): Promise<void> {
  const config = await readOpencodeJson()

  if (!config.agent) config.agent = {}
  const agents = config.agent as Record<string, unknown>

  if (settings === null) {
    delete agents[agentName]
  } else {
    agents[agentName] = { ...((agents[agentName] as Record<string, unknown>) || {}), ...settings }
  }

  await writeOpencodeJson(config)
}

// GET /api/agent - List custom agents (from .md files)
export async function GET() {
  try {
    await fs.mkdir(AGENT_DIR, { recursive: true })

    const files = await fs.readdir(AGENT_DIR)
    const mdFiles = files.filter(f => f.endsWith('.md'))

    const agents = await Promise.all(
      mdFiles.map(async (file) => {
        const name = file.replace('.md', '')
        const content = await fs.readFile(path.join(AGENT_DIR, file), 'utf-8')

        // Parse frontmatter
        const matter = await import('gray-matter')
        const parsed = matter.default(content)

        return {
          name,
          description: parsed.data.description || '',
          mode: parsed.data.mode || 'all',
          temperature: parsed.data.temperature,
          topP: parsed.data.top_p,
          color: parsed.data.color,
          prompt: parsed.content.trim(),
          builtIn: false,
        }
      })
    )

    return NextResponse.json(agents)
  } catch (error) {
    console.error('Failed to list agents:', error)
    return NextResponse.json({ error: 'Failed to list agents' }, { status: 500 })
  }
}

// POST /api/agent - Create new agent
export async function POST(request: NextRequest) {
  try {
    const input: AgentInput = await request.json()

    if (!input.name || typeof input.name !== 'string') {
      return NextResponse.json({ error: 'Agent name is required' }, { status: 400 })
    }

    // Validate name (alphanumeric, hyphens, underscores only)
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(input.name)) {
      return NextResponse.json(
        { error: 'Invalid agent name. Use letters, numbers, hyphens, and underscores. Must start with a letter.' },
        { status: 400 }
      )
    }

    if (BUILT_IN_AGENTS.includes(input.name)) {
      return NextResponse.json({ error: 'Cannot create built-in agent' }, { status: 400 })
    }

    // Check if agent already exists
    const mdPath = path.join(AGENT_DIR, `${input.name}.md`)
    try {
      await fs.access(mdPath)
      return NextResponse.json({ error: 'Agent already exists' }, { status: 409 })
    } catch {
      // File doesn't exist, we can create it
    }

    // 1. Create .md file with YAML frontmatter
    const frontmatter: Record<string, unknown> = {}
    if (input.description) frontmatter.description = input.description
    if (input.mode) frontmatter.mode = input.mode
    if (input.temperature !== undefined) frontmatter.temperature = input.temperature
    if (input.topP !== undefined) frontmatter.top_p = input.topP
    if (input.color) frontmatter.color = input.color

    const mdContent = `---
${yaml.stringify(frontmatter).trim()}
---

${input.prompt || ''}
`

    await fs.mkdir(AGENT_DIR, { recursive: true })
    await fs.writeFile(mdPath, mdContent)

    // 2. Update opencode.json with advanced settings
    const jsonSettings: Record<string, unknown> = {}
    if (input.model) jsonSettings.model = input.model
    if (input.permission) jsonSettings.permission = input.permission
    if (input.tools) jsonSettings.tools = input.tools

    if (Object.keys(jsonSettings).length > 0) {
      await updateOpencodeJson(input.name, jsonSettings)
    }

    return NextResponse.json({ success: true, name: input.name })
  } catch (error) {
    console.error('Failed to create agent:', error)
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 })
  }
}
