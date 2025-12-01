# hooks/CLAUDE.md

Custom React hooks for OpenCode API interactions. All hooks use React Query for caching and state management.

## Hook Organization

| Hook | Purpose |
|------|---------|
| `use-session.ts` | Single session operations, message sending, polling |
| `use-sessions.ts` | Session list CRUD |
| `use-events.ts` | SSE subscriptions for real-time updates |
| `use-app.ts` | App config, agents, providers, tools, MCP |
| `use-auth.ts` | OAuth and API key authentication |

## Data Flow Patterns

### Message Sending (`useSendMessageAsync`)
1. Optimistic update adds user message to cache immediately
2. API call triggers backend processing
3. `startPolling()` polls every 500ms for assistant response
4. Polling stops when `message.time.completed` is set

### Real-time Events (`useSessionEvents`)
- SSE subscription via `opencode.event.subscribe()`
- Filters events by `sessionID`
- Invalidates React Query caches on relevant events
- Falls back to polling if SSE unavailable

## Query Keys

```typescript
['sessions']           // Session list
['session', id]        // Single session
['messages', sessionId] // Messages for session
['provider-data']      // Providers and models
```

## Adding New Hooks

1. Use `opencode` client from `@/lib/opencode-client`
2. Wrap with `useQuery` (reads) or `useMutation` (writes)
3. Export from `hooks/index.ts`
