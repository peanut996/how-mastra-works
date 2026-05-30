// ============================================
// Demo 08: 模型上下文协议 (MCP) 演示
// ============================================
// 本 Demo 展示了 MCP (Model Context Protocol) 客户端与服务器的交互概念。
// 我们将模拟一个 MCP Server 暴露工具，以及 Mastra Agent 作为 Client 接入。

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const printHeader = (text: string) => {
  console.log(`\n══════════════════════════════════════════════════`);
  console.log(`🎯 ${text}`);
  console.log(`══════════════════════════════════════════════════\n`);
};

// === 第一部分：模拟 MCP Server ===
// 这是一个独立的外部服务，比如 Github MCP 或本地文件系统 MCP

class MockMcpServer {
  public serverInfo = {
    name: 'MockWeatherMcp',
    version: '1.0.0'
  };

  // 服务器暴露的可用工具列表
  public availableTools = [
    {
      id: 'mcp_weather_get',
      description: '【来自MCP】获取指定城市的实时天气',
      inputSchema: { city: 'string' }
    },
    {
      id: 'mcp_weather_forecast',
      description: '【来自MCP】获取未来3天天气预报',
      inputSchema: { city: 'string' }
    }
  ];

  // 服务器执行工具的具体逻辑 (通过 JSON-RPC 调用)
  async callTool(toolId: string, args: any): Promise<string> {
    console.log(`      ☁️ [MCP Server 内部] 正在处理工具调用请求: ${toolId}...`);
    await sleep(600);
    
    if (toolId === 'mcp_weather_get') {
      return `【MCP返回】${args.city} 的实时天气：晴朗，26度。`;
    }
    if (toolId === 'mcp_weather_forecast') {
      return `【MCP返回】${args.city} 未来三天：明天多云，后天大雨，大后天转晴。`;
    }
    throw new Error(`未知的工具: ${toolId}`);
  }
}

// === 第二部分：模拟 Mastra MCP Client ===
// Mastra 用来连接上述服务器的客户端

class MockMcpClient {
  public connected: boolean = false;
  private server: MockMcpServer;

  constructor(server: MockMcpServer) {
    this.server = server;
  }

  async connect() {
    console.log(`   🔌 [MCP Client] 正在连接 MCP 服务器...`);
    await sleep(500);
    this.connected = true;
    console.log(`   ✅ [MCP Client] 成功连接至 [${this.server.serverInfo.name}] v${this.server.serverInfo.version}`);
  }

  // 客户端向服务器发现工具
  async discoverTools() {
    if (!this.connected) throw new Error("MCP 未连接");
    console.log(`   🔍 [MCP Client] 请求可用工具列表...`);
    await sleep(300);
    return this.server.availableTools;
  }

  // 客户端转发执行请求给服务器
  async executeTool(toolId: string, args: any) {
    if (!this.connected) throw new Error("MCP 未连接");
    console.log(`   📤 [MCP Client] 向服务器发送 RPC 执行请求: ${toolId}(${JSON.stringify(args)})`);
    return await this.server.callTool(toolId, args);
  }
}

// === 第三部分：集成到 Mastra Agent ===

class McpEnabledAgent {
  private mcpClient: MockMcpClient;
  private registeredTools: any[] = [];

  constructor(public name: string, mcpClient: MockMcpClient) {
    this.mcpClient = mcpClient;
  }

  async initialize() {
    console.log(`\n🚀 [Agent 初始化] 正在挂载 MCP 能力...`);
    // 1. 连接 MCP 服务器
    await this.mcpClient.connect();
    
    // 2. 自动发现并注册服务器上的工具
    this.registeredTools = await this.mcpClient.discoverTools();
    
    console.log(`   ✨ [Agent 初始化] 成功挂载 ${this.registeredTools.length} 个 MCP 工具！`);
    this.registeredTools.forEach(t => console.log(`      - ${t.id}: ${t.description}`));
  }

  async generate(prompt: string) {
    console.log(`\n📨 用户输入: "${prompt}"`);
    console.log(`──────────────────────────────────────────────────`);
    console.log(`   🧠 [${this.name}] 正在思考...`);
    await sleep(800);

    // 简单的 Mock 意图识别
    if (prompt.includes('北京') && prompt.includes('预报')) {
      console.log(`   💡 [${this.name}] 决定调用 MCP 工具 [mcp_weather_forecast]`);
      const result = await this.mcpClient.executeTool('mcp_weather_forecast', { city: '北京' });
      
      console.log(`   📥 收到 MCP 结果，构建最终回复...\n`);
      await sleep(500);
      console.log(`🤖 Agent 回复:\n我通过气象服务器查询到了结果：\n${result}`);
    } 
    else if (prompt.includes('上海') && prompt.includes('现在')) {
      console.log(`   💡 [${this.name}] 决定调用 MCP 工具 [mcp_weather_get]`);
      const result = await this.mcpClient.executeTool('mcp_weather_get', { city: '上海' });
      
      console.log(`   📥 收到 MCP 结果，构建最终回复...\n`);
      await sleep(500);
      console.log(`🤖 Agent 回复:\n我通过气象服务器查询到了结果：\n${result}`);
    } 
    else {
      console.log(`🤖 Agent 回复:\n你好，我是支持 MCP 的 Agent，我可以帮你查询天气情况！`);
    }
  }
}

// === 运行演示 ===

async function runDemo() {
  printHeader('Demo 08: 模型上下文协议 (MCP)');

  console.log(`📖 说明：MCP 是一个大一统的通信协议。有了它，Agent 可以瞬间接管\nGithub、Notion、本地文件等外部系统的能力，而不需要你写任何集成代码。\n`);

  // 1. 初始化独立的 MCP 服务器和 Mastra 客户端
  const weatherMcpServer = new MockMcpServer();
  const mcpClient = new MockMcpClient(weatherMcpServer);

  // 2. 将 Client 挂载给 Agent
  const agent = new McpEnabledAgent('万能助手', mcpClient);
  
  // 初始化（自动发现工具）
  await agent.initialize();

  // 3. 对话测试
  await agent.generate("上海现在的天气怎么样？");
  await agent.generate("给我看看北京未来三天的预报。");

  console.log(`\n══════════════════════════════════════════════════`);
  console.log(`✅ MCP 演示完成！`);
  console.log(`
🎯 你学到了：
   ✓ MCP Client-Server 架构：标准化 AI 与外部世界的通信
   ✓ 自动工具发现：挂载 Client 后，Server 上的工具会自动暴露给 Agent
   ✓ 生态打通：Mastra Agent 可以直接使用海量的开源 MCP 服务器
   ✓ 反向暴露：你也可以用 Mastra 写一个 McpServer 提供给其他 AI 使用`);
  console.log(`══════════════════════════════════════════════════\n`);
}

runDemo().catch(console.error);

/*
// === 真实 Mastra 代码示例 ===
import { Agent } from '@mastra/core/agent';
import { McpClient } from '@mastra/mcp';

// 1. 初始化客户端（指向一个外部 npm 包或可执行文件）
const weatherClient = new McpClient({
  server: {
    command: 'npx',
    args: ['-y', '@weather-mcp/server']
  }
});
await weatherClient.connect();

// 2. 挂载到 Agent (所有天气工具都会自动注册)
const agent = new Agent({
  name: 'McpAgent',
  model: openai('gpt-4o'),
  mcpClients: {
    weather: weatherClient
  }
});

// await agent.generate("纽约天气如何？");
*/
