# sdk/CLAUDE.md

TypeScript SDK for the OpenCode backend API. **Do not manually edit files in `sdk/src/gen/`** - they are auto-generated.

## Structure

```
sdk/src/
├── client.ts          # Client factory (editable)
├── server.ts          # Server-side utilities (editable)
├── index.ts           # Public exports (editable)
└── gen/               # AUTO-GENERATED - do not edit
    ├── types.gen.ts   # API types
    ├── sdk.gen.ts     # OpencodeClient class
    └── client/        # HTTP client utilities
```

## Client Usage

```typescript
import { createOpencodeClient } from '@opencode-ai/sdk/client'

const client = createOpencodeClient({
  baseUrl: 'http://localhost:4096',
  directory: '/path/to/project',  // Sets x-opencode-directory header
})

// API calls
await client.session.list()
await client.session.prompt({ path: { id }, body: { parts } })
await client.event.subscribe({ signal })
```

## SDK Regeneration

Generated files come from OpenAPI spec. When backend API changes:
1. Obtain updated OpenAPI spec from backend
2. Regenerate using openapi-typescript or similar tool
3. Only `gen/` directory should change
