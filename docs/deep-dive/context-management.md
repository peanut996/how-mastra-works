# 上下文管理 (Context Management)

在现实的大型 AI Agent 应用中，把所有的资料无脑拼接发给大模型是不可能的。你需要像一个精算师一样，精打细算每一个 Token 的去向。这就是 **Context Management (上下文管理)**。

## 为什么需要动态裁剪？

一次完整的 Agent 请求通常包含以下几个板块：
1. **System Prompt (系统提示词)**：规定 Agent 的人格、底线要求、输出格式。
2. **User Message (用户提问)**：当前这一轮次用户发送的内容。
3. **Tools / Skills (可用工具列表)**：告诉模型它能调用哪些函数以及参数 Schema。
4. **RAG Context (检索增强知识)**：从向量库里捞出来的参考资料。
5. **Chat History (历史记录)**：过去的 N 轮对话。

假设你的模型上下文限制是 8K Tokens（或者你想控制成本，硬性限制在 4K），而 RAG 检索出来的资料就有 6K，历史记录有 3K，这就超标了。

## 优先级梯队 (Priority Hierarchy)

好的框架（或者你在使用 Mastra 时应有的工程实践）必须遵循严格的优先级梯队。当空间不够时，**从最低优先级的板块开始裁剪**。

1. **Top Priority (绝对不能裁)**：
   - 核心 System Prompt（一旦被裁，Agent 就疯了，或者忘记格式约束）
   - 最新的 User Message（一旦被裁，Agent 就不知道用户在问什么）
   - 可用工具列表（如果不完整，Agent 无法执行动作）
   
2. **High Priority (尽量保留)**：
   - RAG 检索出来的前 1~2 个相关度最高的片段（缺少它们会产生幻觉）
   
3. **Medium Priority (可适度截断)**：
   - 最近的 1~3 轮对话历史
   
4. **Low Priority (优先抛弃)**：
   - RAG 检索出的排序靠后的片段
   - 早期的对话历史

## Token 估算与滑动窗口

在拼装 Prompt 时，我们需要通过 `tiktoken` (OpenAI 官方库) 或类似的 tokenizer 进行精准估算。

**滑动窗口 (Sliding Window)** 是一种经典的机制，在上面的 Demo 10 中有所展示：
我们会设定一个预算。从最新的一条对话开始，往上回溯，把每条对话的 token 累加，一旦触及“历史记录预算上限”，就停止回溯，截断更早的历史。

```mermaid
graph TD
    A[计算预算 (总上限 - System - User - Tools)] --> B{预算充足?}
    B -- 是 --> C[加载全部 RAG & History]
    B -- 否 --> D[优先分配给 Top 1 RAG 片段]
    D --> E[剩余空间分配给最近历史]
    E --> F[生成最终 Prompt]
```

## 运行 Demo

在 Demo 10 中，我们刻意设置了一个仅有 500 Tokens 的极小容器，并注入了超长的假知识库。你可以清晰地看到系统是如何在后台打印裁剪日志，舍车保帅，拼装出最终发给大模型的 Prompt 的。

```bash
npm run demo:10
```
