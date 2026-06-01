# How Mastra Works

> A progressive, hands-on tutorial to master the [Mastra](https://github.com/mastra-ai/mastra) AI Agent framework — from your first `generate()` call to multi-agent orchestration.

## What is this?

[Mastra](https://github.com/mastra-ai/mastra) is a TypeScript-native AI Agent framework built on top of the Vercel AI SDK. It provides Agent, Tool, Workflow, Memory, RAG, Evals, and MCP in a single, cohesive toolkit.

This project borrows the pedagogy of [how-pi-agent-works](https://github.com/cellinlab/how-pi-agent-works) and pairs **runnable TypeScript demos** with a **VitePress documentation site** so you learn *how* things work, not just *what* to type.

Live docs: [how-mastra-works.vercel.app](https://how-mastra-works.vercel.app)

## Highlights

- Progressive learning — 11 demos that build on each other
- Zero-config mock mode — run every demo without an API key
- Fully runnable — each concept ships with a standalone `.ts` file
- Deep-dive docs — architecture diagrams, source-code annotations, and mental models

## Quick Start

Requirements: Node.js 18+ & npm/pnpm

```bash
git clone https://github.com/peanut996/how-mastra-works.git
cd how-mastra-works
npm install

# Run the first demo
npm run demo:01
```

## Learning Path

### Phase 1 — Core Concepts

| Demo | Topic | Key Takeaway |
|------|-------|-------------|
| `demo:01` | Agent Basics | `generate` vs `stream`, the agent loop |
| `demo:02` | Tool Calling | `createTool`, Zod schema validation, execution flow |
| `demo:03` | Structured Output | Type-safe responses with output schemas |

### Phase 2 — Intermediate

| Demo | Topic | Key Takeaway |
|------|-------|-------------|
| `demo:04` | Memory System | 4-layer memory architecture, persistent conversations |
| `demo:05` | RAG | Chunking, embedding, vector search |
| `demo:06` | Workflows | Graph state machines, branching/parallel/looping |

### Phase 3 — Expert

| Demo | Topic | Key Takeaway |
|------|-------|-------------|
| `demo:07` | Multi-Agent | Supervisor pattern, agent-as-tool |
| `demo:08` | MCP | Model Context Protocol, tool interoperability |

### Phase 4 — Deep Dive

| Demo | Topic | Key Takeaway |
|------|-------|-------------|
| `demo:09` | Memory Observer | Inspecting memory layers at runtime |
| `demo:10` | Context Management | Token budgeting, sliding-window strategies |
| `demo:11` | Advanced Skills | Composition patterns and real-world recipes |

## Project Structure

```
how-mastra-works/
├── docs/                     # VitePress docs site
│   ├── guide/                # Getting started
│   ├── core/                 # Core concept breakdowns
│   ├── advanced/             # Advanced topics
│   └── deep-dive/            # Architecture & internals
├── examples/
│   └── demos/                # Progressive TypeScript demos
│       ├── 01-agent-basics.ts
│       ├── 02-tool-calling.ts
│       ├── ... (11 demos total)
├── package.json
└── tsconfig.json
```

## Using Real LLMs

All demos default to mock mode so you can explore the framework without API keys.

To switch to a real LLM:

```bash
cp .env.example .env
# Add your API key and set USE_REAL_LLM=true
```

## Documentation

```bash
# Start the docs dev server
npm run docs:dev
# Open http://localhost:5173
```

## License

MIT

## Acknowledgements

- [Mastra](https://github.com/mastra-ai/mastra) — the framework we study
- [how-pi-agent-works](https://github.com/cellinlab/how-pi-agent-works) — the pedagogical inspiration
- [Vercel AI SDK](https://github.com/vercel/ai) — the foundation beneath Mastra
