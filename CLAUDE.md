# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ComClerk는 법률 문서 분석을 위한 AI 코딩 에이전트입니다. 이 저장소는 세 가지 주요 구성 요소를 포함합니다:

- **comclerk-backend/** - 백엔드 서버 (OpenCode 기반, Bun + Turborepo)
- **comclerk-web/** - Next.js 웹 프론트엔드
- **pdfs/** - 법률 문서 PDF 작업 폴더

## Origin Tracking (변경 추적 규칙)

> **중요**: `comclerk-backend`는 [OpenCode](https://github.com/opencode-ai/opencode) 프로젝트에서 fork되었습니다.
> 원본 코드를 수정할 때는 반드시 아래 규칙을 따르세요.

### 변경 표시 규칙

1. **파일 수정 시**: 파일 상단에 주석으로 변경 이력 추가
```typescript
// [COMCLERK-MODIFIED] 2024-XX-XX: 설명
// Original: opencode/packages/opencode/src/...
```

2. **새 파일 추가 시**: 파일 상단에 표시
```typescript
// [COMCLERK-ADDED] 2024-XX-XX: 설명
```

3. **파일 삭제 시**: CHANGELOG.md에 기록 (삭제된 파일 경로와 이유)

4. **설정 변경 시**: 변경된 설정 파일에 인라인 주석
```json
// [COMCLERK-CONFIG] 변경 이유
```

### 변경 로그 유지

`comclerk-backend/CHANGELOG-COMCLERK.md` 파일에 모든 주요 변경 사항을 기록합니다.

## Quick Start

```bash
# 전체 서버 실행 (백엔드 API + 프론트엔드)
./start.sh

# 개별 실행
./start.sh backend               # 백엔드 API만 (http://localhost:4096)
./start.sh web                   # 프론트엔드만 (http://localhost:4000)

# 수동 실행
cd comclerk-backend && bun run --cwd packages/opencode src/index.ts serve --port 4096
cd comclerk-web && NEXT_PUBLIC_OPENCODE_API_URL=http://localhost:4096 bun dev
```

## Development Philosophy

### Core Principles

- **Delegate to sub-folders**: Each package has its own concerns; avoid cross-cutting changes unless necessary
- **TDD approach**: Write tests first, then implement. Run tests frequently during development
- **Elegant algorithms over defensive code**: Solve problems with clean, minimal logic rather than wrapping everything in try-catch
- **Fail fast**: Let errors propagate naturally; avoid defensive programming that hides bugs
- **Immutability**: Prefer `const` over `let`; use functional patterns
- **Single-word naming**: Choose concise identifiers when they remain descriptive

### Code Style (Strictly Enforced)

- **NO unnecessary try/catch**: Only catch errors at boundaries where recovery is possible
- **NO else statements**: Use early returns, guard clauses, or ternary expressions
- **NO unnecessary destructuring**: `foo.bar.baz` is fine; don't destructure just to destructure
- **NO `any` type**: Use precise types; reach for Zod schemas for runtime validation
- **NO `let`**: Prefer `const` and immutable patterns
- **Prefer Bun APIs**: Use `Bun.file()`, `Bun.write()`, etc. over Node.js equivalents

## Commands

### comclerk-backend/ (Backend Server)

```bash
# Development
bun install          # Install all dependencies
bun dev              # Run server in dev mode

# Testing
bun test             # Run all tests
bun test test/tool/bash.test.ts  # Run specific test file

# Type checking
bun turbo typecheck  # Typecheck all packages
```

### comclerk-web/ (Next.js Frontend)

```bash
bun dev              # Start dev server on port 3000
bun build            # Production build
bun lint             # ESLint
bun test:e2e         # Playwright E2E tests
```

### pdfs/ (PDF 작업 폴더)

```bash
# PDF 파일은 git에서 제외됨
# 법률 문서를 이 폴더에 저장하여 작업
```

### PDF 심볼릭 링크 설정

웹앱에서 PDF 파일에 접근하려면 `comclerk-web/public/pdfs` 심볼릭 링크가 필요합니다.

```bash
# 프로젝트 루트에서 실행 (상대 경로 사용)
cd comclerk-web/public
ln -s ../../pdfs pdfs

# 확인
ls -la pdfs  # ../../pdfs 를 가리켜야 함
```

> **참고**: 심볼릭 링크는 `.gitignore`에 포함되어 있어 각 개발 환경에서 수동 생성 필요

## Architecture

### comclerk-backend/packages/

| Package | Purpose |
|---------|---------|
| `opencode` | Core business logic, CLI, server, and TUI (SolidJS + opentui) |
| `desktop` | SolidJS desktop app using Tauri |
| `web` | Marketing/docs website |
| `console/app` | Web console app |
| `sdk/js` | Auto-generated TypeScript client SDK |
| `sdk/go` | Go SDK for the API |
| `sdk/python` | Python SDK |
| `plugin` | Plugin system (`@opencode-ai/plugin`) |
| `ui` | Shared UI components |
| `util` | Shared utilities |

### comclerk-backend/packages/opencode/src/

Core namespaces (use `Namespace.method()` pattern):

| Directory | Namespace | Purpose |
|-----------|-----------|---------|
| `tool/` | `Tool` | AI tool implementations (bash, edit, read, write, grep, glob, etc.) |
| `session/` | `Session` | Session management, message handling |
| `provider/` | `Provider` | LLM provider integrations (Anthropic, OpenAI, Google, etc.) |
| `server/` | Server | HTTP API server (Hono framework) |
| `lsp/` | `LSP` | Language Server Protocol support |
| `mcp/` | `MCP` | Model Context Protocol integration |
| `project/` | `Project` | Multi-project and worktree support |
| `config/` | `Config` | Configuration loading and validation |
| `agent/` | `Agent` | Agent definitions (build, plan, general) |

### comclerk-web/

Standard Next.js 14 structure with:
- `sdk/` - Auto-generated TypeScript API client
- `hooks/` - React Query hooks wrapping SDK calls
- `stores/` - Zustand for client state
- `contexts/` - Model/provider selection context

## Key Patterns

### Tool Implementation

Tools implement `Tool.Info` interface with `execute()` method. All inputs validated with Zod schemas.

### Server SDK Regeneration

After modifying `packages/opencode/src/server/server.ts`, regenerate the JS SDK:
```bash
./packages/sdk/js/script/build.ts
```

### Namespace Pattern

```typescript
// Good - use namespace pattern
import { Session } from "./session"
const s = Session.create()

// Good - use App.provide() for DI
import { App } from "./app"
App.provide({ storage: Storage.create() })
```

### Logging

```typescript
import { Log } from "./util/log"
const log = Log.create({ service: "my-service" })
log.info("message", { data: "value" })
```

### Config Hot Reload

`.opencode/agent/*.md`, `.opencode/mode/*.md`, `.opencode/command/*.md` 파일 및 `opencode.json` 변경 시 서버 재시작 없이 자동 반영됩니다.

**구현 파일:**
- `src/config/watcher.ts` - Node.js `fs.watch` 기반 ConfigWatcher
- `src/project/bootstrap.ts` - ConfigWatcher.init() 호출

**동작 방식:**
1. 파일 변경 감지 (fs.watch)
2. 300ms debounce
3. `Instance.dispose()` 호출로 캐시 무효화
4. 다음 API 요청 시 설정 자동 재로드

**수동 테스트:**
```bash
# 서버 실행 중에
curl -s http://localhost:4096/agent | jq '.[].name'  # 현재 agent 목록

# agent 파일 수정
echo '...' > pdfs/.opencode/agent/test.md

# 1초 후 확인 - 변경사항 자동 반영
sleep 1 && curl -s http://localhost:4096/agent | jq '.[].name'
```

## Testing Guidelines

- Tests live in `packages/opencode/test/` mirroring `src/` structure
- Use Bun's test runner: `bun test`
- Test files: `*.test.ts`
- Fixtures in `test/fixture/`

## PR Guidelines

- Keep PRs small and focused
- Link relevant issues
- Explain the issue and fix rationale
- Verify behavior doesn't already exist elsewhere before adding new functionality

## Folder Structure

```
comclerk/
├── comclerk-backend/    # OpenCode 기반 백엔드 (Bun + Turborepo)
├── comclerk-web/        # Next.js 프론트엔드
├── pdfs/                # PDF 작업 폴더 (git에서 PDF 제외)
├── start.sh             # 개발 서버 실행 스크립트
├── .gitignore           # Git 제외 규칙
└── CLAUDE.md            # 이 파일
```
