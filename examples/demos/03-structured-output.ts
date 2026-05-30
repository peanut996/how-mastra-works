// ============================================
// Demo 03: 结构化输出 — 类型安全的 LLM 响应
// ============================================
// 本 Demo 展示如何让 LLM 返回结构化的、类型安全的数据，
// 而不仅仅是自由文本。
//
// 运行方式：npx tsx examples/demos/03-structured-output.ts
//
// 🎯 学习目标：
//   1. 理解为什么需要结构化输出
//   2. 使用 Zod Schema 定义输出结构
//   3. 验证 LLM 输出并处理错误
//   4. 掌握从简单到复杂的结构化场景

import { z } from "zod";

// ============================================
// === 第一部分：定义输出 Schema ===
// ============================================
// 结构化输出的核心思想：
// 不再让 LLM 返回"随意的文本"，而是要求它返回"特定格式的 JSON"。
// 使用 Zod Schema 来精确定义我们期望的数据结构。

console.log("╔════════════════════════════════════════════════╗");
console.log("║  Demo 03: 结构化输出 — 类型安全的 LLM 响应      ║");
console.log("╚════════════════════════════════════════════════╝\n");

console.log("📖 为什么需要结构化输出？");
console.log("   普通 LLM 回复：'这个人叫张三，今年 28 岁，是一名工程师。'");
console.log("   结构化输出：  { name: '张三', age: 28, occupation: '工程师' }");
console.log("   → 结构化数据可以直接在代码中使用，无需解析自由文本！\n");

// --- Schema 1: 简单 — 人物信息提取 ---
const PersonSchema = z.object({
  name: z.string().describe("姓名"),
  age: z.number().min(0).max(150).describe("年龄"),
  occupation: z.string().describe("职业"),
  skills: z.array(z.string()).describe("技能列表"),
  isEmployed: z.boolean().describe("是否在职"),
});
type Person = z.infer<typeof PersonSchema>;

// --- Schema 2: 中等 — 任务列表 ---
const TaskSchema = z.object({
  id: z.string().describe("任务唯一标识"),
  title: z.string().describe("任务标题"),
  priority: z.enum(["high", "medium", "low"]).describe("优先级"),
  estimatedHours: z.number().min(0).describe("预计耗时（小时）"),
  tags: z.array(z.string()).describe("标签"),
});

const TaskListSchema = z.object({
  projectName: z.string().describe("项目名称"),
  totalTasks: z.number().describe("任务总数"),
  tasks: z.array(TaskSchema).describe("任务列表"),
  summary: z.string().describe("项目摘要"),
});
type TaskList = z.infer<typeof TaskListSchema>;

// --- Schema 3: 复杂 — 旅行计划（嵌套结构）---
const ActivitySchema = z.object({
  time: z.string().describe("活动时间（如 '09:00'）"),
  activity: z.string().describe("活动内容"),
  location: z.string().describe("地点"),
  duration: z.string().describe("持续时间"),
  cost: z.number().describe("预估费用（元）"),
  tips: z.string().optional().describe("小贴士"),
});

const DayPlanSchema = z.object({
  day: z.number().describe("第几天"),
  date: z.string().describe("日期"),
  theme: z.string().describe("当天主题"),
  activities: z.array(ActivitySchema).describe("活动列表"),
  meals: z.object({
    breakfast: z.string().describe("早餐推荐"),
    lunch: z.string().describe("午餐推荐"),
    dinner: z.string().describe("晚餐推荐"),
  }),
  dailyBudget: z.number().describe("当日预算（元）"),
});

const TravelPlanSchema = z.object({
  destination: z.string().describe("目的地"),
  duration: z.number().describe("旅行天数"),
  totalBudget: z.number().describe("总预算（元）"),
  travelStyle: z.enum(["budget", "comfort", "luxury"]).describe("旅行风格"),
  days: z.array(DayPlanSchema).describe("每日计划"),
  packingList: z.array(z.string()).describe("行李清单"),
  emergencyContacts: z.object({
    police: z.string().describe("报警电话"),
    hospital: z.string().describe("急救电话"),
    embassy: z.string().optional().describe("大使馆电话"),
  }),
});
type TravelPlan = z.infer<typeof TravelPlanSchema>;

console.log("📦 已定义 3 个输出 Schema：");
console.log("   1️⃣  PersonSchema    — 简单结构（人物信息）");
console.log("   2️⃣  TaskListSchema  — 中等结构（任务列表）");
console.log("   3️⃣  TravelPlanSchema — 复杂嵌套结构（旅行计划）");

// ============================================
// === 第二部分：构建 StructuredAgent ===
// ============================================
// StructuredAgent 的核心区别：
// - 它接收一个 Zod Schema 作为输出约束
// - 模拟 LLM 返回匹配 Schema 的 JSON
// - 使用 Zod .parse() 验证输出
// - 返回类型安全的结果

/** 模拟的 LLM 响应（返回 JSON） */
interface StructuredLLMResponse<T> {
  data: T;
  raw: string; // 原始 JSON 字符串
  validated: boolean;
}

class StructuredAgent {
  private name: string;

  constructor(name: string) {
    this.name = name;
    console.log(`\n🤖 StructuredAgent "${name}" 已创建`);
  }

  /**
   * 生成结构化输出
   *
   * 真实流程：
   * 1. 将 Zod Schema 转化为 JSON Schema，放入 system prompt
   * 2. LLM 被要求返回符合 Schema 的 JSON
   * 3. 解析并验证 LLM 返回的 JSON
   * 4. 返回类型安全的数据
   *
   * @param prompt 用户提示
   * @param schema Zod Schema — 定义期望的输出结构
   * @returns 类型安全的结构化数据
   */
  async generate<T>(
    prompt: string,
    schema: z.ZodType<T>
  ): Promise<StructuredLLMResponse<T>> {
    console.log(`\n   📨 Prompt: "${prompt}"`);
    console.log(`   📐 输出约束: ${this.schemaToDescription(schema)}`);

    // 模拟 LLM 调用延迟
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 300 + 200)
    );

    // 步骤 1：模拟 LLM 生成 JSON（真实场景中这是 LLM API 调用）
    console.log("   🧠 LLM 生成 JSON 中...");
    const mockJson = this.generateMockResponse(prompt, schema);
    console.log(`   📄 原始 JSON: ${mockJson.substring(0, 100)}...`);

    // 步骤 2：解析 JSON
    let parsed: any;
    try {
      parsed = JSON.parse(mockJson);
    } catch {
      throw new Error(`LLM 返回的不是有效的 JSON: ${mockJson}`);
    }

    // 步骤 3：使用 Zod 验证
    console.log("   ✅ Zod Schema 验证中...");
    const validated = schema.parse(parsed);

    return {
      data: validated,
      raw: mockJson,
      validated: true,
    };
  }

  /**
   * 模拟 LLM 根据 Schema 生成 JSON
   * 在真实场景中，LLM 会接收 Schema 的 JSON Schema 表示，
   * 并生成匹配的 JSON 输出
   */
  private generateMockResponse<T>(
    prompt: string,
    schema: z.ZodType<T>
  ): string {
    const promptLower = prompt.toLowerCase();

    // 根据 Schema 类型和 prompt 内容返回不同的 mock 数据
    if (this.isSchemaType(schema, PersonSchema)) {
      return JSON.stringify({
        name: promptLower.includes("张三") ? "张三" : "李四",
        age: 28,
        occupation: "全栈工程师",
        skills: ["TypeScript", "React", "Node.js", "Python", "Docker"],
        isEmployed: true,
      });
    }

    if (this.isSchemaType(schema, TaskListSchema)) {
      return JSON.stringify({
        projectName: "Mastra 学习计划",
        totalTasks: 4,
        tasks: [
          {
            id: "task-001",
            title: "学习 Agent 基础概念",
            priority: "high",
            estimatedHours: 2,
            tags: ["学习", "Agent"],
          },
          {
            id: "task-002",
            title: "实践 Tool 调用",
            priority: "high",
            estimatedHours: 3,
            tags: ["实践", "Tool"],
          },
          {
            id: "task-003",
            title: "掌握结构化输出",
            priority: "medium",
            estimatedHours: 2,
            tags: ["学习", "Schema"],
          },
          {
            id: "task-004",
            title: "构建完整项目",
            priority: "low",
            estimatedHours: 8,
            tags: ["项目", "综合"],
          },
        ],
        summary:
          "一个为期两周的 Mastra 学习计划，从基础到实战，共 4 个核心任务。",
      });
    }

    if (this.isSchemaType(schema, TravelPlanSchema)) {
      return JSON.stringify({
        destination: "杭州",
        duration: 3,
        totalBudget: 5000,
        travelStyle: "comfort",
        days: [
          {
            day: 1,
            date: "2025-04-01",
            theme: "西湖风光",
            activities: [
              {
                time: "09:00",
                activity: "环西湖骑行",
                location: "西湖景区",
                duration: "3小时",
                cost: 50,
                tips: "建议早起避开人流高峰",
              },
              {
                time: "13:00",
                activity: "参观灵隐寺",
                location: "灵隐寺",
                duration: "2小时",
                cost: 75,
                tips: "记得买飞来峰的联票更划算",
              },
              {
                time: "16:00",
                activity: "龙井茶园漫步",
                location: "龙井村",
                duration: "2小时",
                cost: 0,
                tips: "可以在茶农家品尝新茶",
              },
            ],
            meals: {
              breakfast: "知味观 — 杭州特色早点（小笼包、片儿川）",
              lunch: "楼外楼 — 西湖醋鱼、东坡肉",
              dinner: "外婆家 — 地道杭帮菜",
            },
            dailyBudget: 1500,
          },
          {
            day: 2,
            date: "2025-04-02",
            theme: "文化探索",
            activities: [
              {
                time: "09:30",
                activity: "参观中国丝绸博物馆",
                location: "玉皇山路",
                duration: "2小时",
                cost: 0,
                tips: "免费参观，可预约讲解",
              },
              {
                time: "13:00",
                activity: "河坊街 & 南宋御街",
                location: "上城区",
                duration: "3小时",
                cost: 200,
                tips: "各种小吃和手工艺品",
              },
              {
                time: "17:00",
                activity: "西湖音乐喷泉",
                location: "湖滨路",
                duration: "1小时",
                cost: 0,
              },
            ],
            meals: {
              breakfast: "酒店自助早餐",
              lunch: "河坊街小吃（定胜糕、龙须糖、葱包桧）",
              dinner: "新白鹿 — 性价比超高的杭帮菜",
            },
            dailyBudget: 1200,
          },
          {
            day: 3,
            date: "2025-04-03",
            theme: "自然与返程",
            activities: [
              {
                time: "08:00",
                activity: "九溪烟树徒步",
                location: "九溪",
                duration: "2.5小时",
                cost: 0,
                tips: "穿舒适的鞋子，溪水可能会湿鞋",
              },
              {
                time: "11:00",
                activity: "宋城景区",
                location: "之江路",
                duration: "3小时",
                cost: 300,
                tips: "《宋城千古情》演出非常精彩",
              },
            ],
            meals: {
              breakfast: "酒店自助早餐",
              lunch: "宋城内餐饮",
              dinner: "机场/高铁站简餐",
            },
            dailyBudget: 1300,
          },
        ],
        packingList: [
          "舒适步行鞋",
          "防晒霜",
          "雨伞（杭州多雨）",
          "充电宝",
          "身份证",
          "薄外套（早晚温差大）",
          "相机",
        ],
        emergencyContacts: {
          police: "110",
          hospital: "120",
        },
      });
    }

    // 默认：返回一个通用结构
    return JSON.stringify({ message: "默认结构化输出", prompt });
  }

  /** 判断是否匹配特定 Schema（通过引用比较） */
  private isSchemaType(schema: z.ZodType, target: z.ZodType): boolean {
    return schema === target;
  }

  /** 将 Schema 转化为人类可读的描述 */
  private schemaToDescription(schema: z.ZodType): string {
    if (schema === PersonSchema) return "PersonSchema { name, age, occupation, skills, isEmployed }";
    if (schema === TaskListSchema) return "TaskListSchema { projectName, tasks: [...], summary }";
    if (schema === TravelPlanSchema)
      return "TravelPlanSchema { destination, days: [{ activities, meals }], ... }";
    return "Unknown Schema";
  }
}

// ============================================
// === 第三部分：简单结构化输出 ===
// ============================================

async function demoSimpleOutput(agent: StructuredAgent): Promise<void> {
  console.log("\n" + "═".repeat(50));
  console.log("🎯 场景 1: 简单结构化输出 — 提取人物信息");
  console.log("═".repeat(50));
  console.log("\n📖 说明：从非结构化文本中提取结构化的人物数据");
  console.log(
    '   输入: "请提取张三的信息：28岁，全栈工程师，精通多种技术"'
  );

  const result = await agent.generate(
    "请提取张三的信息：28岁，全栈工程师，精通多种技术",
    PersonSchema
  );

  console.log("\n   📊 结构化结果：");
  console.log(`      姓名: ${result.data.name}`);
  console.log(`      年龄: ${result.data.age}`);
  console.log(`      职业: ${result.data.occupation}`);
  console.log(`      技能: ${result.data.skills.join(", ")}`);
  console.log(`      在职: ${result.data.isEmployed ? "是" : "否"}`);
  console.log(`      验证通过: ${result.validated ? "✅" : "❌"}`);

  console.log("\n   💡 关键点：");
  console.log("      • result.data 是完全类型安全的 Person 对象");
  console.log("      • 可以直接通过 result.data.name 访问属性");
  console.log("      • TypeScript 编译器知道所有字段的类型");
}

// ============================================
// === 第四部分：复杂嵌套结构 ===
// ============================================

async function demoComplexOutput(agent: StructuredAgent): Promise<void> {
  // --- 中等复杂度：任务列表 ---
  console.log("\n" + "═".repeat(50));
  console.log("🎯 场景 2: 中等结构 — 生成任务列表");
  console.log("═".repeat(50));

  const taskResult = await agent.generate(
    "请为 Mastra 学习制定一个任务计划",
    TaskListSchema
  );

  console.log("\n   📋 项目: " + taskResult.data.projectName);
  console.log("   📊 任务总数: " + taskResult.data.totalTasks);
  console.log("   📝 摘要: " + taskResult.data.summary);
  console.log("\n   任务列表：");

  for (const task of taskResult.data.tasks) {
    const priorityEmoji = {
      high: "🔴",
      medium: "🟡",
      low: "🟢",
    }[task.priority];

    console.log(
      `      ${priorityEmoji} [${task.id}] ${task.title} (${task.estimatedHours}h) — ${task.tags.join(", ")}`
    );
  }

  // --- 高复杂度：旅行计划 ---
  console.log("\n" + "═".repeat(50));
  console.log("🎯 场景 3: 复杂嵌套结构 — 生成旅行计划");
  console.log("═".repeat(50));
  console.log("📖 说明：展示多层嵌套结构 — 旅行计划 → 每日 → 活动 → 详情");

  const travelResult = await agent.generate(
    "请帮我生成一个杭州三日游计划",
    TravelPlanSchema
  );

  const plan = travelResult.data;

  console.log(`\n   🗺️  目的地: ${plan.destination}`);
  console.log(`   📅 天数: ${plan.duration} 天`);
  console.log(`   💰 总预算: ¥${plan.totalBudget}`);
  console.log(
    `   🎨 旅行风格: ${{ budget: "经济", comfort: "舒适", luxury: "豪华" }[plan.travelStyle]}`
  );

  for (const day of plan.days) {
    console.log(`\n   📅 第 ${day.day} 天 (${day.date}) — ${day.theme}`);
    console.log(`   ${"─".repeat(40)}`);

    for (const act of day.activities) {
      console.log(`      🕐 ${act.time} | ${act.activity}`);
      console.log(
        `         📍 ${act.location} | ⏱️ ${act.duration} | 💰 ¥${act.cost}`
      );
      if (act.tips) {
        console.log(`         💡 ${act.tips}`);
      }
    }

    console.log(`\n      🍽️  餐饮推荐：`);
    console.log(`         🌅 早餐: ${day.meals.breakfast}`);
    console.log(`         ☀️  午餐: ${day.meals.lunch}`);
    console.log(`         🌙 晚餐: ${day.meals.dinner}`);
    console.log(`      💰 当日预算: ¥${day.dailyBudget}`);
  }

  console.log("\n   🎒 行李清单:");
  plan.packingList.forEach((item, i) => {
    console.log(`      ${i + 1}. ${item}`);
  });

  console.log("\n   🆘 紧急联系:");
  console.log(`      报警: ${plan.emergencyContacts.police}`);
  console.log(`      急救: ${plan.emergencyContacts.hospital}`);
}

// ============================================
// === 第五部分：Schema 验证与错误处理 ===
// ============================================

async function demoErrorHandling(): Promise<void> {
  console.log("\n" + "═".repeat(50));
  console.log("🎯 场景 4: Schema 验证与错误处理");
  console.log("═".repeat(50));
  console.log("📖 说明：当 LLM 返回的数据不符合 Schema 时会怎样？\n");

  // --- 测试 1：缺少必填字段 ---
  console.log("   📌 测试 1: 缺少必填字段");
  try {
    const invalidData = { name: "张三", age: 28 }; // 缺少 occupation, skills, isEmployed
    PersonSchema.parse(invalidData);
    console.log("   ✅ 验证通过（不应该到这里）");
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log("   ❌ 验证失败！Zod 错误详情：");
      for (const issue of error.issues) {
        console.log(
          `      • 字段: ${issue.path.join(".")} — ${issue.message}`
        );
      }
    }
  }

  // --- 测试 2：类型错误 ---
  console.log("\n   📌 测试 2: 字段类型错误");
  try {
    const invalidData = {
      name: "张三",
      age: "二十八", // 应该是 number，不是 string
      occupation: "工程师",
      skills: "TypeScript", // 应该是 array，不是 string
      isEmployed: "yes", // 应该是 boolean，不是 string
    };
    PersonSchema.parse(invalidData);
    console.log("   ✅ 验证通过（不应该到这里）");
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log("   ❌ 验证失败！Zod 错误详情：");
      for (const issue of error.issues) {
        console.log(
          `      • 字段: ${issue.path.join(".")} — 期望 ${(issue as any).expected ?? issue.code}，收到 ${(issue as any).received ?? "无效值"}`
        );
      }
    }
  }

  // --- 测试 3：值超出范围 ---
  console.log("\n   📌 测试 3: 值超出范围");
  try {
    const invalidData = {
      name: "张三",
      age: 200, // 超出 max(150)
      occupation: "工程师",
      skills: [],
      isEmployed: true,
    };
    PersonSchema.parse(invalidData);
    console.log("   ✅ 验证通过（不应该到这里）");
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log("   ❌ 验证失败！Zod 错误详情：");
      for (const issue of error.issues) {
        console.log(
          `      • 字段: ${issue.path.join(".")} — ${issue.message}`
        );
      }
    }
  }

  // --- 测试 4：使用 safeParse（推荐） ---
  console.log("\n   📌 测试 4: 使用 safeParse（不抛异常）");
  const result = PersonSchema.safeParse({
    name: "张三",
    age: 28,
    occupation: "工程师",
    skills: ["TypeScript"],
    isEmployed: true,
  });

  if (result.success) {
    console.log(`   ✅ 验证通过！数据: ${JSON.stringify(result.data)}`);
  } else {
    console.log("   ❌ 验证失败！");
  }

  // --- 对比：Tool Calling vs Structured Output ---
  console.log("\n" + "─".repeat(50));
  console.log("📖 Tool Calling vs Structured Output 的区别：");
  console.log("─".repeat(50));
  console.log("");
  console.log("   Tool Calling（工具调用）：");
  console.log("   • 用途：让 Agent 执行操作（查数据库、调 API、计算等）");
  console.log("   • 输入：用户问题 → LLM 决定调用什么工具 → 执行工具");
  console.log("   • Schema：定义工具的 输入参数");
  console.log("   • 类比：给 Agent 配备工具箱");
  console.log("");
  console.log("   Structured Output（结构化输出）：");
  console.log("   • 用途：让 LLM 的回复是特定格式的数据");
  console.log("   • 输入：用户问题 → LLM 直接返回结构化 JSON");
  console.log("   • Schema：定义 输出响应 的格式");
  console.log("   • 类比：给 Agent 一个填表模板");
  console.log("");
  console.log("   ┌─────────────────┬──────────────┬──────────────────┐");
  console.log("   │                 │ Tool Calling │ Structured Output│");
  console.log("   ├─────────────────┼──────────────┼──────────────────┤");
  console.log("   │ Schema 作用     │ 定义输入     │ 定义输出          │");
  console.log("   │ 是否执行代码    │ 是           │ 否               │");
  console.log("   │ 有副作用吗      │ 可能有       │ 没有             │");
  console.log("   │ 常见场景        │ API调用/计算  │ 数据提取/生成     │");
  console.log("   └─────────────────┴──────────────┴──────────────────┘");
}

// ============================================
// === 第六部分：运行所有演示 ===
// ============================================

async function runDemo(): Promise<void> {
  console.log("📚 本 Demo 将展示结构化输出的核心概念：");
  console.log("   1. 使用 Zod 定义输出 Schema");
  console.log("   2. 简单结构化输出（人物信息提取）");
  console.log("   3. 复杂嵌套结构（旅行计划）");
  console.log("   4. 错误处理和验证");
  console.log("   5. Tool Calling vs Structured Output 对比");

  const agent = new StructuredAgent("结构化助手");

  // 运行所有场景
  await demoSimpleOutput(agent);
  await demoComplexOutput(agent);
  await demoErrorHandling();

  // 总结
  console.log("\n" + "═".repeat(50));
  console.log("✅ 结构化输出演示完成！");
  console.log("═".repeat(50));
  console.log("");
  console.log("🎯 你学到了：");
  console.log("   ✓ Zod Schema 精确定义 LLM 的输出格式");
  console.log("   ✓ .parse() 验证数据并抛出详细错误");
  console.log("   ✓ .safeParse() 优雅地处理验证失败");
  console.log("   ✓ 结构化输出让 LLM 回复可编程化");
  console.log("   ✓ 支持从简单到复杂的嵌套结构");
  console.log("   ✓ Tool Calling 和 Structured Output 解决不同问题");
  console.log("");
  console.log("💡 下一步：");
  console.log("   • 回顾 Agent 基础: npx tsx examples/demos/01-agent-basics.ts");
  console.log("   • 回顾 Tool 调用: npx tsx examples/demos/02-tool-calling.ts");
  console.log("   • 探索更多 Mastra 功能: docs/");
  console.log("═".repeat(50));
}

// ============================================
// === 第七部分：使用 Mastra 的 structuredOutput（可选）===
// ============================================
// 在 Mastra 中，结构化输出只需在 generate() 时传入 schema：
//
// import { Agent } from '@mastra/core/agent';
// import { openai } from '@ai-sdk/openai';
// import { z } from 'zod';
//
// const agent = new Agent({
//   name: '结构化助手',
//   instructions: '你是一个数据提取专家。',
//   model: openai('gpt-4o'),
// });
//
// // 定义输出 Schema
// const PersonSchema = z.object({
//   name: z.string(),
//   age: z.number(),
//   occupation: z.string(),
// });
//
// // 使用 structuredOutput 参数
// const result = await agent.generate(
//   '从这段文字中提取人物信息：张三今年28岁，是一名工程师。',
//   {
//     output: PersonSchema,
//   }
// );
//
// // result.object 是类型安全的 { name: string, age: number, occupation: string }
// console.log(result.object.name);  // "张三"
// console.log(result.object.age);   // 28
//
// // Mastra 内部处理了：
// // 1. Schema → JSON Schema 转换
// // 2. 注入到 system prompt
// // 3. 解析和验证 LLM 响应
// // 4. 重试机制（如果 LLM 返回了无效 JSON）

// 启动 Demo
runDemo().catch(console.error);
