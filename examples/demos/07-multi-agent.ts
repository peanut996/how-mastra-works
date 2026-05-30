// ============================================
// Demo 07: 多 Agent 协作 — Agent 作为工具
// ============================================
// 本 Demo 将展示 Supervisor 模式 (主管-下属) 和 Agent-as-Tool 模式。
// 我们将构建三个专注不同领域的模拟子 Agent，并用一个主管 Agent 来调度它们。

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const printHeader = (text: string) => {
  console.log(`\n══════════════════════════════════════════════════`);
  console.log(`🎯 ${text}`);
  console.log(`══════════════════════════════════════════════════\n`);
};

// 基础的 Mock Agent 类
class MockAgent {
  constructor(public name: string, public role: string) {}
  
  async generate(task: string): Promise<string> {
    console.log(`\n      [${this.name}] 🧠 正在思考并执行任务...`);
    await sleep(800);
    
    // 简单的 Mock 逻辑，根据不同的 Agent 角色返回不同的内容
    if (this.name === 'ResearchAgent') {
      return `【研究报告】关于 "${task}"，我发现核心要点如下：1. Mastra 是类型安全的框架；2. 支持 RAG 和 Workflow；3. 设计理念是代码即基础设施。`;
    } 
    if (this.name === 'CoderAgent') {
      return `【代码片段】以下是实现 "${task}" 的示例代码：\n\`\`\`typescript\nconst agent = new Agent({ name: 'Coder' });\nagent.generate('hello');\n\`\`\``;
    }
    if (this.name === 'ReviewerAgent') {
      return `【审查意见】代码结构合理，但建议补充错误处理机制（try-catch）以增强健壮性。`;
    }
    
    return `任务 [${task}] 已完成。`;
  }
}

// === 第一部分：定义子 Agent ===

const researcher = new MockAgent('ResearchAgent', '深度研究和资料收集');
const coder = new MockAgent('CoderAgent', '编写高质量代码');
const reviewer = new MockAgent('ReviewerAgent', '代码审查与安全检查');

// === 第二部分：Agent-as-Tool 包装 ===
// 将 Agent 包装为工具供主管调用

type Tool = {
  id: string;
  description: string;
  execute: (input: string) => Promise<string>;
};

const researchTool: Tool = {
  id: 'research',
  description: '当需要搜集技术背景、文档或进行深度研究时调用。',
  execute: async (input) => await researcher.generate(input)
};

const codeTool: Tool = {
  id: 'write_code',
  description: '当需要编写、实现特定功能的代码时调用。',
  execute: async (input) => await coder.generate(input)
};

const reviewTool: Tool = {
  id: 'review_code',
  description: '当需要对已经写好的代码进行质量和安全审查时调用。',
  execute: async (input) => await reviewer.generate(input)
};

// === 第三部分：Supervisor 主管 Agent ===

class SupervisorAgent {
  private tools: Tool[];
  
  constructor(public name: string, tools: Tool[]) {
    this.tools = tools;
  }

  async processRequest(request: string) {
    console.log(`\n👨‍💼 [${this.name}] 收到最终用户需求: "${request}"`);
    console.log(`──────────────────────────────────────────────────`);

    let finalResponse = '';

    // 简单的主管路由与拆解逻辑 (在真实场景中，这是由 LLM 动态推理完成的)
    if (request.includes('研究') && request.includes('代码')) {
      console.log(`   💡 [${this.name}] 分析需求：这是一个复杂任务，需要研究、编码和审查流水线。`);
      
      // 步骤 1: 研究
      console.log(`   👉 [${this.name}] 调用工具: [research]`);
      const researchData = await this.tools.find(t => t.id === 'research')!.execute(request);
      console.log(`   📥 收到结果:\n${researchData}\n`);

      // 步骤 2: 编码
      console.log(`   👉 [${this.name}] 调用工具: [write_code]`);
      const codeData = await this.tools.find(t => t.id === 'write_code')!.execute(`根据以下研究数据编写代码：${researchData}`);
      console.log(`   📥 收到结果:\n${codeData}\n`);

      // 步骤 3: 审查
      console.log(`   👉 [${this.name}] 调用工具: [review_code]`);
      const reviewData = await this.tools.find(t => t.id === 'review_code')!.execute(codeData);
      console.log(`   📥 收到结果:\n${reviewData}\n`);

      // 最终汇总
      console.log(`   🧠 [${this.name}] 汇总所有下属的成果...`);
      await sleep(500);
      finalResponse = `根据您的需求，我的团队已完成处理：\n\n${researchData}\n\n${codeData}\n\n${reviewData}`;
    
    } else if (request.includes('代码')) {
      console.log(`   💡 [${this.name}] 分析需求：这是一个纯编码任务。`);
      console.log(`   👉 [${this.name}] 调用工具: [write_code]`);
      const codeData = await this.tools.find(t => t.id === 'write_code')!.execute(request);
      finalResponse = `好的，代码已生成：\n${codeData}`;
    } else {
      finalResponse = "抱歉，需求不明确，请指定需要研究还是写代码。";
    }

    console.log(`\n👨‍💼 [${this.name}] 最终交付给用户:`);
    console.log(finalResponse);
  }
}

// === 运行演示 ===

async function runDemo() {
  printHeader('Demo 07: 多智能体协作 (Multi-Agent)');

  const supervisor = new SupervisorAgent('CTO 智能主管', [researchTool, codeTool, reviewTool]);

  console.log(`🎯 场景 1: 复杂需求流转 (主管 -> 研究员 -> 程序员 -> 审查员)`);
  await supervisor.processRequest("帮我研究一下 Mastra 框架并用它写一个基础 Agent 的代码");

  console.log(`\n\n🎯 场景 2: 单一专家路由 (主管 -> 程序员)`);
  await supervisor.processRequest("只帮我写一个基础代码");

  console.log(`\n══════════════════════════════════════════════════`);
  console.log(`✅ 多 Agent 演示完成！`);
  console.log(`
🎯 你学到了：
   ✓ Agent 也可以被包装成普通的 Tool
   ✓ Supervisor 模式：由主管 Agent 分解任务并调用其他 Agent 工具
   ✓ 专业化分工：保持每个子 Agent 的 Prompt 专注，避免幻觉和越界
   ✓ 减少 Token 消耗：写代码的 Agent 不需要看长篇幅的研究过程`);
  console.log(`══════════════════════════════════════════════════\n`);
}

runDemo().catch(console.error);

/*
// === 真实 Mastra 代码示例 ===
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';

const coderAgent = new Agent({ name: 'Coder', model: openai('gpt-4o') });

// 把 Agent 包装为工具
const writeCodeTool = createTool({
  id: 'write-code',
  inputSchema: z.object({ task: z.string() }),
  execute: async ({ context }) => {
    const res = await coderAgent.generate(context.task);
    return res.text;
  }
});

// 主管 Agent 使用工具
const supervisor = new Agent({
  name: 'Supervisor',
  model: openai('gpt-4o'),
  tools: { writeCodeTool }
});
*/
