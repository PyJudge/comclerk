# components/CLAUDE.md

React components organized by feature domain.

## Directory Structure

```
components/
├── chat/          # Chat interface components
│   ├── chat-container.tsx   # Main chat wrapper
│   ├── message-list.tsx     # Message display
│   ├── message-item.tsx     # Single message rendering
│   └── message-input.tsx    # Input field with send
├── session/       # Session management
│   ├── session-list.tsx     # Sidebar session list
│   ├── session-view.tsx     # Session detail view
│   ├── session-header.tsx   # Session title/actions
│   └── export-dialog.tsx    # Export session dialog
├── settings/      # Settings & configuration
│   ├── settings-form.tsx    # Main settings form
│   ├── provider-config.tsx  # Provider setup
│   ├── oauth-login.tsx      # OAuth flow UI
│   └── agent-selector.tsx   # Agent selection
├── layout/        # Layout components
│   └── sidebar.tsx          # Main sidebar navigation
├── tool/          # Tool output rendering
│   └── tool-output.tsx      # Tool call results
└── providers/     # React context providers
    └── query-provider.tsx   # React Query setup
```

## Component Patterns

- All components are client components (`'use client'`)
- Use hooks from `@/hooks` for data fetching
- Styling via Tailwind CSS
- Types from `@/types`

## Message Parts Rendering

Messages contain `parts[]` with different types:
- `text` - Markdown text content
- `tool` - Tool invocation with input/output
- `file` - File attachments
- `reasoning` - Model reasoning (thinking)
- `step-start`/`step-finish` - Step boundaries with token info
