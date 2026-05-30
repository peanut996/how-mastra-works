# 🧠 深入理解 Mastra 框架

> **How Mastra Works** — 通过渐进式 Demo 和源码解析，系统学习 Mastra AI Agent 框架的工作原理。

## 📖 项目简介

[Mastra](https://github.com/mastra-ai/mastra) 是一个 TypeScript 原生的 AI Agent 框架，构建于 Vercel AI SDK 之上，提供了 Agent、Tool、Workflow、Memory、RAG、Evals 等一站式能力。

本项目参考 [how-pi-agent-works](https://github.com/cellinlab/how-pi-agent-works) 的教学模式，通过**渐进式 Demo** + **文档解析**的方式，帮助你从零理解 Mastra 框架的核心原理。

## ✨ 特色

- 🎯 **渐进式学习** — 从最小 Agent 到完整工作流，逐步构建理解
- 🔧 **动手实践** — 每个概念配套可运行的 TypeScript Demo
- 🧪 **模拟模式** — 无需 API Key 即可运行所有 Demo
- 📚 **中文文档** — 配套 VitePress 文档站点，深度解析每个模块

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 pnpm

### 安装

```bash
git clone https://github.com/your-username/how-mastra-works.git
cd how-mastra-works
npm install
```

### 运行 Demo

```bash
# Demo 01: Agent 基础 — 最小 Agent 实现
npm run demo:01

# Demo 02: Tool 调用 — 让 Agent 具备能力
npm run demo:02

# Demo 03: 结构化输出 — 类型安全的 LLM 响应
npm run demo:03
```

### 查看文档

```bash
npm run docs:dev
# 打开 http://localhost:5173
```

## 📁 项目结构

```
how-mastra-works/
├── docs/                     # VitePress 文档站点
│   ├── guide/                # 入门指南
│   ├── core/                 # 核心概念解析
│   └── advanced/             # 进阶主题
├── examples/
│   └── demos/                # 渐进式 TypeScript Demo
│       ├── 01-agent-basics.ts
│       ├── 02-tool-calling.ts
│       ├── 03-structured-output.ts
│       ├── 04-memory.ts        (Phase 2)
│       ├── 05-rag.ts           (Phase 2)
│       ├── 06-workflows.ts     (Phase 2)
│       ├── 07-multi-agent.ts   (Phase 3)
│       └── 08-mcp.ts           (Phase 3)
├── package.json
└── tsconfig.json
```

## 📚 学习路径

| 阶段 | Demo | 主题 | 核心概念 |
|------|------|------|---------|
| 基础 | 01 | Agent 基础 | Agent 构造、generate/stream、Agent Loop |
| 基础 | 02 | Tool 调用 | createTool、Zod Schema、工具执行流程 |
| 基础 | 03 | 结构化输出 | 输出 Schema、类型安全、数据提取 |
| 进阶 | 04 | 记忆系统 | 四层记忆架构、对话持久化 |
| 进阶 | 05 | RAG | 分块、嵌入、向量检索 |
| 进阶 | 06 | 工作流 | 图状态机、分支/并行/循环 |
| 专家 | 07 | 多 Agent | Supervisor、Agent-as-Tool 模式 |
| 专家 | 08 | MCP 集成 | 模型上下文协议、工具互操作 |

## 🔑 使用真实 LLM

默认情况下，所有 Demo 使用模拟模式运行。如需使用真实 LLM：

1. 复制环境变量文件：
```bash
cp .env.example .env
```

2. 填入你的 API Key，并设置 `USE_REAL_LLM=true`

## 📄 License

MIT

## 🙏 致谢

- [Mastra](https://github.com/mastra-ai/mastra) — 本项目的学习对象
- [how-pi-agent-works](https://github.com/cellinlab/how-pi-agent-works) — 本项目的灵感来源
- [Vercel AI SDK](https://github.com/vercel/ai) — Mastra 的底层 SDK
