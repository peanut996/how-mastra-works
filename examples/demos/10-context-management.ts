// ============================================
// Demo 10: 上下文管理 — 解决“大海捞针”与 Token 溢出
// ============================================
// 在复杂的 Agent 应用中，我们需要在发给大模型之前，
// 将系统指令(System Prompt)、外部知识(RAG)、可用工具(Tools)以及历史对话(History)
// 按优先级像搭积木一样拼装起来，并计算 Token 数，防止超出模型上限。

import * as readline from "readline";

// ==========================================
// 1. 简易 Token 估算器
// ==========================================
// 实际应用中会使用 tiktoken 等专用库，这里用字符数/3 来简单估算
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3);
}

// ==========================================
// 2. Mock 知识库与数据
// ==========================================
const systemInstructions = `你是一个高级专家级助手。你需要准确地使用下方的外部知识来回答用户的问题。
严格遵守安全指南：不要输出任何恶意代码。
输出格式要求：请总是使用 Markdown 格式。`;

// 假设从 RAG 检索出的大段文本
const ragContext = `[知识库片段1] Mastra 是一个 TypeScript 原生的 AI 框架，它由 Vercel AI SDK 驱动。
[知识库片段2] Mastra 提供了一个强大的内置记忆引擎，包含四层架构。
[知识库片段3] (占位符...假设这里有非常长的文档文字，长达数万字，如果全部塞进去会爆 Token...) `.repeat(50);

// ==========================================
// 3. 上下文管理器 (Context Window Manager)
// ==========================================
class ContextManager {
  // 假设模型最大 Token 上限非常小 (为了演示裁剪效果)
  private readonly MAX_TOKENS = 500; 

  buildPrompt(
    userMessage: string,
    history: { role: string; content: string }[]
  ): string {
    console.log(`\n⚙️ [ContextManager] 开始拼装上下文 (Max Tokens: ${this.MAX_TOKENS})`);

    // 1. 核心指令 (最高优先级，绝对不能被裁剪)
    const coreTokens = estimateTokens(systemInstructions);
    console.log(`   ├─ 核心 System Prompt: 占用 ${coreTokens} Tokens`);

    // 2. 当前用户问题 (绝对不能裁剪)
    const userTokens = estimateTokens(userMessage);
    console.log(`   ├─ 当前 User 提问: 占用 ${userTokens} Tokens`);

    // 计算剩余可用的 Token
    let remainingTokens = this.MAX_TOKENS - coreTokens - userTokens;
    if (remainingTokens < 0) {
      throw new Error("模型上下文过小，无法容纳核心指令和当前问题！");
    }

    // 3. 动态拼装历史记录 (滑动窗口：从新到旧截取，直到耗尽额度)
    let historyText = "";
    let historyTokens = 0;
    // 反向遍历历史记录 (最近的优先)
    for (let i = history.length - 1; i >= 0; i--) {
      const msg = `[${history[i].role}]: ${history[i].content}\n`;
      const msgTokens = estimateTokens(msg);
      // 我们留一半的剩余空间给 RAG 知识
      if (historyTokens + msgTokens > remainingTokens * 0.5) {
        console.log(`   ├─ ⚠️ 历史对话过长，已在此处截断 (仅保留最近 ${history.length - 1 - i} 条)`);
        break;
      }
      historyText = msg + historyText; // 往前拼
      historyTokens += msgTokens;
    }
    remainingTokens -= historyTokens;
    console.log(`   ├─ 历史记录 (裁剪后): 占用 ${historyTokens} Tokens`);

    // 4. 动态裁剪 RAG 知识库
    let finalRagText = "";
    const ragTokens = estimateTokens(ragContext);
    if (ragTokens > remainingTokens) {
      // 简单按照比例截断字符串 (实际应按句子或段落)
      const allowedRatio = remainingTokens / ragTokens;
      finalRagText = ragContext.slice(0, Math.floor(ragContext.length * allowedRatio)) + "...[由于Token限制被截断]";
      console.log(`   ├─ ⚠️ RAG 知识库过大 (${ragTokens} Tokens)，已裁剪至适配剩余空间`);
    } else {
      finalRagText = ragContext;
    }
    const finalRagTokens = estimateTokens(finalRagText);
    remainingTokens -= finalRagTokens;
    console.log(`   ├─ RAG 知识库 (裁剪后): 占用 ${finalRagTokens} Tokens`);

    console.log(`   └─ 组装完毕！总占用: ${this.MAX_TOKENS - remainingTokens} / ${this.MAX_TOKENS} Tokens\n`);

    // 最终组装的巨型 Prompt
    return `
${systemInstructions}

## 外部知识片段：
${finalRagText}

## 对话历史：
${historyText}

## 当前问题：
${userMessage}
    `;
  }
}

// ==========================================
// 4. 运行演示 (交互式 Loop)
// ==========================================
async function runDemo() {
  console.log("============================================");
  console.log("🚀 Mastra 深度解构: Context 上下文管理演示");
  console.log("============================================");
  console.log("该 Demo 会模拟一个极小 Token (500) 的模型环境。");
  console.log("由于预设的 RAG 知识非常长，你可以观察系统是如何**优先保证系统指令和当前提问**，并动态截断历史和 RAG 知识的。");
  console.log("输入任何问题以触发上下文拼装，输入 'exit' 退出\n");

  const manager = new ContextManager();
  const mockHistory = [
    { role: "user", content: "你好" },
    { role: "assistant", content: "你好！有什么我可以帮你的？" },
    { role: "user", content: "你了解 Mastra 吗？" },
    { role: "assistant", content: "Mastra 是一个 AI 框架..." },
  ];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = () => {
    rl.question("👤 User: ", (input) => {
      if (input.toLowerCase() === "exit") {
        rl.close();
        return;
      }
      
      const assembledPrompt = manager.buildPrompt(input, mockHistory);
      
      console.log("================ 最终发送给 LLM 的 Prompt (预览前 200 字) ================");
      console.log(assembledPrompt.slice(0, 200) + "...\n");
      
      // 模拟加入历史记录
      mockHistory.push({ role: "user", content: input });
      mockHistory.push({ role: "assistant", content: "(Mock Reply)" });

      prompt();
    });
  };

  prompt();
}

runDemo();
