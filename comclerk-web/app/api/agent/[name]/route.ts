// [COMCLERK-ADDED] 2025-12-01: Agent CRUD API - Update/Delete agent
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import yaml from 'yaml'
import matter from 'gray-matter'

const PDFS_DIR = path.join(process.cwd(), 'public', 'pdfs')
const AGENT_DIR = path.join(PDFS_DIR, '.opencode', 'agent')
const CONFIG_PATH = path.join(PDFS_DIR, 'opencode.json')

const BUILT_IN_AGENTS = ['general', 'explore', 'build', 'plan']

interface AgentUpdateInput {
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

// GET /api/agent/[name] - Get single agent
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params

    if (BUILT_IN_AGENTS.includes(name)) {
      return NextResponse.json({ error: 'Cannot get built-in agent details via this API' }, { status: 400 })
    }

    const mdPath = path.join(AGENT_DIR, `${name}.md`)

    try {
      await fs.access(mdPath)
    } catch {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const content = await fs.readFile(mdPath, 'utf-8')
    const parsed = matter(content)

    // Also get settings from opencode.json
    const config = await readOpencodeJson()
    const agentConfig = ((config.agent as Record<string, unknown>) || {})[name] as Record<string, unknown> || {}

    return NextResponse.json({
      name,
      description: parsed.data.description || '',
      mode: parsed.data.mode || 'all',
      temperature: parsed.data.temperature,
      topP: parsed.data.top_p,
      color: parsed.data.color,
      prompt: parsed.content.trim(),
      model: agentConfig.model,
      permission: agentConfig.permission,
      tools: agentConfig.tools,
      builtIn: false,
    })
  } catch (error) {
    console.error('Failed to get agent:', error)
    return NextResponse.json({ error: 'Failed to get agent' }, { status: 500 })
  }
}

// PATCH /api/agent/[name] - Update agent
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params
    const input: AgentUpdateInput = await request.json()

    if (BUILT_IN_AGENTS.includes(name)) {
      return NextResponse.json({ error: 'Cannot modify built-in agent' }, { status: 400 })
    }

    const mdPath = path.join(AGENT_DIR, `${name}.md`)

    // Check if agent exists
    try {
      await fs.access(mdPath)
    } catch {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Read existing .md file
    const content = await fs.readFile(mdPath, 'utf-8')
    const parsed = matter(content)

    // Update frontmatter fields
    const frontmatter: Record<string, unknown> = { ...parsed.data }
    if (input.description !== undefined) frontmatter.description = input.description
    if (input.mode !== undefined) frontmatter.mode = input.mode
    if (input.temperature !== undefined) frontmatter.temperature = input.temperature
    if (input.topP !== undefined) frontmatter.top_p = input.topP
    if (input.color !== undefined) frontmatter.color = input.color

    // Update prompt content
    const promptContent = input.prompt !== undefined ? input.prompt : parsed.content.trim()

    // Write updated .md file
    const mdContent = `---
${yaml.stringify(frontmatter).trim()}
---

${promptContent}
`
    await fs.writeFile(mdPath, mdContent)

    // Update opencode.json if model/permission/tools changed
    const jsonSettings: Record<string, unknown> = {}
    if (input.model !== undefined) jsonSettings.model = input.model
    if (input.permission !== undefined) jsonSettings.permission = input.permission
    if (input.tools !== undefined) jsonSettings.tools = input.tools

    if (Object.keys(jsonSettings).length > 0) {
      await updateOpencodeJson(name, jsonSettings)
    }

    return NextResponse.json({ success: true, name })
  } catch (error) {
    console.error('Failed to update agent:', error)
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 })
  }
}

// DELETE /api/agent/[name] - Delete agent
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params

    if (BUILT_IN_AGENTS.includes(name)) {
      return NextResponse.json({ error: 'Cannot delete built-in agent' }, { status: 400 })
    }

    const mdPath = path.join(AGENT_DIR, `${name}.md`)

    // Check if agent exists
    try {
      await fs.access(mdPath)
    } catch {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // 1. Delete .md file
    await fs.unlink(mdPath)

    // 2. Remove from opencode.json
    await updateOpencodeJson(name, null)

    return NextResponse.json({ success: true, name })
  } catch (error) {
    console.error('Failed to delete agent:', error)
    return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 })
  }
}
