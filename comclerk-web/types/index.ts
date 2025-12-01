// Shared type definitions for OpenCode Next.js Web App

// Message Part types
export interface TextPart {
  id: string
  type: 'text'
  text: string
  time?: { start?: number; end?: number }
}

export interface FilePart {
  id: string
  type: 'file'
  mime: string
  filename?: string
  url: string
}

export interface ReasoningPart {
  id: string
  type: 'reasoning'
  text: string
}

export interface ToolPart {
  id: string
  type: 'tool'
  tool?: string
  state?: 'pending' | 'running' | 'completed' | 'error'
  input?: Record<string, unknown>
  output?: unknown
  error?: string
}

export interface StepStartPart {
  id: string
  type: 'step-start'
  snapshot?: string
}

export interface StepFinishPart {
  id: string
  type: 'step-finish'
  reason?: string
  snapshot?: string
  cost?: number
  tokens?: MessageTokens
}

export type Part = TextPart | FilePart | ReasoningPart | ToolPart | StepStartPart | StepFinishPart

// Message types
export interface MessageTokens {
  input: number
  output: number
  reasoning: number
  cache?: { read: number; write: number }
}

export interface MessageError {
  type: string
  message?: string
}

// API response structure for messages
export interface ApiMessageInfo {
  id: string
  sessionID: string
  role: 'user' | 'assistant'
  time: { created: number; completed?: number }
  parentID?: string
  modelID?: string
  providerID?: string
  cost?: number
  tokens?: MessageTokens
  finish?: string
  summary?: {
    title?: string
    body?: string
    diffs?: unknown[]
  }
  model?: {
    providerID: string
    modelID: string
  }
}

export interface ApiMessage {
  info: ApiMessageInfo
  parts: Part[]
}

// Transformed message for UI components
export interface Message {
  id: string
  sessionID: string
  role: 'user' | 'assistant'
  time: { created: number; completed?: number }
  parts: Part[]
  parentID?: string
  modelID?: string
  providerID?: string
  cost?: number
  tokens?: MessageTokens
  finish?: string
  error?: MessageError
}

// Keep old types for compatibility
export type UserMessage = Message & { role: 'user' }
export type AssistantMessage = Message & { role: 'assistant' }

// Transform API message to UI message
export function transformApiMessage(apiMsg: ApiMessage): Message {
  return {
    id: apiMsg.info.id,
    sessionID: apiMsg.info.sessionID,
    role: apiMsg.info.role,
    time: apiMsg.info.time,
    parts: apiMsg.parts,
    parentID: apiMsg.info.parentID,
    modelID: apiMsg.info.modelID,
    providerID: apiMsg.info.providerID,
    cost: apiMsg.info.cost,
    tokens: apiMsg.info.tokens,
    finish: apiMsg.info.finish,
  }
}

// Session types
export interface Session {
  id: string
  title?: string
  directory: string
  projectID?: string
  version?: string
  time: {
    created: number
    updated: number
  }
  summary?: {
    additions?: number
    deletions?: number
    files?: number
  }
}

export interface SessionStatus {
  sessionID: string
  running: boolean
  progress?: number
}

// Provider types
export interface Provider {
  id: string
  name?: string
  env?: string[]
}

// Agent types
export interface Agent {
  id: string
  name?: string
  description?: string
  model?: {
    providerID: string
    modelID: string
  }
}

// Event types
export interface Event {
  type: string
  properties?: {
    sessionID?: string
    info?: unknown
    [key: string]: unknown
  }
}

export interface GlobalEvent {
  directory: string
  payload: Event
}
