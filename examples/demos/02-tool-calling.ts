// ============================================
// Demo 02: Tool 调用 — 让 Agent 具备能力
// ============================================
// 本 Demo 展示 Tool Calling 的核心机制：
// Agent 不仅能"说话"，还能"做事"。
//
// 运行方式：npx tsx examples/demos/02-tool-calling.ts
//
// 🎯 学习目标：
//   1. 理解 Tool 的定义和接口
//   2. 理解 LLM 如何"决定"调用工具
//   3. 掌握 Tool 调用的完整流程
//   4. 了解多工具调用场景

import { z } from "zod";

// ============================================
// === 第一部分：定义 Tool 接口 ===
// ============================================
// Tool 是 Agent 与外部世界交互的桥梁。
// 每个 Tool 需要：
//   - 唯一的标识符（id）
//   - 描述（LLM 根据描述来决定是否调用）
//   - 输入参数的 Schema（使用 Zod 定义类型）
//   - 执行函数（实际的逻辑）

/** Tool 的定义接口 */
interface ToolDefinition<TInput = any, TOutput = any> {
  /** 工具唯一标识 */
  id: string;
  /** 工具描述 — LLM 依赖这个描述来判断何时使用此工具 */
  description: string;
  /** 输入参数的 Zod Schema */
  inputSchema: z.ZodType<TInput>;
  /** 执行函数 */
  execute: (input: TInput) => Promise<TOutput>;
}

/** Tool 调用请求（LLM 返回的结构） */
interface ToolCall {
  toolId: string;
  args: Record<string, any>;
}

/** Tool 调用结果 */
interface ToolResult {
  toolId: string;
  result: any;
  success: boolean;
  error?: string;
}

/** 消息类型 */
interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

// ============================================
// === 第二部分：实现示例工具 ===
// ============================================
// 下面我们创建三个实用工具来展示不同类型的 Tool

console.log("╔════════════════════════════════════════════════╗");
console.log("║    Demo 02: Tool 调用 — 让 Agent 具备能力       ║");
console.log("╚════════════════════════════════════════════════╝\n");

// --- 工具 1：计算器 ---
console.log("🔧 注册工具...\n");

const calculatorTool: ToolDefinition = {
  id: "calculator",
  description: "执行基本的数学运算，支持加减乘除和幂运算",
  inputSchema: z.object({
    operation: z
      .enum(["add", "subtract", "multiply", "divide", "power"])
      .describe("运算类型"),
    a: z.number().describe("第一个操作数"),
    b: z.number().describe("第二个操作数"),
  }),
  execute: async (input) => {
    const { operation, a, b } = input;
    let result: number;

    switch (operation) {
      case "add":
        result = a + b;
        break;
      case "subtract":
        result = a - b;
        break;
      case "multiply":
        result = a * b;
        break;
      case "divide":
        if (b === 0) throw new Error("除数不能为零");
        result = a / b;
        break;
      case "power":
        result = Math.pow(a, b);
        break;
      default:
        throw new Error(`不支持的运算: ${operation}`);
    }

    return {
      expression: `${a} ${operation} ${b}`,
      result,
      formatted: `${a} ${
        { add: "+", subtract: "-", multiply: "×", divide: "÷", power: "^" }[
          operation
        ]
      } ${b} = ${result}`,
    };
  },
};
console.log(`   ✅ ${calculatorTool.id}: ${calculatorTool.description}`);

// --- 工具 2：获取当前时间 ---
const getCurrentTimeTool: ToolDefinition = {
  id: "getCurrentTime",
  description: "获取当前的日期和时间信息",
  inputSchema: z.object({
    timezone: z
      .string()
      .optional()
      .default("Asia/Shanghai")
      .describe("时区，默认为北京时间"),
    format: z
      .enum(["full", "date", "time"])
      .optional()
      .default("full")
      .describe("返回格式"),
  }),
  execute: async (input) => {
    const now = new Date();

    // 使用 Intl API 处理时区
    const options: Intl.DateTimeFormatOptions = {
      timeZone: input.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };

    const formatted = new Intl.DateTimeFormat("zh-CN", options).format(now);
    const dayOfWeek = [
      "星期日",
      "星期一",
      "星期二",
      "星期三",
      "星期四",
      "星期五",
      "星期六",
    ][now.getDay()];

    return {
      datetime: formatted,
      dayOfWeek,
      timestamp: now.getTime(),
      timezone: input.timezone,
    };
  },
};
console.log(
  `   ✅ ${getCurrentTimeTool.id}: ${getCurrentTimeTool.description}`
);

// --- 工具 3：知识库搜索 ---
const searchKnowledgeTool: ToolDefinition = {
  id: "searchKnowledge",
  description: "搜索知识库获取相关信息，支持技术文档和常见问题搜索",
  inputSchema: z.object({
    query: z.string().describe("搜索关键词"),
    category: z
      .enum(["tech", "general", "faq"])
      .optional()
      .default("general")
      .describe("搜索类别"),
    limit: z.number().optional().default(3).describe("返回结果数量"),
  }),
  execute: async (input) => {
    // 模拟知识库数据
    const knowledgeBase: Record<string, Array<{ title: string; content: string; relevance: number }>> = {
      typescript: [
        {
          title: "TypeScript 基础",
          content:
            "TypeScript 是 JavaScript 的超集，添加了类型系统和编译时检查。",
          relevance: 0.95,
        },
        {
          title: "TypeScript 泛型",
          content:
            "泛型允许你创建可重用的组件，支持多种类型而不失类型安全性。",
          relevance: 0.85,
        },
        {
          title: "TypeScript 装饰器",
          content: "装饰器是一种特殊的声明，可以附加到类、方法、属性上。",
          relevance: 0.75,
        },
      ],
      mastra: [
        {
          title: "Mastra Agent 概述",
          content:
            "Mastra Agent 是一个自主的 AI 实体，能够理解指令、使用工具并完成复杂任务。",
          relevance: 0.98,
        },
        {
          title: "Mastra Tool 系统",
          content:
            "Mastra 的 Tool 系统允许 Agent 调用外部函数，扩展 AI 的能力边界。",
          relevance: 0.92,
        },
      ],
      default: [
        {
          title: "通用知识",
          content: "这是一个通用的搜索结果。知识库中没有找到精确匹配的内容。",
          relevance: 0.5,
        },
      ],
    };

    // 根据查询匹配知识库
    const queryLower = input.query.toLowerCase();
    let results =
      knowledgeBase[queryLower] ||
      Object.entries(knowledgeBase).find(([key]) =>
        queryLower.includes(key)
      )?.[1] ||
      knowledgeBase["default"];

    results = results.slice(0, input.limit);

    // 模拟搜索延迟
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      query: input.query,
      totalResults: results.length,
      results,
    };
  },
};
console.log(
  `   ✅ ${searchKnowledgeTool.id}: ${searchKnowledgeTool.description}`
);

// ============================================
// === 第三部分：构建 ToolAgent ===
// ============================================
// ToolAgent 在 SimpleAgent 的基础上增加了 Tool 调用能力。
// 核心流程：
// 1. 用户提问 → 2. LLM 判断是否需要工具 → 3. 执行工具
// → 4. 将工具结果反馈给 LLM → 5. LLM 生成最终回复

class ToolAgent {
  private name: string;
  private instructions: string;
  private tools: Map<string, ToolDefinition>;
  private conversationHistory: Message[];

  constructor(config: {
    name: string;
    instructions: string;
    tools: ToolDefinition[];
  }) {
    this.name = config.name;
    this.instructions = config.instructions;
    this.tools = new Map();
    this.conversationHistory = [];

    // 注册所有工具
    for (const tool of config.tools) {
      this.tools.set(tool.id, tool);
    }
  }

  /**
   * 模拟 LLM 判断是否需要调用工具
   *
   * 在真实场景中，LLM 会根据：
   * 1. 用户的意图
   * 2. 可用工具的描述
   * 3. 系统指令
   * 来决定是否调用工具以及调用哪个工具
   */
  private detectToolCalls(userInput: string): ToolCall[] {
    const input = userInput.toLowerCase();
    const toolCalls: ToolCall[] = [];

    // 检测数学计算需求
    const mathMatch = input.match(/(\d+)\s*([+\-*/×÷^]|加|减|乘|除|的)\s*(\d+)/);
    if (
      mathMatch ||
      input.includes("计算") ||
      input.includes("算") ||
      input.includes("多少")
    ) {
      if (mathMatch) {
        const a = parseFloat(mathMatch[1]);
        const opRaw = mathMatch[2];
        const b = parseFloat(mathMatch[3]);

        const opMap: Record<string, string> = {
          "+": "add",
          "加": "add",
          "-": "subtract",
          "减": "subtract",
          "*": "multiply",
          "×": "multiply",
          "乘": "multiply",
          "/": "divide",
          "÷": "divide",
          "除": "divide",
          "^": "power",
          "的": "power",
        };

        toolCalls.push({
          toolId: "calculator",
          args: {
            operation: opMap[opRaw] || "add",
            a,
            b,
          },
        });
      }
    }

    // 检测时间查询需求
    if (
      input.includes("时间") ||
      input.includes("日期") ||
      input.includes("几点") ||
      input.includes("今天") ||
      input.includes("time") ||
      input.includes("date")
    ) {
      toolCalls.push({
        toolId: "getCurrentTime",
        args: {
          timezone: "Asia/Shanghai",
          format: "full",
        },
      });
    }

    // 检测知识搜索需求
    if (
      input.includes("搜索") ||
      input.includes("查找") ||
      input.includes("什么是") ||
      input.includes("了解") ||
      input.includes("search") ||
      input.includes("typescript") ||
      input.includes("mastra")
    ) {
      // 提取搜索关键词
      let query = input
        .replace(/(搜索|查找|什么是|了解|search)/g, "")
        .trim();
      if (!query) query = input;

      toolCalls.push({
        toolId: "searchKnowledge",
        args: {
          query,
          category: "general",
          limit: 3,
        },
      });
    }

    return toolCalls;
  }

  /**
   * 执行单个工具调用
   */
  private async executeTool(toolCall: ToolCall): Promise<ToolResult> {
    const tool = this.tools.get(toolCall.toolId);

    if (!tool) {
      return {
        toolId: toolCall.toolId,
        result: null,
        success: false,
        error: `工具 "${toolCall.toolId}" 未找到`,
      };
    }

    try {
      // 使用 Zod 验证输入参数
      const validatedInput = tool.inputSchema.parse(toolCall.args);

      console.log(`   ⚙️  执行工具: ${tool.id}`);
      console.log(`   📥 输入参数: ${JSON.stringify(validatedInput, null, 2)}`);

      // 执行工具
      const result = await tool.execute(validatedInput);

      console.log(`   📤 执行结果: ${JSON.stringify(result, null, 2)}`);

      return {
        toolId: toolCall.toolId,
        result,
        success: true,
      };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : String(error);
      console.log(`   ❌ 执行失败: ${errorMsg}`);

      return {
        toolId: toolCall.toolId,
        result: null,
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * 根据工具执行结果生成最终回复
   *
   * 在真实场景中，工具结果会被反馈给 LLM，
   * LLM 再根据结果生成自然语言回复
   */
  private generateResponseWithToolResults(
    userInput: string,
    toolResults: ToolResult[]
  ): string {
    const resultSummaries = toolResults
      .map((tr) => {
        if (!tr.success) {
          return `工具 ${tr.toolId} 执行失败: ${tr.error}`;
        }

        switch (tr.toolId) {
          case "calculator": {
            const r = tr.result;
            return `📊 计算结果：${r.formatted}`;
          }
          case "getCurrentTime": {
            const r = tr.result;
            return `🕐 当前时间：${r.datetime}（${r.dayOfWeek}），时区：${r.timezone}`;
          }
          case "searchKnowledge": {
            const r = tr.result;
            const items = r.results
              .map(
                (item: any, i: number) =>
                  `   ${i + 1}. ${item.title} (相关度: ${(item.relevance * 100).toFixed(0)}%)\n      ${item.content}`
              )
              .join("\n");
            return `🔍 搜索"${r.query}"找到 ${r.totalResults} 条结果：\n${items}`;
          }
          default:
            return `工具 ${tr.toolId} 返回: ${JSON.stringify(tr.result)}`;
        }
      })
      .join("\n\n");

    return `根据你的问题"${userInput}"，我使用了相关工具来获取信息：\n\n${resultSummaries}\n\n希望这些信息对你有帮助！如果需要更多详情，请随时告诉我。`;
  }

  /**
   * 核心方法：处理用户输入并生成回复
   *
   * 完整的 Tool Calling 流程：
   * ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
   * │ 用户输入  │ →  │ LLM 判断 │ →  │ 执行工具  │ →  │ 结果反馈  │ →  │ 最终回复  │
   * └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
   */
  async processInput(userInput: string): Promise<string> {
    console.log(`\n${"─".repeat(50)}`);
    console.log(`📨 用户输入: "${userInput}"`);
    console.log(`${"─".repeat(50)}`);

    // 步骤 1：LLM 判断是否需要调用工具
    console.log("\n🧠 步骤 1: LLM 分析用户意图...");
    const toolCalls = this.detectToolCalls(userInput);

    if (toolCalls.length === 0) {
      console.log("   💭 无需调用工具，直接回复");
      return `你说的是："${userInput}"。这个问题我可以直接回答，不需要使用任何工具。作为 AI 助手，我很乐意与你交流！\n\n💡 提示：你可以尝试问我数学计算、当前时间或知识搜索相关的问题，我会调用相应的工具来帮你。`;
    }

    console.log(
      `   🔧 决定调用 ${toolCalls.length} 个工具: ${toolCalls.map((t) => t.toolId).join(", ")}`
    );

    // 步骤 2：执行所有工具调用
    console.log("\n⚡ 步骤 2: 执行工具调用...");
    const toolResults: ToolResult[] = [];

    for (const toolCall of toolCalls) {
      console.log(`\n   📌 调用工具: ${toolCall.toolId}`);
      const result = await this.executeTool(toolCall);
      toolResults.push(result);
    }

    // 步骤 3：将工具结果反馈给 LLM 生成最终回复
    console.log("\n📝 步骤 3: 根据工具结果生成最终回复...");
    const finalResponse = this.generateResponseWithToolResults(
      userInput,
      toolResults
    );

    return finalResponse;
  }
}

// ============================================
// === 第四部分：Tool 调用流程演示 ===
// ============================================

async function runDemo(): Promise<void> {
  console.log("📚 本 Demo 将展示 Tool Calling 的核心机制：");
  console.log("   1. Tool 的定义方式");
  console.log("   2. LLM 如何决定调用工具");
  console.log("   3. 工具执行和结果反馈");
  console.log("   4. 多工具调用场景\n");

  // 创建 ToolAgent
  const agent = new ToolAgent({
    name: "工具助手",
    instructions: "你是一个配备了多种工具的 AI 助手，可以进行数学计算、查询时间和搜索知识库。",
    tools: [calculatorTool, getCurrentTimeTool, searchKnowledgeTool],
  });

  // --- 场景 1：数学计算 ---
  console.log("\n" + "═".repeat(50));
  console.log("🎯 场景 1: 数学计算");
  console.log("═".repeat(50));

  const result1 = await agent.processInput("帮我计算 42 * 38");
  console.log(`\n🤖 最终回复:\n${result1}`);

  // --- 场景 2：时间查询 ---
  console.log("\n" + "═".repeat(50));
  console.log("🎯 场景 2: 时间查询");
  console.log("═".repeat(50));

  const result2 = await agent.processInput("现在几点了？今天是什么日期？");
  console.log(`\n🤖 最终回复:\n${result2}`);

  // --- 场景 3：知识搜索 ---
  console.log("\n" + "═".repeat(50));
  console.log("🎯 场景 3: 知识库搜索");
  console.log("═".repeat(50));

  const result3 = await agent.processInput("搜索一下 TypeScript 的知识");
  console.log(`\n🤖 最终回复:\n${result3}`);

  // --- 场景 4：多工具调用 ---
  console.log("\n" + "═".repeat(50));
  console.log("🎯 场景 4: 多工具联合调用");
  console.log("═".repeat(50));
  console.log(
    "📖 说明：一个请求可能触发多个工具，Agent 会依次调用并汇总结果"
  );

  const result4 = await agent.processInput(
    "现在几点了？另外帮我搜索一下 Mastra 的资料"
  );
  console.log(`\n🤖 最终回复:\n${result4}`);

  // --- 场景 5：无工具调用 ---
  console.log("\n" + "═".repeat(50));
  console.log("🎯 场景 5: 无需工具的对话");
  console.log("═".repeat(50));
  console.log("📖 说明：不是所有问题都需要工具，LLM 能直接回答的就直接回答");

  const result5 = await agent.processInput("你好呀！");
  console.log(`\n🤖 最终回复:\n${result5}`);

  // --- 总结 ---
  console.log("\n" + "═".repeat(50));
  console.log("✅ Tool 调用演示完成！");
  console.log("═".repeat(50));
  console.log("");
  console.log("🎯 你学到了：");
  console.log("   ✓ Tool = id + description + inputSchema + execute");
  console.log("   ✓ LLM 根据描述决定是否调用工具");
  console.log("   ✓ Zod Schema 用于输入验证");
  console.log("   ✓ 工具结果会反馈给 LLM 生成最终回复");
  console.log("   ✓ 一次对话可以调用多个工具");
  console.log("");
  console.log("💡 下一步：");
  console.log(
    "   • 学习结构化输出: npx tsx examples/demos/03-structured-output.ts"
  );
  console.log("═".repeat(50));
}

// ============================================
// === 第五部分：使用 Mastra 的 createTool（可选）===
// ============================================
// 使用 Mastra 框架，你可以更简洁地定义工具：
//
// import { Agent } from '@mastra/core/agent';
// import { createTool } from '@mastra/core/tools';
// import { openai } from '@ai-sdk/openai';
// import { z } from 'zod';
//
// // 使用 createTool 定义工具
// const calculator = createTool({
//   id: 'calculator',
//   description: '执行基本数学运算',
//   inputSchema: z.object({
//     operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
//     a: z.number(),
//     b: z.number(),
//   }),
//   execute: async ({ context }) => {
//     const { operation, a, b } = context;
//     switch (operation) {
//       case 'add': return { result: a + b };
//       case 'subtract': return { result: a - b };
//       case 'multiply': return { result: a * b };
//       case 'divide': return { result: a / b };
//     }
//   },
// });
//
// // 创建带工具的 Agent
// const agent = new Agent({
//   name: '工具助手',
//   instructions: '你是一个配备了计算器的 AI 助手。',
//   model: openai('gpt-4o'),
//   tools: { calculator },
// });
//
// // Agent 会自动判断何时调用工具
// const response = await agent.generate('帮我算一下 123 * 456');
// console.log(response.text);

// 启动 Demo
runDemo().catch(console.error);
