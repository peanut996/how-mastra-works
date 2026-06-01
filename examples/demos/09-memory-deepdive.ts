// ============================================
// Demo 09: 记忆深度解构 — Observer/Reflector 模式
// ============================================
// 本 Demo 揭示生产级别的记忆系统是如何运作的。
// 大模型的 Token 是昂贵且有限的，不能无限制地把历史记录塞进 Prompt。
// 解决方案：使用一个后台的 Observer Agent，定期将长篇的闲聊压缩、提炼成关键事实（User Preferences / Facts），
// 并动态更新到“工作记忆”中，实现实体抽取与状态冲突合并。

import { z } from "zod";
import * as readline from "readline";

// ==========================================
// 1. 定义 Mock 大模型 (增强版)
// ==========================================
// 为了演示 Observer 的能力，我们这里的 Mock 会返回结构化的 JSON 数据
async function mockLLMCall(
  messages: { role: string; content: string }[],
  isObserver: boolean = false
): Promise<string> {
  const lastUserMsg =
    messages.filter((m) => m.role === "user").pop()?.content || "";

  if (isObserver) {
    // 模拟 Observer Agent 进行事实提取和状态合并
    // 真实场景下，大模型会阅读传入的历史记录并输出 JSON
    if (lastUserMsg.includes("我喜欢苹果")) {
      return JSON.stringify({
        action: "update",
        factId: "favorite_fruit",
        value: "苹果",
        confidence: 0.9,
      });
    }
    if (lastUserMsg.includes("我现在更喜欢香蕉")) {
      return JSON.stringify({
        action: "update",
        factId: "favorite_fruit",
        value: "香蕉", // 状态合并：覆盖之前的苹果
        confidence: 0.95,
      });
    }
    return JSON.stringify({ action: "none" });
  } else {
    // 主 Agent 的普通回复
    if (lastUserMsg.includes("我喜欢什么")) {
      // 检查系统提示词中是否注入了工作记忆
      const systemPrompt = messages.find((m) => m.role === "system")?.content || "";
      if (systemPrompt.includes("香蕉")) {
        return "你最喜欢的水果是香蕉！🍌";
      } else if (systemPrompt.includes("苹果")) {
        return "你最喜欢的水果是苹果！🍎";
      }
      return "我还不知道你喜欢什么，愿意告诉我吗？";
    }
    if (lastUserMsg.includes("我喜欢")) {
      return "好的，我已经记下了你的喜好！(后台正在触发 Observer 压缩记忆...)";
    }
    return "你好！我是支持动态记忆更新的 Agent。";
  }
}

// ==========================================
// 2. 核心架构：工作记忆库 (Working Memory)
// ==========================================
// 存储从对话中提炼出的结构化事实
class WorkingMemoryStore {
  private facts: Map<string, any> = new Map();

  updateFact(factId: string, value: any) {
    const oldVal = this.facts.get(factId);
    this.facts.set(factId, value);
    if (oldVal && oldVal !== value) {
      console.log(`\n🧠 [Working Memory] 状态更新冲突解决: [${factId}]由 "${oldVal}" -> "${value}"`);
    } else {
      console.log(`\n🧠 [Working Memory] 新增事实: [${factId}] = "${value}"`);
    }
  }

  getFact(factId: string) {
    return this.facts.get(factId);
  }

  getAllFactsAsString(): string {
    if (this.facts.size === 0) return "暂无事实";
    return Array.from(this.facts.entries())
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n");
  }
}

// ==========================================
// 3. Observer Agent (观察者)
// ==========================================
// 专门负责在后台阅读主 Agent 的对话记录，并提取更新工作记忆
class ObserverAgent {
  constructor(private store: WorkingMemoryStore) {}

  async processHistory(history: { role: string; content: string }[]) {
    console.log(`\n🕵️‍♂️ [Observer] 开始在后台扫描最近的 ${history.length} 条对话记录...`);
    
    // 构造发给 Observer 的 Prompt
    const observerPrompt = [
      {
        role: "system",
        content: `你是一个记忆提取专家。阅读对话历史，提取用户的偏好或事实。
        请输出 JSON，格式：{ action: "update"|"none", factId: string, value: any, confidence: number }
        如果用户改变了偏好（例如以前喜欢A现在喜欢B），请使用相同的 factId 并输出新 value 以覆盖旧值。`
      },
      ...history
    ];

    // 调用 LLM (这里用 Mock)
    const resultStr = await mockLLMCall(observerPrompt, true);
    
    try {
      const result = JSON.parse(resultStr);
      if (result.action === "update") {
        this.store.updateFact(result.factId, result.value);
      } else {
        console.log(`🕵️‍♂️ [Observer] 扫描完毕，没有发现新的事实。`);
      }
    } catch (e) {
      console.log(`🕵️‍♂️ [Observer] 提取失败，解析错误。`);
    }
  }
}

// ==========================================
// 4. Main Agent (主智能体)
// ==========================================
class MainAgent {
  private history: { role: string; content: string }[] = [];
  
  constructor(
    private store: WorkingMemoryStore,
    private observer: ObserverAgent
  ) {}

  async chat(userMessage: string) {
    this.history.push({ role: "user", content: userMessage });

    // 每次对话前，从 Working Memory 中拉取最新事实，注入 System Prompt
    const facts = this.store.getAllFactsAsString();
    const systemPrompt = `你是用户的贴心助手。你拥有以下关于用户的背景知识(Working Memory)：\n${facts}`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...this.history.slice(-5) // 保持对话历史不过长 (滑动窗口机制)
    ];

    // 1. 调用主 LLM 生成回复
    const response = await mockLLMCall(messages, false);
    this.history.push({ role: "assistant", content: response });
    console.log(`\n🤖 Agent: ${response}\n`);

    // 2. [异步触发] 让 Observer 在后台扫描刚刚的对话
    // 在真实应用中，这通常放入消息队列或异步 Task 中，不阻塞主流程响应时间
    await this.observer.processHistory(this.history.slice(-2));
  }
}

// ==========================================
// 5. 运行演示 (交互式 Loop)
// ==========================================
async function runDemo() {
  console.log("============================================");
  console.log("🚀 Mastra 深度解构: Observer 记忆模式演示");
  console.log("============================================");
  console.log("💡 提示: 尝试输入 '我喜欢苹果'，然后问它 '我喜欢什么'，");
  console.log("💡 然后输入 '我现在更喜欢香蕉'，再问一次！");
  console.log("输入 'exit' 退出\n");

  const store = new WorkingMemoryStore();
  const observer = new ObserverAgent(store);
  const agent = new MainAgent(store, observer);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = () => {
    rl.question("👤 User: ", async (input) => {
      if (input.toLowerCase() === "exit") {
        rl.close();
        return;
      }
      
      await agent.chat(input);
      prompt();
    });
  };

  prompt();
}

runDemo();
