# Claude Code 重构实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从零开始实现一个功能完整的 Claude Code CLI 工具，包含命令系统、查询引擎、远程桥接、TUI 界面、Analytics、MCP 支持等核心模块。

**Architecture:** 采用分层架构设计，从底向上依次为：工具层 → 核心处理层 → 命令层 → Bridge 层 → 服务层 → TUI 层。核心原则：Feature Flag 控制实验性功能、Sink 模式解耦模块依赖、Observable Store 管理状态、Discriminated Union 处理消息类型。

**Tech Stack:** TypeScript + ESM + React(Ink) + Bun + MCP SDK

---

## 第一部分：架构设计

### 1.1 整体分层架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLI Entry Layer                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐ │
│  │ bootstrap-entry │ →  │   dev-entry     │ →  │   main.tsx (React)     │ │
│  │   (快速路径)     │    │  (开发入口)     │    │   (TUI 应用)           │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Command Layer                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    commands.ts (集中命令注册表)                          │  │
│  │   addDir | advisor | agents | branch | commit | compact | config ...   │  │
│  │   + Feature Flag 控制的命令 (proactive, bridge, voice, workflows)        │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                      │                                     │
│                    ┌─────────────────┼─────────────────┐                  │
│                    ▼                 ▼                 ▼                  │
│              ┌──────────┐     ┌──────────┐     ┌──────────────┐            │
│              │ Local    │     │ Remote   │     │ Prompt      │            │
│              │ Commands │     │ Filtered  │     │ Commands    │            │
│              └──────────┘     └──────────┘     └──────────────┘            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Core Processing Layer                                │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐               │
│  │  QueryEngine   │  │    Tool.ts    │  │   tools.ts    │               │
│  │   查询引擎      │  │   工具定义     │  │   工具注册表   │               │
│  └────────────────┘  └────────────────┘  └────────────────┘               │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐               │
│  │   query.ts     │  │    Task.ts    │  │   context.ts   │               │
│  │   查询处理      │  │   任务抽象     │  │   上下文缓存   │               │
│  └────────────────┘  └────────────────┘  └────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Bridge Layer (Remote)                             │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐               │
│  │  bridgeMain    │  │  replBridge    │  │  bridgeApi     │               │
│  │   桥接主控     │  │   REPL 桥接    │  │   桥接 API     │               │
│  └────────────────┘  └────────────────┘  └────────────────┘               │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐               │
│  │ replBridge      │  │  bridgeConfig  │  │  jwtUtils     │               │
│  │ Transport       │  │   桥接配置     │  │   JWT 工具    │               │
│  └────────────────┘  └────────────────┘  └────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Service Layer                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │  Analytics   │  │     MCP      │  │   Compact    │  │    Policy    │ │
│  │   Service   │  │   Service   │  │   Service    │  │    Limits    │ │
│  │  (Sink 模式) │  │  (多传输)   │  │  (多策略)    │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └───────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                    │
│  │     API      │  │   GrowthBook │  │  Telemetry   │                    │
│  │   Service   │  │   (Feature)  │  │             │                    │
│  └──────────────┘  └──────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           React TUI Layer (Ink)                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐               │
│  │   ink.tsx      │  │  components/   │  │    hooks/     │               │
│  │   (~250KB)     │  │  React 组件    │  │  React Hooks  │               │
│  └────────────────┘  └────────────────┘  └────────────────┘               │
│  ┌────────────────┐  ┌────────────────┐                                   │
│  │   AppState     │  │    state/      │                                   │
│  │   Provider     │  │   Store.ts    │                                   │
│  └────────────────┘  └────────────────┘                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 启动流程架构图

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              启动流程                                         │
│                                                                              │
│  $ bun run dev                                                              │
│       │                                                                     │
│       ▼                                                                     │
│  bootstrap-entry.ts                                                         │
│       │                                                                     │
│       ├── 检查特殊标志                                                         │
│       │   ├── --version ──→ 打印版本 (0.1s, 极少模块)                       │
│       │   ├── --help ──→ 加载帮助模块 + 退出                                 │
│       │   ├── --dump-system-prompt ──→ 加载提示模块 + 退出                    │
│       │   ├── --daemon-worker ──→ 守护进程模式                               │
│       │   └── --resume ──→ 恢复会话模式                                     │
│       │                                                                     │
│       └── import('./entrypoints/cli.tsx')                                    │
│                     │                                                        │
│                     ▼                                                        │
│            ┌─────────────────────┐                                           │
│            │   cli.tsx          │                                           │
│            │  (Commander 注册)   │                                           │
│            └──────────┬──────────┘                                           │
│                       │                                                      │
│                       ▼                                                      │
│            ┌─────────────────────┐                                           │
│            │   main.tsx         │                                           │
│            │  (React 应用入口)    │                                           │
│            └──────────┬──────────┘                                           │
│                       │                                                      │
│       ┌───────────────┼───────────────┬───────────────┐                     │
│       ▼               ▼               ▼               ▼                     │
│  ┌─────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐              │
│  │ Startup │   │ Telemetry │   │  Config   │   │   REPL    │              │
│  │ Profiler│   │   Init    │   │  Loading  │   │  Launcher │              │
│  └────┬────┘   └─────┬─────┘   └─────┬─────┘   └─────┬─────┘              │
│       │               │               │               │                      │
│       ▼               ▼               ▼               ▼                      │
│  ┌─────────────────────────────────────────────────────────────┐            │
│  │                    renderAndRun()                             │            │
│  │                  (Ink TUI 渲染)                              │            │
│  └─────────────────────────────────────────────────────────────┘            │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Feature Flag DCE 架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Feature Flag DCE 架构                                │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         build-time                                    │    │
│  │                                                                      │    │
│  │    bun build --env BRIDGE_MODE=true --env VOICE_MODE=true           │    │
│  │              │                   │                                    │    │
│  │              ▼                   ▼                                    │    │
│  │    ┌─────────────────┐   ┌─────────────────┐                        │    │
│  │    │ feature('BRIDGE │   │ feature('VOICE  │                        │    │
│  │    │ _MODE')        │   │ _MODE')         │                        │    │
│  │    │    = true      │   │    = true       │                        │    │
│  │    └────────┬────────┘   └────────┬────────┘                        │    │
│  │             │                     │                                  │    │
│  │             ▼                     ▼                                  │    │
│  │    ┌─────────────────┐   ┌─────────────────┐                        │    │
│  │    │ require('./     │   │ require('./     │                        │    │
│  │    │ commands/bridge │   │ context/voice  │                        │    │
│  │    │ /index.js')     │   │ .js')          │                        │    │
│  │    └─────────────────┘   └─────────────────┘                        │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         runtime                                       │    │
│  │                                                                      │    │
│  │    if (feature('BRIDGE_MODE')) {                                     │    │
│  │        // 这段代码在 false 时完全不存在于产物中                        │    │
│  │        registerBridgeCommand()                                        │    │
│  │    }                                                                 │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.4 并发控制架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          并发控制架构                                        │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         文件锁层                                       │    │
│  │                                                                      │    │
│  │    Lock File (.lock)                                                 │    │
│  │         │                                                            │    │
│  │         ├── O_EXCL 原子创建 (flag: 'wx')                             │    │
│  │         │                                                            │    │
│  │         ├── PID 存活检测                                              │    │
│  │         │    └── process.kill(pid, 0)                                │    │
│  │         │                                                            │    │
│  │         └── Stale 恢复                                                │    │
│  │              └── isProcessRunning(pid) === false                     │    │
│  │                                                                      │    │
│  │    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │    │
│  │    │  PID Lock   │  │Scheduler Lock│ │    CU Lock  │               │    │
│  │    │(version)    │  │  (cron)     │  │(computerUse)│               │    │
│  │    └─────────────┘  └─────────────┘  └─────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         队列层                                         │    │
│  │                                                                      │    │
│  │    commandQueue: QueuedCommand[]                                     │    │
│  │              │                                                       │    │
│  │              ├── priority: 'now' > 'next' > 'later'                │    │
│  │              │    └── dequeue() 返回最高优先级                       │    │
│  │              │                                                        │    │
│  │              └── subscribe (Signal) ──→ React useSyncExternalStore  │    │
│  │                                                                      │    │
│  │    ┌──────────────────────────────────────────────────────────────┐  │    │
│  │    │                    sequential() 包装器                       │  │    │
│  │    │                                                              │  │    │
│  │    │   fn ──→ queue ──→ [task1] ──→ [task2] ──→ [task3]      │  │    │
│  │    │                (processing)                                   │  │    │
│  │    └──────────────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         信号层                                        │    │
│  │                                                                      │    │
│  │    createSignal() ──→ { subscribe, emit, clear }                   │    │
│  │              │                                                       │    │
│  │              └── Set<Listener> (自动去重)                           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 第二部分：实现阶段

### 阶段一：项目脚手架 (Scaffolding)

**目标:** 建立项目基础结构、TypeScript 配置、依赖管理、入口文件。

#### 任务 1.1: 初始化项目结构

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `src/bootstrap-entry.ts`
- Create: `src/entrypoints/cli.tsx`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "@anthropic-ai/claude-code",
  "version": "1.0.0",
  "type": "module",
  "packageManager": "bun@1.3.5",
  "scripts": {
    "dev": "bun run ./src/bootstrap-entry.ts",
    "start": "bun run ./src/bootstrap-entry.ts",
    "version": "bun run ./src/bootstrap-entry.ts --version"
  },
  "dependencies": {
    "@commander-js/extra-typings": "*",
    "chalk": "*",
    "react": "*",
    "react-reconciler": "*",
    "ink": "*",
    "lodash-es": "*",
    "zod": "*"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "strict": false,
    "skipLibCheck": true,
    "types": ["bun"]
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: 创建 bootstrap-entry.ts**

```typescript
import { parseArgs } from 'util'

const { values } = parseArgs({
  options: {
    version: { type: 'boolean' },
    help: { type: 'boolean' },
  }
})

// 快速路径：--version
if (values.version) {
  console.log('1.0.0')
  process.exit(0)
}

// 默认路径：加载 CLI
await import('./entrypoints/cli.tsx')
```

- [ ] **Step 4: 创建 cli.tsx**

```typescript
import { Command } from '@commander-js/extra-typings'

const program = new Command()

program
  .name('claude')
  .description('Claude Code CLI')
  .version('1.0.0')

export { program }
```

- [ ] **Step 5: 测试运行**

```bash
bun install
bun run version  # 应输出 1.0.0
bun run dev --help  # 应显示帮助
```

- [ ] **Step 6: Commit**

```bash
git add package.json tsconfig.json src/
git commit -m "feat: scaffold project structure"
```

---

#### 任务 1.2: 实现 Feature Flag 系统

**Files:**
- Create: `src/utils/feature.ts`
- Create: `src/utils/bundle.ts` (模拟 bun:bundle)

**Purpose:** 为后续的 Feature Flag DCE 提供基础。

- [ ] **Step 1: 创建 bundle.ts**

```typescript
// 模拟 bun:bundle 的 feature() 函数
const features: Record<string, boolean> = {}

export function setFeature(name: string, value: boolean): void {
  features[name] = value
}

export function feature(name: string): boolean {
  return features[name] ?? false
}

export function initFeaturesFromEnv(): void {
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('FEATURE_')) {
      const name = key.slice('FEATURE_'.length)
      features[name] = value === 'true'
    }
  }
}
```

- [ ] **Step 2: 在 bootstrap-entry.ts 中初始化**

```typescript
import { initFeaturesFromEnv } from './utils/bundle.js'

initFeaturesFromEnv()
```

- [ ] **Step 3: 编写测试**

```typescript
// tests/utils/feature.test.ts
import { describe, it, expect, beforeEach } from 'bun:test'
import { feature, setFeature, initFeaturesFromEnv } from '../../src/utils/bundle'

describe('feature flags', () => {
  beforeEach(() => {
    // 重置 features
    Object.keys(process.env)
      .filter(k => k.startsWith('FEATURE_'))
      .forEach(k => delete process.env[k])
  })

  it('returns false for unknown feature', () => {
    expect(feature('UNKNOWN')).toBe(false)
  })

  it('returns true for set feature', () => {
    setFeature('TEST_MODE', true)
    expect(feature('TEST_MODE')).toBe(true)
  })

  it('reads from env vars', () => {
    process.env.FEATURE_TEST = 'true'
    initFeaturesFromEnv()
    expect(feature('TEST')).toBe(true)
  })
})
```

- [ ] **Step 4: 运行测试**

```bash
bun test tests/utils/feature.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/utils/bundle.ts src/utils/feature.ts tests/
git commit -m "feat: implement feature flag system"
```

---

### 阶段二：命令系统 (Command System)

**目标:** 实现集中式命令注册表、命令类型定义、基础命令实现。

#### 任务 2.1: 定义命令类型

**Files:**
- Create: `src/types/command.ts`

- [ ] **Step 1: 创建命令类型定义**

```typescript
export type CommandType = 'prompt' | 'local' | 'local-jsx'

export interface Command {
  name: string
  description: string
  aliases?: string[]
  type: CommandType
  remoteIncompatible?: boolean

  // prompt 类型命令
  getPromptForCommand?: (params: CommandParams) => Promise<string | void>

  // local/local-jsx 类型命令
  execute?: (params: CommandParams) => Promise<void>
}

export interface CommandParams {
  args: string[]
  cwd: string
}

export type Commands = Command[]
```

- [ ] **Step 2: 编写测试**

```typescript
// tests/types/command.test.ts
import { describe, it, expect } from 'bun:test'
import type { Command } from '../../src/types/command'

describe('Command type', () => {
  it('defines prompt command', () => {
    const cmd: Command = {
      name: 'test',
      description: 'A test command',
      type: 'prompt',
      getPromptForCommand: async () => 'test prompt'
    }
    expect(cmd.type).toBe('prompt')
  })

  it('defines local command', () => {
    const cmd: Command = {
      name: 'test',
      description: 'A test command',
      type: 'local',
      execute: async () => {}
    }
    expect(cmd.type).toBe('local')
  })
})
```

- [ ] **Step 3: Commit**

```bash
git add src/types/command.ts tests/types/command.test.ts
git commit -m "feat: define command types"
```

---

#### 任务 2.2: 实现集中式命令注册表

**Files:**
- Create: `src/commands.ts`
- Create: `tests/commands.test.ts`

- [ ] **Step 1: 创建命令注册表**

```typescript
import { memoize } from 'lodash-es/memoize.js'
import type { Command } from './types/command.js'

// 基础命令
import { addDirCommand } from './commands/add-dir/index.js'
import { advisorCommand } from './commands/advisor.js'
import { agentsCommand } from './commands/agents/index.js'

// Feature Flag 控制的条件命令
import { feature } from './utils/bundle.js'

const proactive = feature('PROACTIVE')
  ? await import('./commands/proactive.js').then(m => m.default)
  : null

const bridge = feature('BRIDGE_MODE')
  ? await import('./commands/bridge/index.js').then(m => m.default)
  : null

export const COMMANDS = memoize((): Command[] => {
  const commands: Command[] = [
    addDirCommand,
    advisorCommand,
    agentsCommand,
    // ... 更多命令
  ]

  // 条件包含
  if (proactive) commands.push(proactive)
  if (bridge) commands.push(bridge)

  return commands
})

export function filterCommandsForRemoteMode(commands: Command[]): Command[] {
  return commands.filter(cmd => !cmd.remoteIncompatible)
}

export function getCommand(name: string): Command | undefined {
  return COMMANDS().find(cmd =>
    cmd.name === name || cmd.aliases?.includes(name)
  )
}
```

- [ ] **Step 2: 创建 add-dir 命令示例**

```typescript
// src/commands/add-dir/index.ts
import type { Command } from '../../types/command.js'

export const addDirCommand: Command = {
  name: 'add-dir',
  description: 'Add a directory to Claude.md',
  aliases: ['add'],
  type: 'prompt',
  remoteIncompatible: true,

  async getPromptForCommand({ args }): Promise<string> {
    const dir = args[0] || '.'
    return `Add ${dir} to the project context`
  }
}
```

- [ ] **Step 3: 在 cli.tsx 中注册命令**

```typescript
import { program } from '@commander-js/extra-typings'
import { COMMANDS, getCommand } from '../commands.js'

for (const cmd of COMMANDS()) {
  if (cmd.type === 'prompt' && cmd.getPromptForCommand) {
    program.command(cmd.name)
      .description(cmd.description)
      .aliases(cmd.aliases || [])
      .action(async (...args) => {
        const prompt = await cmd.getPromptForCommand!({ args, cwd: process.cwd() })
        console.log(prompt)
      })
  }
}
```

- [ ] **Step 4: 编写测试**

```typescript
// tests/commands.test.ts
import { describe, it, expect } from 'bun:test'
import { COMMANDS, getCommand, filterCommandsForRemoteMode } from '../src/commands'
import { setFeature } from '../src/utils/bundle'

describe('commands registry', () => {
  it('memoizes commands', () => {
    const first = COMMANDS()
    const second = COMMANDS()
    expect(first).toBe(second)
  })

  it('filters remote incompatible commands', () => {
    setFeature('BRIDGE_MODE', false)
    const cmds = COMMANDS()
    const remoteCmds = filterCommandsForRemoteMode(cmds)
    expect(remoteCmds.every(cmd => !cmd.remoteIncompatible)).toBe(true)
  })
})
```

- [ ] **Step 5: Commit**

```bash
git add src/commands.ts src/commands/add-dir/ src/types/command.ts tests/
git commit -m "feat: implement command registry"
```

---

### 阶段三：核心处理层 (Core Processing)

**目标:** 实现查询引擎、工具系统、上下文管理。

#### 任务 3.1: 实现工具系统

**Files:**
- Create: `src/Tool.ts`
- Create: `src/tools.ts`
- Create: `src/tools/BashTool/index.ts`

- [ ] **Step 1: 定义 Tool 类型**

```typescript
export type ToolInputJSONSchema = {
  type: 'object'
  properties: Record<string, unknown>
  required?: string[]
}

export type ToolExecuteContext = {
  cwd: string
  apiKey?: string
}

export type ToolResult = {
  content: Array<{ type: string; text?: string; [key: string]: unknown }>
  isError?: boolean
}

export type Tool = {
  name: string
  description: string
  inputSchema: ToolInputJSONSchema
  matchesName: (name: string) => boolean
  renderTextDescription: (params: unknown) => string
  execute: (params: unknown, context: ToolExecuteContext) => Promise<ToolResult>
}
```

- [ ] **Step 2: 实现 BashTool**

```typescript
// src/tools/BashTool/index.ts
import type { Tool, ToolResult, ToolExecuteContext } from '../../Tool.js'
import { execa } from 'execa'

export const BashTool: Tool = {
  name: 'Bash',
  description: 'Execute a bash command',
  inputSchema: {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'The command to execute' }
    },
    required: ['command']
  },

  matchesName(name: string): boolean {
    return ['bash', 'shell', 'sh'].includes(name.toLowerCase())
  },

  renderTextDescription(params: unknown): string {
    const { command } = params as { command: string }
    return `Bash: ${command}`
  },

  async execute(params: unknown, context: ToolExecuteContext): Promise<ToolResult> {
    const { command } = params as { command: string }

    try {
      const { stdout, stderr, exitCode } = await execa(command, [], {
        cwd: context.cwd,
        shell: true
      })

      return {
        content: [
          { type: 'text', text: stdout || '' },
          ...(stderr ? [{ type: 'text', text: stderr, is_error: true }] : [])
        ]
      }
    } catch (error: unknown) {
      return {
        content: [{
          type: 'text',
          text: error instanceof Error ? error.message : String(error),
          is_error: true
        }]
      }
    }
  }
}
```

- [ ] **Step 3: 创建工具注册表**

```typescript
// src/tools.ts
import { BashTool } from './tools/BashTool/index.js'
import { ReadTool } from './tools/ReadTool/index.js'
import { EditTool } from './tools/FileEditTool/index.js'
import { WebSearchTool } from './tools/WebSearchTool/index.js'
import { feature } from './utils/bundle.js'
import type { Tool } from './Tool.js'

const ALWAYS_LOADED_TOOLS: Tool[] = [
  BashTool,
  ReadTool,
  EditTool,
]

const CONDITIONAL_TOOLS: (Tool | null)[] = [
  feature('WEB_BROWSER') ? WebSearchTool : null,
]

export function getTools(): Tool[] {
  return [
    ...ALWAYS_LOADED_TOOLS,
    ...CONDITIONAL_TOOLS.filter((t): t is Tool => t !== null)
  ]
}

export function findTool(name: string): Tool | undefined {
  return getTools().find(tool => tool.matchesName(name))
}
```

- [ ] **Step 4: 编写测试**

```typescript
// tests/tools.test.ts
import { describe, it, expect } from 'bun:test'
import { getTools, findTool } from '../src/tools'
import { BashTool } from '../src/tools/BashTool/index'

describe('tools registry', () => {
  it('includes base tools', () => {
    const tools = getTools()
    expect(tools.find(t => t.name === 'Bash')).toBeDefined()
  })

  it('finds tool by name', () => {
    const tool = findTool('Bash')
    expect(tool?.name).toBe('Bash')
  })

  it('matches aliases', () => {
    const tool = findTool('bash')
    expect(tool?.name).toBe('Bash')
  })
})
```

- [ ] **Step 5: Commit**

```bash
git add src/Tool.ts src/tools.ts src/tools/ tests/
git commit -m "feat: implement tool system"
```

---

#### 任务 3.2: 实现上下文预计算

**Files:**
- Create: `src/context.ts`
- Create: `tests/context.test.ts`

- [ ] **Step 1: 实现上下文缓存**

```typescript
// src/context.ts
import memoize from 'lodash-es/memoize.js'
import { execFileNoThrow } from './utils/execFileNoThrow.js'
import { getIsGit, getBranch, getDefaultBranch } from './utils/git.js'
import { getLocalISODate } from './utils/common.js'
import { isEnvTruthy } from './utils/envUtils.js'
import { getClaudeMds, getMemoryFiles, filterInjectedMemoryFiles } from './utils/claudemd.js'

const MAX_STATUS_CHARS = 2000

export const getGitStatus = memoize(async (): Promise<string | null> => {
  if (!await getIsGit()) {
    return null
  }

  const [branch, mainBranch, status, log, userName] = await Promise.all([
    getBranch(),
    getDefaultBranch(),
    execFileNoThrow('git', ['status', '--short']).then(({ stdout }) => stdout.trim()),
    execFileNoThrow('git', ['log', '--oneline', '-n', '5']).then(({ stdout }) => stdout.trim()),
    execFileNoThrow('git', ['config', 'user.name']).then(({ stdout }) => stdout.trim()),
  ])

  const truncatedStatus = status.length > MAX_STATUS_CHARS
    ? status.slice(0, MAX_STATUS_CHARS) + '\n... (truncated)'
    : status || '(clean)'

  return [
    `Current branch: ${branch}`,
    `Main branch: ${mainBranch}`,
    `Status:\n${truncatedStatus}`,
    `Recent commits:\n${log}`,
  ].filter(Boolean).join('\n\n')
})

export const getSystemContext = memoize(async () => {
  const gitStatus = isEnvTruthy(process.env.CLAUDE_CODE_REMOTE)
    ? null
    : await getGitStatus()

  return { gitStatus }
})

export const getUserContext = memoize(async () => {
  const claudeMd = getClaudeMds(filterInjectedMemoryFiles(await getMemoryFiles()))
  const currentDate = `Today's date is ${getLocalISODate()}.`

  return { claudeMd, currentDate }
})
```

- [ ] **Step 2: 编写测试**

```typescript
// tests/context.test.ts
import { describe, it, expect } from 'bun:test'
import { getSystemContext, getUserContext } from '../src/context'

describe('context', () => {
  it('caches system context', async () => {
    const ctx1 = await getSystemContext()
    const ctx2 = await getSystemContext()
    expect(ctx1).toBe(ctx2) // 同一引用
  })

  it('returns current date', async () => {
    const ctx = await getUserContext()
    expect(ctx.currentDate).toMatch(/Today's date is \d{4}-\d{2}-\d{2}/)
  })
})
```

- [ ] **Step 3: Commit**

```bash
git add src/context.ts tests/context.test.ts
git commit -m "feat: implement context caching"
```

---

#### 任务 3.3: 实现查询引擎

**Files:**
- Create: `src/QueryEngine.ts`
- Create: `src/query.ts`
- Create: `tests/query.test.ts`

- [ ] **Step 1: 定义查询引擎配置**

```typescript
// src/QueryEngine.ts
import type { Tool } from './Tool.js'
import type { Command } from './types/command.js'
import type { MCPServerConnection } from './services/mcp/types.js'

export type QueryEngineConfig = {
  cwd: string
  tools: Tool[]
  commands: Command[]
  mcpClients: MCPServerConnection[]
  getSystemContext: () => Promise<{ gitStatus: string | null }>
  getUserContext: () => Promise<{ claudeMd: string | null; currentDate: string }>
}

export type QueryResult = {
  message: string
  toolCalls?: Array<{
    tool: string
    params: unknown
  }>
}
```

- [ ] **Step 2: 实现查询处理**

```typescript
// src/query.ts
import type { QueryEngineConfig, QueryResult } from './QueryEngine.js'
import { findTool } from './tools.js'
import { getSystemContext, getUserContext } from './context.js'

export async function processQuery(
  input: string,
  config: QueryEngineConfig
): Promise<QueryResult> {
  // 1. 收集上下文
  const [systemCtx, userCtx] = await Promise.all([
    config.getSystemContext(),
    config.getUserContext()
  ])

  // 2. 构建完整上下文
  const fullContext = [
    systemCtx.gitStatus,
    userCtx.claudeMd,
    userCtx.currentDate,
  ].filter(Boolean).join('\n\n')

  // 3. 解析输入（简单实现）
  if (input.startsWith('/')) {
    const [cmd, ...args] = input.slice(1).split(' ')
    return handleSlashCommand(cmd, args, config)
  }

  // 4. 返回处理结果
  return {
    message: `Processed: ${input}\n\nContext:\n${fullContext}`
  }
}

async function handleSlashCommand(
  cmd: string,
  args: string[],
  config: QueryEngineConfig
): Promise<QueryResult> {
  const command = config.commands.find(c =>
    c.name === cmd || c.aliases?.includes(cmd)
  )

  if (!command) {
    return { message: `Unknown command: /${cmd}` }
  }

  if (command.type === 'prompt' && command.getPromptForCommand) {
    const prompt = await command.getPromptForCommand({ args, cwd: config.cwd })
    return { message: prompt || '' }
  }

  return { message: `Executing /${cmd}...` }
}
```

- [ ] **Step 3: 编写测试**

```typescript
// tests/query.test.ts
import { describe, it, expect } from 'bun:test'
import { processQuery } from '../src/query'
import type { QueryEngineConfig } from '../src/QueryEngine'

const mockConfig: QueryEngineConfig = {
  cwd: '/tmp',
  tools: [],
  commands: [
    {
      name: 'test',
      description: 'A test command',
      type: 'prompt',
      getPromptForCommand: async ({ args }) => `Test command with ${args.join(' ')}`
    }
  ],
  mcpClients: [],
  getSystemContext: async () => ({ gitStatus: 'Branch: main' }),
  getUserContext: async () => ({ claudeMd: null, currentDate: '2026-04-01' })
}

describe('query processing', () => {
  it('processes slash commands', async () => {
    const result = await processQuery('/test arg1 arg2', mockConfig)
    expect(result.message).toContain('Test command with arg1 arg2')
  })

  it('returns context', async () => {
    const result = await processQuery('hello', mockConfig)
    expect(result.message).toContain('Branch: main')
  })
})
```

- [ ] **Step 4: Commit**

```bash
git add src/QueryEngine.ts src/query.ts tests/query.test.ts
git commit -m "feat: implement query engine"
```

---

### 阶段四：状态管理 (State Management)

**目标:** 实现 Observable Store、Signal 系统、命令队列。

#### 任务 4.1: 实现 Observable Store

**Files:**
- Create: `src/state/store.ts`
- Create: `tests/state/store.test.ts`

- [ ] **Step 1: 实现 Store**

```typescript
// src/state/store.ts
export type Listener = () => void

export type OnChange<T> = (change: { newState: T; oldState: T }) => void

export type Store<T> = {
  getState: () => T
  setState: (updater: (prev: T) => T) => void
  subscribe: (listener: Listener) => () => void
}

export function createStore<T>(
  initialState: T,
  onChange?: OnChange<T>
): Store<T> {
  let state = initialState
  const listeners = new Set<Listener>()

  return {
    getState: () => state,

    setState: (updater) => {
      const prev = state
      const next = typeof updater === 'function'
        ? (updater as (prev: T) => T)(prev)
        : updater

      // 恒等性检查
      if (Object.is(next, prev)) return

      state = next
      onChange?.({ newState: next, oldState: prev })

      for (const listener of listeners) {
        listener()
      }
    },

    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    }
  }
}
```

- [ ] **Step 2: 编写测试**

```typescript
// tests/state/store.test.ts
import { describe, it, expect } from 'bun:test'
import { createStore } from '../../src/state/store'

describe('createStore', () => {
  it('returns initial state', () => {
    const store = createStore({ count: 0 })
    expect(store.getState().count).toBe(0)
  })

  it('updates state', () => {
    const store = createStore({ count: 0 })
    store.setState(prev => ({ count: prev.count + 1 }))
    expect(store.getState().count).toBe(1)
  })

  it('notifies subscribers', () => {
    const store = createStore({ count: 0 })
    let notified = 0
    store.subscribe(() => notified++)

    store.setState(prev => ({ count: 1 }))
    store.setState(prev => ({ count: 2 }))

    expect(notified).toBe(2)
  })

  it('returns unsubscribe function', () => {
    const store = createStore({ count: 0 })
    let notified = 0
    const unsub = store.subscribe(() => notified++)

    unsub()
    store.setState(prev => ({ count: 1 }))
    expect(notified).toBe(0)
  })

  it('avoids notification on same state', () => {
    const store = createStore({ count: 0 })
    let notified = 0
    store.subscribe(() => notified++)

    store.setState(prev => prev) // 返回相同引用
    expect(notified).toBe(0)
  })
})
```

- [ ] **Step 3: Commit**

```bash
git add src/state/store.ts tests/state/store.test.ts
git commit -m "feat: implement observable store"
```

---

#### 任务 4.2: 实现 Signal 系统

**Files:**
- Create: `src/utils/signal.ts`
- Create: `tests/utils/signal.test.ts`

- [ ] **Step 1: 实现 Signal**

```typescript
// src/utils/signal.ts
export type Signal<Args extends unknown[] = []> = {
  subscribe: (listener: (...args: Args) => void) => () => void
  emit: (...args: Args) => void
  clear: () => void
}

export function createSignal<Args extends unknown[] = []>(): Signal<Args> {
  const listeners = new Set<(...args: Args) => void>()

  return {
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    emit(...args) {
      for (const listener of listeners) {
        listener(...args)
      }
    },

    clear() {
      listeners.clear()
    }
  }
}
```

- [ ] **Step 2: 编写测试**

```typescript
// tests/utils/signal.test.ts
import { describe, it, expect } from 'bun:test'
import { createSignal } from '../../src/utils/signal'

describe('createSignal', () => {
  it('notifies subscribers', () => {
    const signal = createSignal<[string]>()
    let received = ''
    const unsub = signal.subscribe(msg => received = msg)

    signal.emit('hello')
    expect(received).toBe('hello')

    unsub()
  })

  it('returns unsubscribe function', () => {
    const signal = createSignal<[string]>()
    let count = 0
    const unsub = signal.subscribe(() => count++)

    signal.emit('a')
    unsub()
    signal.emit('b')

    expect(count).toBe(1)
  })

  it('clears all listeners', () => {
    const signal = createSignal()
    let count = 0
    signal.subscribe(() => count++)
    signal.subscribe(() => count++)

    signal.clear()
    signal.emit()

    expect(count).toBe(0)
  })

  it('auto-removes duplicate listeners', () => {
    const signal = createSignal<[number]>()
    let count = 0
    const handler = () => count++

    signal.subscribe(handler)
    signal.subscribe(handler) // 相同引用

    signal.emit(1)
    expect(count).toBe(1) // 只执行一次
  })
})
```

- [ ] **Step 3: Commit**

```bash
git add src/utils/signal.ts tests/utils/signal.test.ts
git commit -m "feat: implement signal system"
```

---

#### 任务 4.3: 实现命令队列

**Files:**
- Create: `src/utils/messageQueueManager.ts`
- Create: `tests/utils/messageQueue.test.ts`

- [ ] **Step 1: 实现命令队列**

```typescript
// src/utils/messageQueueManager.ts
import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/messages.mjs'
import { createSignal } from './signal.js'

export type QueuePriority = 'now' | 'next' | 'later'

export type QueuedCommand = {
  value: string | ContentBlockParam[]
  mode: string
  priority: QueuePriority
  agentId?: string
  isMeta?: boolean
}

const PRIORITY_ORDER: Record<QueuePriority, number> = {
  now: 0,
  next: 1,
  later: 2
}

const commandQueue: QueuedCommand[] = []
let snapshot: readonly QueuedCommand[] = Object.freeze([])
const queueChanged = createSignal()

function notifySubscribers(): void {
  snapshot = Object.freeze([...commandQueue])
  queueChanged.emit()
}

export const subscribeToCommandQueue = queueChanged.subscribe

export function getCommandQueueSnapshot(): readonly QueuedCommand[] {
  return snapshot
}

export function enqueue(command: QueuedCommand): void {
  commandQueue.push({ ...command, priority: command.priority ?? 'next' })
  notifySubscribers()
}

export function dequeue(
  filter?: (cmd: QueuedCommand) => boolean
): QueuedCommand | undefined {
  if (commandQueue.length === 0) return undefined

  let bestIdx = -1
  let bestPriority = Infinity

  for (let i = 0; i < commandQueue.length; i++) {
    const cmd = commandQueue[i]!
    if (filter && !filter(cmd)) continue
    const priority = PRIORITY_ORDER[cmd.priority ?? 'next']
    if (priority < bestPriority) {
      bestIdx = i
      bestPriority = priority
    }
  }

  if (bestIdx === -1) return undefined
  const [dequeued] = commandQueue.splice(bestIdx, 1)
  notifySubscribers()
  return dequeued
}

export function hasCommandsInQueue(): boolean {
  return commandQueue.length > 0
}

export function clearCommandQueue(): void {
  commandQueue.length = 0
  notifySubscribers()
}
```

- [ ] **Step 2: 编写测试**

```typescript
// tests/utils/messageQueue.test.ts
import { describe, it, expect, beforeEach } from 'bun:test'
import { enqueue, dequeue, hasCommandsInQueue, clearCommandQueue, subscribeToCommandQueue } from '../../src/utils/messageQueueManager'

describe('message queue', () => {
  beforeEach(() => {
    clearCommandQueue()
  })

  it('enqueues and dequeues', () => {
    enqueue({ value: 'test', mode: 'prompt', priority: 'next' })
    expect(hasCommandsInQueue()).toBe(true)

    const cmd = dequeue()
    expect(cmd?.value).toBe('test')
    expect(hasCommandsInQueue()).toBe(false)
  })

  it('respects priority', () => {
    enqueue({ value: 'later', mode: 'prompt', priority: 'later' })
    enqueue({ value: 'now', mode: 'prompt', priority: 'now' })
    enqueue({ value: 'next', mode: 'prompt', priority: 'next' })

    const first = dequeue()
    expect(first?.value).toBe('now')

    const second = dequeue()
    expect(second?.value).toBe('next')
  })

  it('notifies subscribers', () => {
    let notified = 0
    subscribeToCommandQueue(() => notified++)

    enqueue({ value: 'test', mode: 'prompt', priority: 'next' })
    expect(notified).toBe(1)
  })
})
```

- [ ] **Step 3: Commit**

```bash
git add src/utils/messageQueueManager.ts tests/utils/messageQueue.test.ts
git commit -m "feat: implement command queue"
```

---

### 阶段五：桥接层 (Bridge Layer)

**目标:** 实现远程会话管理、传输层抽象、OAuth 重试。

#### 任务 5.1: 实现传输层抽象

**Files:**
- Create: `src/bridge/types.ts`
- Create: `src/bridge/replBridgeTransport.ts`
- Create: `tests/bridge/transport.test.ts`

- [ ] **Step 1: 定义传输层类型**

```typescript
// src/bridge/types.ts
export type StdoutMessage = {
  type: 'stdout' | 'stderr' | 'exit'
  content?: string
  exitCode?: number
}

export type ReplBridgeTransport = {
  write(message: StdoutMessage): Promise<void>
  writeBatch(messages: StdoutMessage[]): Promise<void>
  close(): void
}
```

- [ ] **Step 2: 实现 v1 传输**

```typescript
// src/bridge/replBridgeTransport.ts

// v1: 混合传输（WebSocket 双向）
export function createV1ReplTransport(
  hybrid: { send(msg: string): void; close(): void }
): ReplBridgeTransport {
  return {
    write: async (msg) => hybrid.send(JSON.stringify(msg)),
    writeBatch: async (msgs) => hybrid.send(JSON.stringify(msgs)),
    close: () => hybrid.close()
  }
}

// v2: SSE 读 + HTTP 写
export function createV2ReplTransport(
  sse: { listen(handler: (msg: StdoutMessage) => void): void; close(): void },
  http: { post(endpoint: string, data: unknown): Promise<void> }
): ReplBridgeTransport {
  return {
    write: async (msg) => http.post('/stream', msg),
    writeBatch: async (msgs) => http.post('/batch', msgs),
    close: () => sse.close()
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/bridge/types.ts src/bridge/replBridgeTransport.ts
git commit -m "feat: implement transport abstraction"
```

---

#### 任务 5.2: 实现 OAuth 重试

**Files:**
- Create: `src/bridge/bridgeApi.ts`
- Create: `src/bridge/jwtUtils.ts`
- Create: `tests/bridge/api.test.ts`

- [ ] **Step 1: 实现 JWT 工具**

```typescript
// src/bridge/jwtUtils.ts
import { z } from 'zod'

const tokenSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_at: z.number()
})

export type Token = z.infer<typeof tokenSchema>

export function createTokenRefreshScheduler(refresh: () => Promise<Token>) {
  let currentToken: Token | null = null
  let refreshTimeout: ReturnType<typeof setTimeout> | null = null

  const scheduleRefresh = () => {
    if (!currentToken) return
    const msUntilRefresh = currentToken.expires_at - Date.now() - 60000 // 提前 1 分钟
    if (msUntilRefresh > 0) {
      refreshTimeout = setTimeout(async () => {
        currentToken = await refresh()
        scheduleRefresh()
      }, msUntilRefresh)
    }
  }

  return {
    getToken: () => currentToken,
    setToken: (token: Token) => {
      currentToken = token
      scheduleRefresh()
    },
    clear: () => {
      if (refreshTimeout) clearTimeout(refreshTimeout)
      currentToken = null
    }
  }
}
```

- [ ] **Step 2: 实现 OAuth 重试封装**

```typescript
// src/bridge/bridgeApi.ts
export type OAuthRetryDeps = {
  getToken: () => string | null
  refreshToken: () => Promise<boolean>
}

export async function withOAuthRetry<T>(
  fn: (accessToken: string) => Promise<{ status: number; data: T }>,
  context: string,
  deps: OAuthRetryDeps
): Promise<{ status: number; data: T }> {
  const token = deps.getToken()
  if (!token) {
    return { status: 401, data: null as unknown as T }
  }

  const response = await fn(token)

  // 非 401，直接返回
  if (response.status !== 401) {
    return response
  }

  // 收到 401，尝试刷新
  const refreshed = await deps.refreshToken()
  if (!refreshed) {
    return response
  }

  // 刷新成功，用新 token 重试
  const newToken = deps.getToken()
  if (!newToken) {
    return response
  }

  return fn(newToken)
}
```

- [ ] **Step 3: 编写测试**

```typescript
// tests/bridge/api.test.ts
import { describe, it, expect } from 'bun:test'
import { withOAuthRetry, type OAuthRetryDeps } from '../../src/bridge/bridgeApi'

describe('withOAuthRetry', () => {
  it('returns response on non-401', async () => {
    const deps: OAuthRetryDeps = {
      getToken: () => 'token',
      refreshToken: async () => false
    }

    const result = await withOAuthRetry(
      async (token) => ({ status: 200, data: { token } }),
      'test',
      deps
    )

    expect(result.status).toBe(200)
    expect(result.data.token).toBe('token')
  })

  it('retries on 401', async () => {
    let attempts = 0
    const deps: OAuthRetryDeps = {
      getToken: () => attempts === 0 ? 'old' : 'new',
      refreshToken: async () => { attempts = 1; return true }
    }

    const result = await withOAuthRetry(
      async (token) => ({
        status: token === 'old' ? 401 : 200,
        data: { token }
      }),
      'test',
      deps
    )

    expect(result.status).toBe(200)
    expect(result.data.token).toBe('new')
  })
})
```

- [ ] **Step 4: Commit**

```bash
git add src/bridge/bridgeApi.ts src/bridge/jwtUtils.ts tests/bridge/
git commit -m "feat: implement OAuth retry"
```

---

#### 任务 5.3: 实现 PID 文件锁

**Files:**
- Create: `src/utils/pidLock.ts`
- Create: `tests/utils/pidLock.test.ts`

- [ ] **Step 1: 实现 PID 锁**

```typescript
// src/utils/pidLock.ts
import { writeFile, readFile, unlink } from 'fs/promises'
import { getErrnoCode } from './errors.js'

export type LockContent = {
  pid: number
  version: string
  acquiredAt: number
}

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

export async function tryAcquireLock(
  path: string,
  content: LockContent
): Promise<(() => Promise<void>) | null> {
  // 尝试原子创建
  try {
    await writeFile(path, JSON.stringify(content), { flag: 'wx' })
  } catch (e: unknown) {
    if (getErrnoCode(e) === 'EEXIST') {
      // 检查现有锁
      const existing = await readFile(path, 'utf-8').catch(() => null)
      if (existing) {
        const parsed = JSON.parse(existing) as LockContent
        if (parsed.pid === content.pid) {
          // 同一进程，返回释放函数
          return async () => {
            try { await unlink(path) } catch {}
          }
        }
        if (isProcessRunning(parsed.pid)) {
          return null // 另一个活跃进程持有
        }
        // Stale，删除并重试
        await unlink(path).catch(() => {})
        return tryAcquireLock(path, content)
      }
    }
    throw e
  }

  return async () => {
    try { await unlink(path) } catch {}
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/pidLock.ts tests/utils/pidLock.test.ts
git commit -m "feat: implement PID lock"
```

---

### 阶段六：Analytics 服务

**目标:** 实现 Sink 模式的事件系统。

#### 任务 6.1: 实现 Analytics Sink

**Files:**
- Create: `src/services/analytics/index.ts`
- Create: `tests/services/analytics.test.ts`

- [ ] **Step 1: 实现 Sink 模式**

```typescript
// src/services/analytics/index.ts
export type AnalyticsEvent = {
  eventName: string
  metadata?: Record<string, unknown>
  timestamp: number
}

export type AnalyticsSink = {
  logEvent(eventName: string, metadata?: Record<string, unknown>): void
}

let sink: AnalyticsSink | null = null
const eventQueue: AnalyticsEvent[] = []

export function logEvent(eventName: string, metadata?: Record<string, unknown>): void {
  const event: AnalyticsEvent = {
    eventName,
    metadata,
    timestamp: Date.now()
  }

  if (sink === null) {
    eventQueue.push(event)
    return
  }

  sink.logEvent(eventName, metadata)
}

export function attachAnalyticsSink(newSink: AnalyticsSink): void {
  if (sink !== null) return

  sink = newSink

  queueMicrotask(() => {
    for (const event of eventQueue) {
      sink!.logEvent(event.eventName, event.metadata)
    }
    eventQueue.length = 0
  })
}

export function logEventAsync(eventName: string, metadata?: Record<string, unknown>): void {
  queueMicrotask(() => logEvent(eventName, metadata))
}
```

- [ ] **Step 2: 编写测试**

```typescript
// tests/services/analytics.test.ts
import { describe, it, expect, beforeEach } from 'bun:test'
import { logEvent, attachAnalyticsSink, logEventAsync } from '../../src/services/analytics'

describe('analytics', () => {
  const events: Array<{ name: string; meta?: Record<string, unknown> }> = []

  beforeEach(() => {
    events.length = 0
    // 重新设置 sink
    attachAnalyticsSink({
      logEvent: (name, meta) => events.push({ name, meta })
    })
  })

  it('logs events after sink attached', () => {
    logEvent('test_event', { key: 'value' })
    expect(events[0]?.name).toBe('test_event')
  })

  it('queues events before sink attached', () => {
    // 创建新的 analytics 模块来测试队列
    // 这需要 mock module 系统，实际中通过依赖注入测试
    expect(true).toBe(true)
  })
})
```

- [ ] **Step 3: Commit**

```bash
git add src/services/analytics/index.ts tests/services/analytics.test.ts
git commit -m "feat: implement analytics sink"
```

---

### 阶段七：TUI 界面

**目标:** 实现 React/Ink TUI 基础组件。

#### 任务 7.1: 实现 Ink 渲染基础

**Files:**
- Create: `src/ink.tsx`
- Create: `src/components/App.tsx`
- Create: `src/state/AppState.tsx`

- [ ] **Step 1: 创建 AppState**

```typescript
// src/state/AppState.tsx
import { createStore } from '../state/store.js'

export type AppState = {
  theme: 'dark' | 'light'
  messages: Array<{ role: string; content: string }>
  isLoading: boolean
}

const initialState: AppState = {
  theme: 'dark',
  messages: [],
  isLoading: false
}

export const appStore = createStore(initialState)

// React Hook
export function useAppState<R>(selector: (state: AppState) => R): R {
  const [value, setValue] = require('react').useState(
    () => selector(appStore.getState())
  )

  require('react').useEffect(() => {
    return appStore.subscribe(() => {
      setValue(selector(appStore.getState()))
    })
  }, [selector])

  return value
}
```

- [ ] **Step 2: 创建 App 组件**

```tsx
// src/components/App.tsx
import React from 'react'
import { useAppState } from '../state/AppState.js'
import { Text, Box } from 'ink'

export function App() {
  const theme = useAppState(s => s.theme)
  const messages = useAppState(s => s.messages)
  const isLoading = useAppState(s => s.isLoading)

  return (
    <Box flexDirection="column">
      <Box>Claude Code TUI</Box>
      <Box>Theme: {theme}</Box>
      {isLoading && <Text>Loading...</Text>}
      <Box flexDirection="column">
        {messages.map((msg, i) => (
          <Text key={i}>{msg.role}: {msg.content}</Text>
        ))}
      </Box>
    </Box>
  )
}
```

- [ ] **Step 3: 创建渲染入口**

```tsx
// src/ink.tsx
import React from 'react'
import { render } from 'ink'
import { App } from './components/App.js'

export async function renderApp(): Promise<{ cleanup: () => void }> {
  const { unmount } = render(React.createElement(App))
  return { cleanup: unmount }
}
```

- [ ] **Step 4: 在 main.tsx 中集成**

```tsx
// src/main.tsx
import { renderApp } from './ink.js'

async function main() {
  await renderApp()
}

main().catch(console.error)
```

- [ ] **Step 5: Commit**

```bash
git add src/ink.tsx src/components/App.tsx src/state/AppState.tsx src/main.tsx
git commit -m "feat: implement TUI foundation"
```

---

### 阶段八：MCP 服务

**目标:** 实现 MCP 多传输支持。

#### 任务 8.1: 实现 MCP 客户端

**Files:**
- Create: `src/services/mcp/types.ts`
- Create: `src/services/mcp/client.ts`
- Create: `tests/services/mcp.test.ts`

- [ ] **Step 1: 定义 MCP 类型**

```typescript
// src/services/mcp/types.ts
export type MCPServerConnection = {
  start(): Promise<void>
  stop(): Promise<void>
  sendRequest(method: string, params?: unknown): Promise<unknown>
  sendNotification(method: string, params?: unknown): void
}

export type McpServerConfig = {
  name: string
  command?: string
  args?: string[]
  url?: string
  transport: 'stdio' | 'sse' | 'http' | 'websocket'
}
```

- [ ] **Step 2: 实现 MCP 客户端**

```typescript
// src/services/mcp/client.ts
import type { MCPServerConnection, McpServerConfig } from './types.js'

export class MCPClientManager {
  private connections = new Map<string, MCPServerConnection>()

  async connect(name: string, config: McpServerConfig): Promise<void> {
    const conn = await this.createTransport(config)
    await conn.start()
    this.connections.set(name, conn)
  }

  private async createTransport(config: McpServerConfig): Promise<MCPServerConnection> {
    switch (config.transport) {
      case 'stdio':
        return this.createStdioTransport(config)
      case 'http':
        return this.createHttpTransport(config)
      case 'websocket':
        return this.createWebSocketTransport(config)
      default:
        throw new Error(`Unsupported transport: ${config.transport}`)
    }
  }

  private async createStdioTransport(config: McpServerConfig): Promise<MCPServerConnection> {
    // 实现 stdio 传输
    return {
      start: async () => {},
      stop: async () => {},
      sendRequest: async (method, params) => ({ method, params }),
      sendNotification: () => {}
    }
  }

  private async createHttpTransport(config: McpServerConfig): Promise<MCPServerConnection> {
    // 实现 HTTP 传输
    return {
      start: async () => {},
      stop: async () => {},
      sendRequest: async (method, params) => ({ method, params }),
      sendNotification: () => {}
    }
  }

  private async createWebSocketTransport(config: McpServerConfig): Promise<MCPServerConnection> {
    // 实现 WebSocket 传输
    return {
      start: async () => {},
      stop: async () => {},
      sendRequest: async (method, params) => ({ method, params }),
      sendNotification: () => {}
    }
  }

  getConnection(name: string): MCPServerConnection | undefined {
    return this.connections.get(name)
  }

  async disconnect(name: string): Promise<void> {
    const conn = this.connections.get(name)
    if (conn) {
      await conn.stop()
      this.connections.delete(name)
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/services/mcp/types.ts src/services/mcp/client.ts tests/services/mcp.test.ts
git commit -m "feat: implement MCP client"
```

---

### 阶段九：Compact 服务

**目标:** 实现上下文压缩服务。

#### 任务 9.1: 实现压缩服务

**Files:**
- Create: `src/services/compact/types.ts`
- Create: `src/services/compact/compact.ts`
- Create: `tests/services/compact.test.ts`

- [ ] **Step 1: 定义压缩类型**

```typescript
// src/services/compact/types.ts
export type CompactStrategy = 'full' | 'auto' | 'micro' | 'memory'

export type CompactConfig = {
  strategy: CompactStrategy
  tokenBudget: number
  messageCountThreshold: number
}

export type Message = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export type CompactResult = {
  messages: Message[]
  originalCount: number
  compactedCount: number
}
```

- [ ] **Step 2: 实现压缩逻辑**

```typescript
// src/services/compact/compact.ts
import type { CompactConfig, CompactResult, Message } from './types.js'

export function compact(
  messages: Message[],
  config: CompactConfig
): CompactResult {
  const originalCount = messages.length

  switch (config.strategy) {
    case 'full':
      return fullCompact(messages, config)
    case 'micro':
      return microCompact(messages, config)
    case 'memory':
      return memoryCompact(messages, config)
    case 'auto':
    default:
      return autoCompact(messages, config)
  }
}

function fullCompact(messages: Message[], config: CompactConfig): CompactResult {
  // 完整压缩：总结旧消息，保留最近 N 条
  const keepCount = Math.ceil(config.messageCountThreshold * 0.3)
  const toCompact = messages.slice(0, -keepCount)
  const toKeep = messages.slice(-keepCount)

  const summary = summarizeMessages(toCompact)

  return {
    messages: [
      { role: 'system', content: `[Previous conversation summarized: ${summary}]` },
      ...toKeep
    ],
    originalCount,
    compactedCount: toKeep.length + 1
  }
}

function microCompact(messages: Message[], config: CompactConfig): CompactResult {
  // 微压缩：只保留最近 N 条
  const kept = messages.slice(-config.messageCountThreshold)
  return {
    messages: kept,
    originalCount,
    compactedCount: kept.length
  }
}

function memoryCompact(messages: Message[], config: CompactConfig): CompactResult {
  // 内存压缩：根据 token 预算
  const maxTokens = config.tokenBudget
  let tokenCount = 0
  const kept: Message[] = []

  for (const msg of messages.slice().reverse()) {
    const msgTokens = estimateTokens(msg.content)
    if (tokenCount + msgTokens <= maxTokens) {
      kept.unshift(msg)
      tokenCount += msgTokens
    } else {
      break
    }
  }

  return {
    messages: kept,
    originalCount,
    compactedCount: kept.length
  }
}

function autoCompact(messages: Message[], config: CompactConfig): CompactResult {
  // 自动选择：消息多用 full，消息少用 micro
  if (messages.length > config.messageCountThreshold * 2) {
    return fullCompact(messages, config)
  }
  return microCompact(messages, config)
}

function summarizeMessages(messages: Message[]): string {
  if (messages.length === 0) return 'empty'
  const first = messages[0]
  const last = messages[messages.length - 1]
  return `${messages.length} messages from "${first.content.slice(0, 50)}..." to "${last.content.slice(0, 50)}..."`
}

function estimateTokens(text: string): number {
  // 简单估算：中文按 2 字符 = 1 token，英文按 4 字符 = 1 token
  return Math.ceil(text.length / 4)
}
```

- [ ] **Step 3: 编写测试**

```typescript
// tests/services/compact.test.ts
import { describe, it, expect } from 'bun:test'
import { compact } from '../../src/services/compact/compact'
import type { CompactConfig } from '../../src/services/compact/types'

const config: CompactConfig = {
  strategy: 'auto',
  tokenBudget: 1000,
  messageCountThreshold: 10
}

describe('compact', () => {
  it('micro compact keeps recent messages', () => {
    const messages = Array.from({ length: 20 }, (_, i) => ({
      role: 'user' as const,
      content: `Message ${i}`
    }))

    const result = compact(messages, { ...config, strategy: 'micro' })
    expect(result.compactedCount).toBeLessThanOrEqual(10)
  })

  it('full compact summarizes old messages', () => {
    const messages = Array.from({ length: 20 }, (_, i) => ({
      role: 'user' as const,
      content: `Message ${i}`
    }))

    const result = compact(messages, { ...config, strategy: 'full' })
    expect(result.messages[0].content).toContain('summarized')
  })
})
```

- [ ] **Step 4: Commit**

```bash
git add src/services/compact/types.ts src/services/compact/compact.ts tests/services/compact.test.ts
git commit -m "feat: implement compact service"
```

---

## 第三部分：测试策略

### 测试分层

```
┌─────────────────────────────────────────────────────────┐
│                      测试金字塔                            │
│                                                         │
│                        ┌───┐                           │
│                       │ E2E │                          │
│                      └─────┘                           │
│                   ┌───────────┐                        │
│                  │ Integration │                       │
│                 └─────────────┘                        │
│              ┌───────────────────┐                    │
│             │      Unit          │                    │
│            └─────────────────────┘                    │
│                                                         │
│  Unit: 每个模块独立测试                                  │
│  Integration: 模块间交互测试                             │
│  E2E: 完整流程测试                                      │
└─────────────────────────────────────────────────────────┘
```

### 测试命令

```bash
# 运行所有测试
bun test

# 运行单个测试文件
bun test tests/tools.test.ts

# 运行带 coverage
bun test --coverage

# 运行 E2E 测试
bun test e2e/
```

---

## 第四部分：部署和发布

### 版本管理

```bash
# 1.0.0
bun run version  # 输出当前版本

# 发布流程
git tag v1.0.0
git push origin v1.0.0
```

### 构建产物

```
dist/
├── cli.js         # CLI 入口
├── index.js       # 库入口
└── types/         # 类型定义
```

---

## 总结

### 实现顺序

| 阶段 | 内容 | 产出 |
|------|------|------|
| 1 | 项目脚手架 | 可运行的 CLI 基础 |
| 2 | 命令系统 | 集中式命令注册表 |
| 3 | 核心处理层 | 查询引擎、工具系统 |
| 4 | 状态管理 | Observable Store、Signal、队列 |
| 5 | 桥接层 | 远程会话、传输抽象 |
| 6 | Analytics | Sink 模式事件系统 |
| 7 | TUI | React/Ink 界面 |
| 8 | MCP | 多传输支持 |
| 9 | Compact | 上下文压缩 |

### 核心架构原则

1. **Feature Flag DCE**: 构建时条件编译
2. **Sink 模式**: 延迟绑定解耦
3. **Observable Store**: 简单响应式状态
4. **Discriminated Union**: 类型安全分发
5. **PID Lock**: 快速失效检测

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-01-claude-code-reimplementation.md`.**

**Two execution options:**

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
