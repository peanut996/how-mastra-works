# 评估与测试 (Evals)

大语言模型的输出天然具有**非确定性 (Nondeterminism)**。在传统软件开发中，我们通过单元测试来保证 `2 + 2 = 4`。但在 AI 开发中，Agent 每次回答的话术可能都不一样，我们无法使用传统的断言 (`assert(response === "预期字符串")`)。

因此，我们需要一种全新的范式：**大模型评估 (LLM Evals)**。

## 🧪 Mastra 内置的评分器 (Scorers)

Mastra 提供了一套功能齐全的评估框架，核心是基于特定标准的“评分器 (Scorers)”。这些评分器通常是“以模制模”——即利用另一个大模型来充当裁判，评估 Agent 的输出质量。

内置的主要评分器包括：

| 评估维度 | 评分器名称 | 用途说明 |
|----------|------------|----------|
| **相关性** | `AnswerRelevancy` | 评估回答是否切题，有没有答非所问 |
| **幻觉检测** | `Faithfulness` | 评估回答是否完全基于提供的上下文（RAG 场景必备） |
| **上下文质量** | `ContextPrecision` | 评估 RAG 检索回来的上下文片段是否有用 |
| **工具准确度** | `ToolCallAccuracy` | 评估 Agent 是否正确选择了工具并传入了正确的参数 |
| **内容安全** | `Toxicity` / `Bias` | 检测输出是否包含有害、有偏见的内容 |

---

## 📊 如何使用

在 Mastra 中，运行评估就像运行普通函数一样简单。

```typescript
import { Agent } from '@mastra/core/agent';
import { AnswerRelevancyMetric } from '@mastra/evals/metrics';
import { openai } from '@ai-sdk/openai';

const agent = new Agent({ /* ... */ });

// 1. 初始化评分器（指定一个充当裁判的模型）
const relevancyScorer = new AnswerRelevancyMetric({
  model: openai('gpt-4o') // 裁判模型通常需要推理能力强
});

const input = '如何用 TypeScript 冒泡排序？';
// 2. Agent 生成回答
const result = await agent.generate(input);

// 3. 执行评估
const score = await relevancyScorer.evaluate({
  input: input,
  output: result.text
});

console.log(`相关性得分 (0-1): ${score.score}`);
console.log(`裁判给出的评价: ${score.reason}`);
```

---

## 🤖 自动化与 CI/CD 

在生产级应用中，单次手动评估是不够的。你需要建立一个“测试集”，每次修改 Prompt 或更换模型后，都在 CI/CD 管道中批量运行评估。

你可以利用 Mastra 工作流，或者结合外部测试运行器（如 Jest/Vitest）：

```typescript
// 伪代码示例：在单元测试中进行 LLM 评估
test('Agent 的回答必须忠于给定的文档', async () => {
  const context = 'Mastra 是一个 TypeScript 框架。';
  const input = 'Mastra 是什么语言写的？';
  
  const result = await agent.generate(input, { context });
  
  const evalResult = await faithfulnessScorer.evaluate({
    input,
    output: result.text,
    context
  });
  
  // 设定及格线
  expect(evalResult.score).toBeGreaterThan(0.8);
});
```

---

## 💡 最佳实践

1. **裁判与选手分离**：生成回答用较小、较便宜的模型（如 GPT-4o-mini 或 Claude Haiku），但做评估裁判时，尽量使用大杯模型（如 GPT-4o 或 Claude Opus），以保证评判的准确性。
2. **结合确定性测试**：并非所有评估都需要用到 LLM 裁判。例如“JSON 结构是否符合要求”，完全可以用 Demo 03 中的 Zod Schema 进行严格的确定性验证，既快又便宜。
3. **关注低分和边界情况**：Evals 给出低分时通常会带有 `reason`（原因），仔细分析这些原因，调整 Prompt 或 RAG 策略，是提升 Agent 质量的必经之路。
