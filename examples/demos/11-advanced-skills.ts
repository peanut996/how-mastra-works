// ============================================
// Demo 11: 高级技能与工具编排 — 错误拦截与自我修复
// ============================================
// 现实中的 API 调用充满了失败：参数格式错误、服务超时、权限拒绝。
// 初级 Agent 遇到工具报错会直接抛出异常导致进程崩溃。
// 高阶 Agent (Self-Correction) 的做法是：拦截工具抛出的 Error，将错误信息组装成新的消息发送回给 LLM，
// 告诉它“你刚才调用的工具失败了，原因是 XXX，请修改参数后重试”。

import * as readline from "readline";

// ==========================================
// 1. 定义高阶的自我修复 Mock LLM
// ==========================================
// 模拟一个大模型，它一开始会故意给出错误的参数，在被报错提示后，能修正参数。
async function mockLLMWithSelfCorrection(messages: any[]): Promise<any> {
  const lastMsg = messages[messages.length - 1];

  // 场景：如果用户要查天气，第一次我们故意传入非法城市代码
  if (lastMsg.role === "user" && lastMsg.content.includes("北京的天气")) {
    return {
      type: "tool_call",
      toolName: "getWeather",
      // 故意写错参数 (城市拼音写错或者格式不匹配)
      arguments: { city_code: "PEK-error" } 
    };
  }

  // 场景：当 LLM 收到了报错信息
  if (lastMsg.role === "tool" && lastMsg.error === true) {
    console.log(`\n🧠 [LLM 内部思考] 发现刚刚的调用报错了，我来看看报错信息...`);
    console.log(`🧠 [LLM 内部思考] 哦，原来格式必须是全小写的拼音，我重试一次！`);
    
    // 自我修正参数再次尝试
    return {
      type: "tool_call",
      toolName: "getWeather",
      arguments: { city_code: "beijing" } // 修正后的正确参数
    };
  }

  // 如果工具执行成功
  if (lastMsg.role === "tool" && lastMsg.error === false) {
    return {
      type: "text",
      content: `根据最新数据，北京的天气是：${lastMsg.content}。`
    };
  }

  return { type: "text", content: "你好，我是具有自我纠错能力的智能体。" };
}

// ==========================================
// 2. 模拟一个脆弱的 API 工具
// ==========================================
async function getWeatherTool(args: any) {
  const { city_code } = args;
  
  // 模拟 API 的严苛校验
  if (city_code !== "beijing") {
    // 抛出带有明确指导意义的错误信息
    throw new Error(`Invalid city_code '${city_code}'. API expects lowercase pinyin, e.g., 'beijing' for Beijing.`);
  }

  return "晴，气温 25℃";
}

// ==========================================
// 3. 高阶 Agent 执行引擎 (包含错误拦截与重试逻辑)
// ==========================================
class RobustAgent {
  private messages: any[] = [];
  private readonly MAX_RETRIES = 3; // 最大重试次数，防止死循环

  async run(userInput: string) {
    this.messages.push({ role: "user", content: userInput });
    
    let isFinished = false;
    let retryCount = 0;

    while (!isFinished) {
      console.log("\n🔄 正在请求大模型推理...");
      const response = await mockLLMWithSelfCorrection(this.messages);

      if (response.type === "text") {
        // 模型输出了最终文本，结束循环
        this.messages.push({ role: "assistant", content: response.content });
        console.log(`\n🤖 Agent: ${response.content}\n`);
        isFinished = true;
      } 
      else if (response.type === "tool_call") {
        // 模型决定调用工具
        console.log(`\n🛠️  [工具执行] LLM 请求调用工具: ${response.toolName}`);
        console.log(`   ├─ 传入参数: ${JSON.stringify(response.arguments)}`);
        
        this.messages.push({ role: "assistant", tool_calls: [response] });

        try {
          // 尝试执行工具
          if (response.toolName === "getWeather") {
            const result = await getWeatherTool(response.arguments);
            console.log(`   └─ ✅ 执行成功! 返回结果: ${result}`);
            
            // 将成功的工具结果喂给 LLM
            this.messages.push({ 
              role: "tool", 
              name: response.toolName, 
              content: result,
              error: false
            });
          }
        } catch (error: any) {
          // ⚠️ 核心逻辑：拦截错误并反馈给 LLM，而不是抛出异常！
          console.log(`   └─ ❌ 执行失败! 捕获到异常: ${error.message}`);
          
          retryCount++;
          if (retryCount >= this.MAX_RETRIES) {
            console.log(`\n🚨 重试次数过多 (${this.MAX_RETRIES})，强行终止。`);
            console.log(`🤖 Agent: 抱歉，我在尝试获取数据时反复遇到错误，无法完成任务。`);
            isFinished = true;
            break;
          }

          console.log(`   └─ 🚑 正在将错误信息反馈回 LLM，触发自我修复 (尝试 ${retryCount}/${this.MAX_RETRIES})...`);
          
          // 将具体的错误信息作为 tool 返回体扔给大模型
          this.messages.push({
            role: "tool",
            name: response.toolName,
            content: `Error executing tool: ${error.message}`,
            error: true // 这是一个标记，方便我们在 mock 中识别
          });
        }
      }
    }
  }
}

// ==========================================
// 4. 运行演示
// ==========================================
async function runDemo() {
  console.log("============================================");
  console.log("🚀 Mastra 深度解构: 工具自我修复演示 (Self-Correction)");
  console.log("============================================");
  console.log("在这个示例中，大模型会因为幻觉而传入错误的城市代码。");
  console.log("观察系统如何拦截工具抛出的 Error，并将其转换成 Prompt 喂给 LLM，");
  console.log("促使 LLM 自己读懂报错信息并修正参数重新调用。");
  console.log("输入 '查一下北京的天气' 来触发该流程，输入 'exit' 退出\n");

  const agent = new RobustAgent();
  
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
      
      await agent.run(input);
      prompt();
    });
  };

  prompt();
}

runDemo();
