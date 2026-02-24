# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. Users describe components in a chat interface, Claude generates them via tool calling, and a live preview renders the result. The app supports both authenticated (project persistence) and anonymous usage. Without an `ANTHROPIC_API_KEY`, a mock provider returns static responses.

## Commands

```bash
npm run setup          # Install deps + generate Prisma client + run migrations
npm run dev            # Dev server with Turbopack (http://localhost:3000)
npm run build          # Production build
npm run lint           # ESLint (Next.js preset)
npm run test           # Vitest (all tests)
npx vitest run src/components/chat/__tests__/MessageList.test.tsx  # Single test file
npm run db:reset       # Reset SQLite database
```

## Architecture

### Stack
Next.js 15 (App Router) / React 19 / TypeScript / Tailwind CSS v4 / Prisma (SQLite) / Vercel AI SDK / shadcn/ui

### Core Data Flow
1. User sends message → `ChatInterface` → `POST /api/chat` (`src/app/api/chat/route.ts`)
2. Server streams response via Vercel AI SDK's `streamText` with tool calling (up to 40 steps)
3. Claude uses `str_replace_editor` and `file_manager` tools to modify a `VirtualFileSystem` (in-memory, no disk writes)
4. File changes propagate through `FileSystemContext` → `CodeEditor` (Monaco) + `PreviewFrame` (iframe with Babel JSX transform)

### Key Modules
- **`src/lib/provider.ts`** — AI provider factory. Uses `claude-haiku-4-5` with Anthropic SDK, falls back to `MockLanguageModel` when no API key is set.
- **`src/lib/file-system.ts`** — `VirtualFileSystem` class that manages an in-memory file tree. Serialized to/from JSON for persistence.
- **`src/lib/tools/`** — AI tool definitions (`str_replace_editor` for file create/edit, `file_manager` for directory ops) that operate on the virtual FS.
- **`src/lib/prompts/generation.tsx`** — System prompt instructing Claude to generate React+Tailwind components with `/App.jsx` as entrypoint.
- **`src/lib/contexts/`** — React contexts for chat state (`chat-context.tsx`) and file system state (`file-system-context.tsx`).
- **`src/lib/transform/jsx-transformer.ts`** — Runtime JSX compilation using `@babel/standalone` for the preview iframe.
- **`src/lib/auth.ts`** — JWT session management (jose) with HTTP-only cookies, 7-day expiration.

### Layout
The UI is a three-panel resizable layout (react-resizable-panels): Chat | Editor (Monaco + FileTree) | Preview (iframe).

### Database
SQLite via Prisma. Two models: `User` (email/password auth) and `Project` (stores messages as JSON string, file system data as JSON string). Prisma client is generated to `src/generated/prisma/`.

### Server Actions
`src/actions/` contains Next.js server actions for project CRUD (`create-project.ts`, `get-project.ts`, `get-projects.ts`).

## Testing

Vitest with jsdom environment and React Testing Library. Tests live in `__tests__/` directories adjacent to their source files. Path aliases (`@/*`) are resolved via `vite-tsconfig-paths`.
