# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **restored Claude Code source tree** — reconstructed from source maps with missing modules replaced by compatibility shims. Not all original code was recoverable; some areas use degraded implementations.

## Build & Run Commands

```bash
bun install          # Install dependencies and local shim packages
bun run dev          # Start the restored CLI interactively (primary entry)
bun run start        # Alias for dev
bun run version      # Verify CLI boots and prints version
bun run dev:restore-check  # Check restoration status
```

## Architecture

### Entry Flow
1. `src/bootstrap-entry.ts` — Sets up bootstrap macro, then imports `src/entrypoints/cli.tsx`
2. `src/entrypoints/cli.tsx` — CLI command registration and initialization
3. `src/main.tsx` — Main TUI application (React/Ink), handles startup, telemetry, config, and REPL launch

### Core Modules
- **`src/bridge/`** — Remote bridge/session management (remote Code sessions, peer sessions, messaging)
- **`src/commands/`** — CLI commands organized by name (e.g., `src/commands/commit/`, `src/commands/branch/`)
- **`src/components/`** — React UI components for the TUI
- **`src/hooks/`** — React hooks for state and event handling
- **`src/services/`** — Backend services (analytics, API, MCP, compact, policy)
- **`src/tools/`** — Tool definitions and implementations (AgentTool, MCP tools, etc.)
- **`src/utils/`** — Utility functions (335+ files — largest module)
- **`src/ink/`** — Ink TUI rendering utilities

### Compatibility Shims
- **`shims/`** — Local package shims for unrecoverable native/private packages:
  - `ant-claude-for-chrome-mcp/`, `ant-computer-use-mcp/`, `ant-computer-use-input/`, `ant-computer-use-swift/`
  - `color-diff-napi/`, `modifiers-napi/`, `url-handler-napi/`
- **`vendor/`** — Bundled vendor code

### Key Types and Classes
- `QueryEngine` (`src/QueryEngine.ts`) — Core query execution engine
- `Task` (`src/Task.ts`) — Task abstraction
- `Tool` (`src/Tool.ts`) — Tool definitions and input JSON schemas
- `getTools` (`src/tools.ts`) — Central tool registry

## Code Style

- **TypeScript-first** with ESM imports
- **React-JSX** for UI (using Ink reconciliation)
- **No semicolons**, single quotes, descriptive camelCase for vars/functions
- **PascalCase** for React components and manager classes
- **kebab-case** for command folder names (e.g., `src/commands/install-slack-app/`)
- `bun:bundle` feature flags for conditional imports (dead code elimination)
- Import markers (`// biome-ignore-all assist/source/organizeImports`) must not be reordered

## Feature Flags

Conditional features use `feature()` from `bun:bundle`:
- `COORDINATOR_MODE` — Coordinator multi-agent mode
- `KAIROS` — Assistant mode
- `REACTIVE_COMPACT` — Reactive context compaction
- `CONTEXT_COLLAPSE` — Context collapse feature
- `BREAK_CACHE_COMMAND` — Cache breaking for debugging

## Restoration Notes

This is reconstructed source, not pristine upstream. Some modules contain fallbacks or shims from the restoration process. Prefer minimal, auditable changes and document any workaround added due to degraded implementations.

## Dependencies

- **Runtime**: Bun 1.3.5+, Node.js 24+
- **Package manager**: Bun (lockfile: `bun.lock`)
- **tsconfig**: ESNext target, bundler module resolution, react-jsx
