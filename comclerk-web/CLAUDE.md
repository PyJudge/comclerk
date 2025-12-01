# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenCode Web is a Next.js 14 web frontend for the OpenCode AI coding assistant. It provides a chat-based interface for interacting with AI models through the OpenCode backend API.

## Commands

```bash
# Development
bun dev                    # Start dev server on port 3001

# Build & Production
bun build                  # Build for production
bun start                  # Start production server

# Quality
bun lint                   # Run ESLint

# Testing
bun test:e2e              # Run Playwright E2E tests
bunx playwright test e2e/TC-000-app-access.spec.ts  # Run single E2E test
```

## Architecture

### SDK Layer (`sdk/`)
Auto-generated TypeScript client from OpenAPI spec. Creates `OpencodeClient` for API communication.
- `sdk/src/client.ts` - Client factory with directory header support
- `sdk/src/gen/` - Generated types and API methods (do not edit)

### State Management
- **React Query** (`@tanstack/react-query`) - Server state, caching, and data fetching
- **Zustand** (`stores/`) - Client-side session state
- **React Context** (`contexts/`) - Model/provider selection

### Custom Hooks (`hooks/`)
All API interactions go through hooks that wrap the SDK:
- `use-session.ts` - Session CRUD, message sending, polling for responses
- `use-sessions.ts` - Session list management
- `use-events.ts` - SSE event subscriptions for real-time updates
- `use-app.ts` - Agents, providers, config, tools, MCP status
- `use-auth.ts` - OAuth flow and API key management

### Key Patterns
- **Optimistic updates** in `useSendMessageAsync` - User messages appear instantly
- **Polling fallback** when SSE unavailable (`useMessagePolling`)
- **Message transformation** - API responses (`ApiMessage`) converted to UI format (`Message`) via `transformApiMessage`

### Environment Variables
- `NEXT_PUBLIC_OPENCODE_API_URL` - Backend URL (default: `http://localhost:4096`)
- `OPENCODE_API_URL` - Server-side backend URL

## File Naming Conventions

- E2E tests: `e2e/TC-XXX-*.spec.ts` with corresponding `e2e/scenarios/TC-XXX-*.md`
- Components organized by feature: `components/{feature}/{component}.tsx`

## Folder-Specific Documentation

See CLAUDE.md files in subdirectories for detailed context:
- `hooks/CLAUDE.md` - Hook patterns and data flow
- `sdk/CLAUDE.md` - SDK structure and regeneration
- `components/CLAUDE.md` - Component organization
