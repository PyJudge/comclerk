# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ComClerk (컴퓨터 법률 서기) is a Next.js-based web application for processing legal documents (dockets) with PDF viewing and chat functionality. The project implements a three-panel layout design with file-system based storage and memory-based chat sessions.

## Development Commands

```bash
# Start development server (uses Turbopack for faster builds)
npm run dev

# Build for production (uses Turbopack)
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## Architecture Overview

### Three-Panel Layout Design
The application uses a fixed three-panel layout:
- **Left Panel**: PDF file list sidebar (320px width)
- **Center Panel**: PDF viewer (flexible width)  
- **Right Panel**: Chat interface (384px width)

### Technology Stack
- **Framework**: Next.js 15.5.3 with App Router and Turbopack
- **Language**: TypeScript with strict configuration
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **UI Components**: shadcn/ui with "new-york" style and neutral color scheme
- **Icons**: Lucide React
- **Storage**: File system based (no database)
- **Chat**: Memory-based sessions (non-persistent)

### Key Architectural Decisions

#### File System Storage
- PDF files stored in `public/uploads/`
- No database - metadata extracted from file system
- Upload directory structure created during setup

#### API Routes Structure
```
/api/upload   - PDF file upload handling
/api/files    - File list retrieval  
/api/stream   - LLM streaming with Server-Sent Events
```

#### Component Organization
- UI components in `src/components/ui/` (shadcn/ui managed)
- Custom components will be in `src/components/`
- Hooks planned for `src/hooks/` (use-files.ts, use-chat.ts)

### Development Workflow

#### Path Aliases
TypeScript configured with `@/*` mapping to `./src/*` for clean imports.

#### shadcn/ui Integration
- Configured with "new-york" style
- CSS variables enabled for theming
- Components installed: button, card, separator
- Add new components with: `npx shadcn@latest add [component]`

#### Tailwind CSS v4
- Uses modern inline configuration in globals.css
- Dark mode support configured
- CSS custom properties for consistent theming

### Current Implementation Status

**Phase 1 Complete:**
- ✅ Next.js project setup with TypeScript
- ✅ shadcn/ui configuration and basic components
- ✅ Three-panel layout implementation
- ✅ API route structure and uploads directory

**Phase 2 Planned (PDF Functionality):**
- File upload API implementation
- PDF.js viewer integration
- Dynamic file list reading
- Drag-and-drop upload UI

**Phase 3 Planned (Chat System):**
- Chat panel components
- Memory-based message state
- LLM streaming mock implementation
- Server-Sent Events integration

### Important Notes

#### Project Location
The project is nested in `D:\Developer\comclerk\comclerk\` - always ensure you're in the correct directory when running commands.

#### Development Server
- Runs on http://localhost:3000
- Uses Turbopack for enhanced performance
- Hot reloading enabled for rapid development

#### Code Style
- ESLint configured with Next.js and TypeScript rules
- Strict TypeScript configuration enforced
- shadcn/ui components follow consistent patterns

This is a minimal viable product approach - features are implemented with simplicity in mind, with clear extension points for future enhancement.

## Testing Requirements

### Mandatory Testing Protocol
**CRITICAL**: All development work must be validated through testing before completion.

#### Testing Rules
1. **No work is considered complete until tests pass**
2. **Run tests for every significant change**
3. **Fix failing tests immediately - do not proceed with broken tests**
4. **Test both happy path and error scenarios**

#### Test Types
- **E2E Tests**: Playwright tests for complete user workflows (see `test.md`)
- **API Tests**: Direct API endpoint testing with curl/Postman
- **Component Tests**: Individual component functionality verification
- **Error Handling**: Ensure application stability during error conditions

#### Test Execution
```bash
# E2E Testing
npm run test:e2e                         # Full test suite
npm run test:e2e -- --grep "@critical"   # Critical user flows
npm run test:e2e -- --grep "@error"      # Error handling

# Manual API Testing
curl -X POST http://localhost:3000/api/upload -F "file=@test.pdf"
curl http://localhost:3000/api/files
```

#### Error Handling Standards
- **Application must never crash from user errors**
- **Show user-friendly error messages**
- **Maintain application functionality during error states**
- **Provide clear recovery paths for users**

**Remember**: A feature that works in development but fails in testing is not complete. Test-driven development ensures reliability and user satisfaction.