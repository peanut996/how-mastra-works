// ============================================
// Demo 04: 记忆系统 — 让 Agent 拥有记忆
// ============================================
// 本 Demo 将展示 Mastra 的多层记忆架构。
// 我们将手动实现简化的记忆层，帮助你理解底层的运作机制。

import * as readline from 'readline';

// 模拟控制台工具函数
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const printHeader = (text: string) => {
  console.log(`\n══════════════════════════════════════════════════`);
  console.log(`🎯 ${text}`);
  console.log(`══════════════════════════════════════════════════\n`);
};

// === 第一部分：对话历史 (Conversation History) ===
// 短期记忆，只保留最近的 N 条对话

type Message = { role: 'user' | 'agent' | 'system'; content: string; timestamp: number };

class ConversationHistory {
  private threads: Map<string, Message[]> = new Map();
  private maxMessages: number;

  constructor(maxMessages: number = 10) {
    this.maxMessages = maxMessages;
  }

  addMessage(threadId: string, role: Message['role'], content: string) {
    if (!this.threads.has(threadId)) {
      this.threads.set(threadId, []);
    }
    const thread = this.threads.get(threadId)!;
    thread.push({ role, content, timestamp: Date.now() });

    // 维持上下文窗口大小，防止 Token 爆炸
    if (thread.length > this.maxMessages) {
      thread.shift(); 
    }
  }

  getMessages(threadId: string): Message[] {
    return this.threads.get(threadId) || [];
  }
}

// === 第二部分：工作记忆 (Working Memory) ===
// 长期明确记忆，类似于存储用户偏好的 KV 数据库

class WorkingMemory {
  private facts: Map<string, string> = new Map();

  set(key: string, value: string) {
    this.facts.set(key, value);
    console.log(`   📝 [工作记忆更新] 记住了一件事: ${key} = ${value}`);
  }

  get(key: string): string | undefined {
    return this.facts.get(key);
  }

  toMarkdown(): string {
    if (this.facts.size === 0) return '';
    let md = '### 已知的用户事实\n';
    for (const [key, value] of this.facts.entries()) {
      md += `- ${key}: ${value}\n`;
    }
    return md;
  }
}

// === 第三部分：语义记忆 (Semantic Recall) ===
// 长期模糊记忆，将文本转为向量存储，通过相似度检索

// 简单的 Mock 嵌入函数：基于关键词命中率计算向量
const mockEmbed = (text: string): number[] => {
  const vocab = ['mastra', 'agent', 'tool', 'workflow', 'ai', 'typescript', '记忆', '代码', '问题'];
  return vocab.map(word => text.toLowerCase().includes(word) ? 1 : 0);
};

// 计算余弦相似度
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

class SemanticMemory {
  private memories: Array<{ text: string, vector: number[], timestamp: number }> = [];

  store(text: string) {
    const vector = mockEmbed(text);
    this.memories.push({ text, vector, timestamp: Date.now() });
    console.log(`   🧠 [语义记忆存储] 存档片段: "${text.substring(0, 15)}..."`);
  }

  search(query: string, topK: number = 2): string[] {
    const queryVector = mockEmbed(query);
    
    // 如果查询没有命中任何词汇，返回空
    if (queryVector.every(v => v === 0)) return [];

    const scored = this.memories.map(mem => ({
      text: mem.text,
      score: cosineSimilarity(queryVector, mem.vector)
    }));

    // 按相似度降序排序，过滤掉不相关的(score=0)
    return scored
      .filter(m => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(m => m.text);
  }
}

// === 第四部分：四层协作的 MemoryAgent ===

class MemoryAgent {
  name: string;
  history = new ConversationHistory(5); // 为演示，设置很小的上下文窗口
  workingMemory = new WorkingMemory();
  semanticMemory = new SemanticMemory();

  constructor(name: string) {
    this.name = name;
  }

  async generate(userInput: string, threadId: string = 'default'): Promise<string> {
    console.log(`\n📨 用户输入: "${userInput}"`);
    console.log(`──────────────────────────────────────────────────`);

    // 1. 处理输入，判断是否需要更新工作记忆或语义记忆
    this.extractAndStoreMemories(userInput);

    // 2. 构建上下文
    const recentMessages = this.history.getMessages(threadId);
    const factsMarkdown = this.workingMemory.toMarkdown();
    const relevantPast = this.semanticMemory.search(userInput);

    // 3. 打印当前 Agent 的心智状态 (Mental State)
    console.log(`🧠 Agent 构建上下文...`);
    console.log(`   🕒 短期记忆 (对话窗口): 包含 ${recentMessages.length} 条最近消息`);
    if (factsMarkdown) {
      console.log(`   📝 工作记忆 (明确事实): 找到 ${factsMarkdown.split('\n').length - 2} 条记录`);
    }
    if (relevantPast.length > 0) {
      console.log(`   🔍 语义记忆 (历史回顾): 检索到 ${relevantPast.length} 条相关历史`);
    }

    // 4. 模拟 LLM 响应生成
    await sleep(800);
    let response = this.mockLlmResponse(userInput, recentMessages, factsMarkdown, relevantPast);

    // 5. 更新对话历史
    this.history.addMessage(threadId, 'user', userInput);
    this.history.addMessage(threadId, 'agent', response);
    // 定期将对话存入语义记忆
    this.semanticMemory.store(`用户说: ${userInput}。助手回复: ${response}`);

    console.log(`\n🤖 ${this.name} 回复:`);
    console.log(response);
    return response;
  }

  // 模拟从输入中提取事实并存入记忆
  private extractAndStoreMemories(input: string) {
    if (input.includes('我叫')) {
      const nameMatch = input.match(/我叫(.*?)(。|$)/);
      if (nameMatch) this.workingMemory.set('用户姓名', nameMatch[1].trim());
    }
    if (input.includes('我喜欢') || input.includes('我是个')) {
      this.workingMemory.set('用户特征', input);
    }
  }

  // 模拟 LLM 基于上下文的推理
  private mockLlmResponse(input: string, recent: Message[], facts: string, semantic: string[]): string {
    const userName = this.workingMemory.get('用户姓名') || '朋友';

    if (input.includes('我是谁') || input.includes('我的名字')) {
      if (facts.includes('用户姓名')) return `我知道，你叫${userName}对吧？我把它记在我的**工作记忆**里了。`;
      return '抱歉，我还不知道你的名字。';
    }

    if (input.includes('刚才') || input.includes('上一句')) {
      if (recent.length >= 2) return `你刚才说了："${recent[recent.length - 1].content}"。我是从**对话历史**里看出来的。`;
      return '这是我们第一句话呀。';
    }

    if (input.includes('很久以前') || input.includes('之前讨论过')) {
      if (semantic.length > 0) return `是的，根据我的**语义检索**，我们曾聊过这个："${semantic[0]}"`;
      return '我的语义记忆里没有找到相关记录。';
    }

    if (input.includes('Mastra') || input.includes('Agent')) {
      return `Mastra 是一个非常棒的 Agent 框架！你好，${userName}，我们来聊聊代码吧。`;
    }

    return `你好，${userName}！我收到了你的消息。我现在有 ${recent.length} 条短期对话上下文。`;
  }
}

// === 运行演示 ===

async function runDemo() {
  printHeader('Demo 04: 记忆系统');
  
  const agent = new MemoryAgent('记忆专家');
  const threadA = 'thread-home';
  const threadB = 'thread-work';

  console.log(`📖 说明：我们将通过多轮对话展示不同层级的记忆。`);

  // 1. 建立工作记忆
  await agent.generate('你好，我叫李华，我是个前端工程师。', threadA);

  // 2. 短期记忆 (Conversation History) 测试
  await agent.generate('你觉得 TypeScript 怎么样？', threadA);
  await agent.generate('我上一句话问了你什么？', threadA);

  // 3. 线程隔离测试
  console.log(`\n🔄 [切换对话线程] 切换到工作线程 (thread-work)`);
  await agent.generate('我是谁？', threadB); 
  // 预期：知道是李华（工作记忆跨线程共享），但不知道刚才聊了 TypeScript（短期记忆隔离）

  // 4. 短期记忆遗忘机制（滑动窗口）
  console.log(`\n🔄 [切换对话线程] 切换回主线程 (thread-home)`);
  await agent.generate('刷一条消息1', threadA);
  await agent.generate('刷一条消息2', threadA);
  await agent.generate('刷一条消息3', threadA);
  await agent.generate('刷一条消息4', threadA);
  console.log(`\n🚨 注意：此时最早的消息（关于 TypeScript）应该已经被挤出短期记忆窗口了。`);

  // 5. 语义记忆 (Semantic Recall) 测试
  await agent.generate('很久以前，我们是不是讨论过 TypeScript 相关的问题？', threadA);
  // 预期：虽然不在短期历史里，但语义检索能把它找出来

  console.log(`\n══════════════════════════════════════════════════`);
  console.log(`✅ 记忆系统演示完成！`);
  console.log(`
🎯 你学到了：
   ✓ 短期记忆：基于滑动窗口的对话上下文（Thread隔离）
   ✓ 工作记忆：结构化的长期事实存储（跨Session共享）
   ✓ 语义记忆：通过向量相似度从历史中捞取相关片段
   ✓ 组合使用：四层记忆协作，解决 Token 限制，打造智能 Agent`);
  console.log(`══════════════════════════════════════════════════\n`);
}

runDemo().catch(console.error);

/* 
// === 第五部分：使用 Mastra（真实代码示例） ===
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { PgStorage } from '@mastra/pg-storage';

const memory = new Memory({
  storage: new PgStorage({ connectionString: process.env.DATABASE_URL }),
  options: {
    lastMessages: 20,         // 短期记忆
    semanticRecall: { topK: 5 }, // 语义记忆
    workingMemory: { enabled: true }, // 工作记忆
  },
});

const myAgent = new Agent({
  name: 'MastraAgent',
  instructions: '...',
  model: openai('gpt-4o'),
  memory,
});
// await myAgent.generate('你好', { threadId: 'thread-1' });
*/
