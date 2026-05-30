// ============================================
// Demo 01: Agent 基础 — 最小 Agent 实现
// ============================================
// 本 Demo 从零构建一个最小的 Agent，理解 Agent 的核心概念
//
// 运行方式：npx tsx examples/demos/01-agent-basics.ts
// 交互模式：npx tsx examples/demos/01-agent-basics.ts --interactive
//
// 🎯 学习目标：
//   1. 理解什么是 Agent（代理）
//   2. 理解 LLM 在 Agent 中的角色
//   3. 掌握 Agent Loop 的基本流程
//   4. 了解 streaming（流式输出）的概念

import * as readline from "readline";

// ============================================
// === 第一部分：模拟 LLM ===
// ============================================
// 在真实场景中，LLM（大语言模型）是 Agent 的"大脑"。
// 这里我们先用一个模拟的 LLM 来理解整个流程，
// 这样你不需要 API Key 就能运行和学习。

/**
 * 消息的角色类型
 * - system: 系统指令，定义 Agent 的行为方式
 * - user: 用户输入
 * - assistant: Agent（LLM）的回复
 */
type MessageRole = "system" | "user" | "assistant";

/** 一条消息的结构 */
interface Message {
  role: MessageRole;
  content: string;
}

/** LLM 的响应结构 */
interface LLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
}

/**
 * 模拟 LLM 提供者
 *
 * 真实的 LLM（如 GPT-4、Claude）会通过深度学习理解语义，
 * 这里我们通过关键词匹配来模拟这个过程，帮助你理解数据流。
 */
class MockLLMProvider {
  private name: string;

  constructor(name: string = "mock-gpt-4o") {
    this.name = name;
  }

  /**
   * 模拟调用 LLM 生成回复
   * 真实的 LLM 调用会发送 HTTP 请求到 API 端点
   */
  async generate(messages: Message[]): Promise<LLMResponse> {
    // 模拟网络延迟（真实 API 调用通常需要 1-5 秒）
    await this.simulateLatency();

    // 提取系统指令和用户最新消息
    const systemMessage = messages.find((m) => m.role === "system");
    const userMessage = messages.filter((m) => m.role === "user").pop();

    if (!userMessage) {
      return {
        content: "（没有收到用户消息）",
        usage: { promptTokens: 0, completionTokens: 0 },
      };
    }

    const input = userMessage.content.toLowerCase();
    const response = this.patternMatch(input, systemMessage?.content);

    return {
      content: response,
      usage: {
        promptTokens: this.estimateTokens(messages),
        completionTokens: this.estimateTokens([
          { role: "assistant", content: response },
        ]),
      },
    };
  }

  /**
   * 模拟流式输出
   * 真实的 LLM streaming 使用 Server-Sent Events (SSE)，
   * 每次返回一个或几个 token（词元）
   */
  async *stream(messages: Message[]): AsyncGenerator<string> {
    const response = await this.generate(messages);
    const chars = response.content;

    // 逐字符输出，模拟流式效果
    for (const char of chars) {
      await new Promise((resolve) => setTimeout(resolve, 20));
      yield char;
    }
  }

  /**
   * 基于关键词的模式匹配
   * 这是我们模拟 LLM "理解"能力的核心
   */
  private patternMatch(
    input: string,
    systemPrompt: string | undefined
  ): string {
    // 问候类
    if (
      input.includes("你好") ||
      input.includes("hello") ||
      input.includes("hi")
    ) {
      return "你好！我是一个 AI 助手 🤖。很高兴见到你！有什么我可以帮助你的吗？无论是技术问题、日常咨询还是学习交流，我都乐意为你效劳。";
    }

    // 天气类
    if (input.includes("天气") || input.includes("weather")) {
      return "关于天气，我来给你一些信息 🌤️：\n\n今天的天气看起来不错！建议你：\n1. 出门带一把伞，以防万一\n2. 注意防晒，紫外线可能较强\n3. 保持适当的水分摄入\n\n不过我是 AI 助手，建议你查看实时天气预报获取最准确的信息。";
    }

    // 代码类
    if (
      input.includes("代码") ||
      input.includes("code") ||
      input.includes("编程") ||
      input.includes("programming")
    ) {
      return '聊到代码，我有一些编程小技巧分享 💻：\n\n1. **命名规范**：变量名要有意义，`userData` 比 `x` 好得多\n2. **小函数原则**：每个函数只做一件事\n3. **错误处理**：永远不要忽略错误，使用 try-catch\n4. **注释**：写"为什么"而不是"是什么"\n\n```typescript\n// ❌ 不好的写法\nconst x = getData();\n\n// ✅ 好的写法\nconst activeUsers = await fetchActiveUsers();\n```\n\n你想了解哪方面的编程知识？';
    }

    // 介绍自己
    if (
      input.includes("你是谁") ||
      input.includes("who are you") ||
      input.includes("介绍")
    ) {
      const agentContext = systemPrompt
        ? `根据我的设定，${systemPrompt}`
        : "我是一个通用 AI 助手";
      return `让我介绍一下自己 🎭：\n\n${agentContext}\n\n我的核心能力：\n- 💬 自然语言理解和对话\n- 📝 文本生成和编辑\n- 🤔 问题分析和建议\n- 💡 创意和头脑风暴\n\n我是通过 Mastra Agent 框架构建的，这个 Demo 展示了 Agent 的基本工作原理。`;
    }

    // Mastra 相关
    if (
      input.includes("mastra") ||
      input.includes("agent") ||
      input.includes("框架")
    ) {
      return "Mastra 是一个强大的 AI Agent 框架 🚀：\n\n**核心概念：**\n- **Agent**：自主行动的 AI 实体，有自己的指令和能力\n- **Tool**：Agent 可以调用的外部工具（API、数据库等）\n- **Workflow**：多步骤自动化流程\n- **Memory**：对话历史和知识存储\n\n**为什么用 Mastra？**\n1. TypeScript 原生，类型安全\n2. 内置 Tool 系统\n3. 支持多种 LLM 提供商\n4. 简洁的 API 设计\n\n你可以通过运行其他 Demo 来深入了解这些概念！";
    }

    // 默认回复
    return `这是一个很好的问题！🤔\n\n你说的是："${input}"\n\n作为 AI 助手，我会尽力帮助你。这个 Demo 使用的是模拟 LLM，所以我的回答是基于关键词匹配的。\n\n在真实场景中，LLM 会通过深度学习来理解你的意图并给出更智能的回复。\n\n💡 提示：试试问我关于"天气"、"代码"或"Mastra"的问题！`;
  }

  /** 模拟网络延迟 */
  private async simulateLatency(): Promise<void> {
    const delay = Math.random() * 300 + 200; // 200-500ms
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /** 粗略估算 token 数量（真实 LLM 使用 tokenizer） */
  private estimateTokens(messages: Message[]): number {
    const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
    return Math.ceil(totalChars / 2); // 中文大约每个字符 1-2 token
  }
}

// ============================================
// === 第二部分：构建最小 Agent ===
// ============================================
// Agent = 系统指令 + LLM + 对话管理
// 这是所有 AI Agent 框架的核心抽象

/** Agent 配置 */
interface AgentConfig {
  /** Agent 的名称 */
  name: string;
  /** 系统指令（定义 Agent 的角色和行为） */
  instructions: string;
  /** 使用的 LLM 模型标识 */
  model: string;
}

/**
 * 最小 Agent 实现
 *
 * 一个 Agent 本质上是对 LLM 的一层封装：
 * - 它维护一个对话上下文（消息历史）
 * - 它有一个系统指令来引导 LLM 的行为
 * - 它提供简洁的接口来与 LLM 交互
 */
class SimpleAgent {
  private config: AgentConfig;
  private llm: MockLLMProvider;
  private conversationHistory: Message[];

  constructor(config: AgentConfig) {
    this.config = config;
    this.llm = new MockLLMProvider(config.model);
    this.conversationHistory = [];

    console.log(`\n🤖 Agent "${config.name}" 已创建`);
    console.log(`📋 系统指令: ${config.instructions.substring(0, 60)}...`);
    console.log(`🧠 模型: ${config.model}`);
  }

  /**
   * 生成回复（非流式）
   *
   * 这是最基本的交互方式：
   * 1. 构建完整的消息列表（系统指令 + 历史 + 新消息）
   * 2. 一次性发送给 LLM
   * 3. 等待完整回复返回
   */
  async generate(userInput: string): Promise<string> {
    console.log(`\n📨 用户输入: "${userInput}"`);

    // 步骤 1：将用户消息加入历史
    this.conversationHistory.push({
      role: "user",
      content: userInput,
    });

    // 步骤 2：构建发送给 LLM 的消息列表
    const messages = this.buildMessages();
    console.log(`📤 发送给 LLM 的消息数量: ${messages.length}`);

    // 步骤 3：调用 LLM
    const response = await this.llm.generate(messages);
    console.log(
      `📥 收到回复 (${response.usage.completionTokens} tokens)`
    );

    // 步骤 4：将 Agent 的回复加入历史（用于多轮对话）
    this.conversationHistory.push({
      role: "assistant",
      content: response.content,
    });

    return response.content;
  }

  /**
   * 流式生成回复
   *
   * 流式输出的优势：
   * - 用户可以更快看到第一个字符（降低首字延迟）
   * - 提供更好的交互体验
   * - 可以在生成过程中中断
   */
  async *stream(userInput: string): AsyncGenerator<string> {
    console.log(`\n📨 用户输入 (流式): "${userInput}"`);

    this.conversationHistory.push({
      role: "user",
      content: userInput,
    });

    const messages = this.buildMessages();
    let fullResponse = "";

    // 逐个 token 输出
    for await (const chunk of this.llm.stream(messages)) {
      fullResponse += chunk;
      yield chunk;
    }

    // 流式结束后，将完整回复存入历史
    this.conversationHistory.push({
      role: "assistant",
      content: fullResponse,
    });
  }

  /**
   * 构建完整的消息列表
   *
   * 消息结构：
   * [系统指令, 历史消息1, 历史消息2, ..., 最新用户消息]
   *
   * 系统指令始终在最前面，它定义了 Agent 的"人格"
   */
  private buildMessages(): Message[] {
    const systemMessage: Message = {
      role: "system",
      content: this.config.instructions,
    };

    return [systemMessage, ...this.conversationHistory];
  }

  /** 清除对话历史 */
  resetHistory(): void {
    this.conversationHistory = [];
    console.log("🗑️  对话历史已清除");
  }

  /** 获取对话历史长度 */
  getHistoryLength(): number {
    return this.conversationHistory.length;
  }
}

// ============================================
// === 第三部分：Agent Loop（交互循环）===
// ============================================
// Agent Loop 是 Agent 与用户持续交互的核心模式：
// while (true) {
//   input = 获取用户输入()
//   response = agent.generate(input)
//   显示(response)
// }

/**
 * 创建交互式 CLI 会话
 */
async function startInteractiveSession(agent: SimpleAgent): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\n" + "=".repeat(50));
  console.log("🎮 进入交互模式");
  console.log('💡 输入消息与 Agent 对话，输入 "quit" 退出');
  console.log('💡 输入 "stream" 切换到流式模式测试');
  console.log('💡 输入 "reset" 清除对话历史');
  console.log("=".repeat(50));

  let useStreaming = false;

  const askQuestion = (): void => {
    const prefix = useStreaming ? "🔄 流式" : "📝 普通";
    rl.question(`\n${prefix} > `, async (input) => {
      const trimmed = input.trim();

      if (trimmed.toLowerCase() === "quit" || trimmed.toLowerCase() === "exit") {
        console.log("\n👋 再见！感谢使用 Agent Demo。");
        rl.close();
        return;
      }

      if (trimmed.toLowerCase() === "stream") {
        useStreaming = !useStreaming;
        console.log(
          `\n🔀 已切换到${useStreaming ? "流式" : "普通"}模式`
        );
        askQuestion();
        return;
      }

      if (trimmed.toLowerCase() === "reset") {
        agent.resetHistory();
        askQuestion();
        return;
      }

      if (!trimmed) {
        askQuestion();
        return;
      }

      try {
        if (useStreaming) {
          // 流式模式：逐字符输出
          process.stdout.write("\n🤖 Agent: ");
          for await (const chunk of agent.stream(trimmed)) {
            process.stdout.write(chunk);
          }
          console.log("\n");
        } else {
          // 普通模式：等待完整回复
          const response = await agent.generate(trimmed);
          console.log(`\n🤖 Agent: ${response}`);
        }
      } catch (error) {
        console.error("❌ 出错了:", error);
      }

      askQuestion();
    });
  };

  askQuestion();
}

// ============================================
// === 第四部分：运行演示 ===
// ============================================

async function runDemo(): Promise<void> {
  console.log("╔════════════════════════════════════════════════╗");
  console.log("║     Demo 01: Agent 基础 — 最小 Agent 实现       ║");
  console.log("╚════════════════════════════════════════════════╝");
  console.log("");
  console.log("📚 本 Demo 将展示 Agent 的核心概念：");
  console.log("   1. LLM 如何被封装和调用");
  console.log("   2. Agent 如何管理对话上下文");
  console.log("   3. 流式输出 vs 普通输出");
  console.log("   4. Agent Loop 交互模式");

  // --- 创建 Agent ---
  console.log("\n" + "─".repeat(50));
  console.log("📦 第一步：创建 Agent");
  console.log("─".repeat(50));

  const agent = new SimpleAgent({
    name: "小助手",
    instructions:
      "你是一个友好的 AI 助手，名叫小助手。你善于用简洁清晰的方式解释技术概念，会在回答中使用 emoji 来增加趣味性。",
    model: "mock-gpt-4o",
  });

  // --- 普通生成演示 ---
  console.log("\n" + "─".repeat(50));
  console.log("💬 第二步：普通生成 (generate)");
  console.log("─".repeat(50));
  console.log("\n📖 说明：普通生成会等待 LLM 返回完整响应后再显示");

  const response1 = await agent.generate("你好！请介绍一下你自己");
  console.log(`\n🤖 Agent 回复:\n${response1}`);

  // --- 多轮对话演示 ---
  console.log("\n" + "─".repeat(50));
  console.log("🔄 第三步：多轮对话（上下文保持）");
  console.log("─".repeat(50));
  console.log("\n📖 说明：Agent 会记住之前的对话，这就是'上下文'");
  console.log(`📊 当前对话历史: ${agent.getHistoryLength()} 条消息`);

  const response2 = await agent.generate("给我讲讲编程的技巧吧");
  console.log(`\n🤖 Agent 回复:\n${response2}`);
  console.log(`📊 当前对话历史: ${agent.getHistoryLength()} 条消息`);

  // --- 流式生成演示 ---
  console.log("\n" + "─".repeat(50));
  console.log("🌊 第四步：流式生成 (stream)");
  console.log("─".repeat(50));
  console.log("\n📖 说明：流式生成会逐个字符返回，提供更好的用户体验");
  console.log("         观察下面的文字是如何逐渐出现的：\n");

  process.stdout.write("🤖 Agent (流式): ");
  for await (const chunk of agent.stream("Mastra 是什么？")) {
    process.stdout.write(chunk);
  }
  console.log("\n");

  // --- 交互模式（可选） ---
  const isInteractive = process.argv.includes("--interactive");

  if (isInteractive) {
    await startInteractiveSession(agent);
  } else {
    console.log("─".repeat(50));
    console.log("✅ 基础演示完成！");
    console.log("");
    console.log("🎯 你学到了：");
    console.log("   ✓ Agent = 系统指令 + LLM + 对话管理");
    console.log("   ✓ generate() 返回完整响应");
    console.log("   ✓ stream() 逐步返回响应");
    console.log("   ✓ 对话历史维护上下文");
    console.log("");
    console.log("💡 下一步：");
    console.log("   • 运行交互模式: npx tsx examples/demos/01-agent-basics.ts --interactive");
    console.log("   • 学习 Tool 调用: npx tsx examples/demos/02-tool-calling.ts");
    console.log("─".repeat(50));
  }
}

// ============================================
// === 第五部分：使用真实 LLM（可选）===
// ============================================
// 如果你有 OpenAI API Key，可以取消下面的注释来使用真实的 LLM
//
// import { Agent } from '@mastra/core/agent';
// import { openai } from '@ai-sdk/openai';
//
// const realAgent = new Agent({
//   name: '真实助手',
//   instructions: '你是一个友好的 AI 助手。',
//   model: openai('gpt-4o'),
// });
//
// // 使用方式和我们的 SimpleAgent 完全一样！
// const response = await realAgent.generate('你好！');
// console.log(response.text);
//
// // 流式输出
// const stream = await realAgent.stream('讲个笑话');
// for await (const chunk of stream.textStream) {
//   process.stdout.write(chunk);
// }

// 启动 Demo
runDemo().catch(console.error);
