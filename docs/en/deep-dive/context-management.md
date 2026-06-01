# Context Management

In real-world large-scale AI Agent applications, blindly concatenating all materials and sending them to the LLM is impossible. You need to be as meticulous as an actuary, carefully accounting for every token's destination. This is **Context Management**.

## Why Dynamic Trimming?

A complete Agent request typically consists of the following sections:
1. **System Prompt**: Defines the Agent's personality, guardrails, and output format.
2. **User Message**: The current round's user content.
3. **Tools / Skills**: Tells the model which functions it can call and their parameter schemas.
4. **RAG Context**: Reference materials retrieved from the vector store.
5. **Chat History**: Past N rounds of conversation.

Suppose your model's context limit is 8K tokens (or you want to hard-limit to 4K for cost control), and the RAG-retrieved material is 6K while the history is 3K — that's already over budget.

## Priority Hierarchy

A good framework (or your engineering practice when using Mastra) must follow a strict priority hierarchy. When space is tight, **start trimming from the lowest-priority sections**.

1. **Top Priority (never trim)**:
   - Core System Prompt (if trimmed, the Agent goes haywire or forgets format constraints)
   - Latest User Message (if trimmed, the Agent doesn't know what the user is asking)
   - Available tools list (if incomplete, the Agent can't execute actions)
   
2. **High Priority (try to keep)**:
   - Top 1~2 highest-relevance RAG fragments (missing them causes hallucinations)
   
3. **Medium Priority (truncate moderately)**:
   - Most recent 1~3 rounds of conversation history
   
4. **Low Priority (discard first)**:
   - Lower-ranked RAG fragments
   - Early conversation history

## Token Estimation and Sliding Window

When assembling the prompt, we need precise estimation through `tiktoken` (OpenAI's official library) or a similar tokenizer.

**Sliding Window** is a classic mechanism, demonstrated in Demo 10 above:
We set a budget. Starting from the most recent message, we go back and accumulate each message's tokens. Once we hit the "history budget cap," we stop and truncate earlier history.

```mermaid
graph TD
    A[Calculate budget (total limit - System - User - Tools)] --> B{Budget sufficient?}
    B -- Yes --> C[Load all RAG & History]
    B -- No --> D[Prioritize Top 1 RAG fragment]
    D --> E[Allocate remaining space to recent history]
    E --> F[Generate final prompt]
```

## Run the Demo

In Demo 10, we deliberately set an extremely small container of only 500 tokens and injected an excessively long fake knowledge base. You can clearly see how the system prints trimming logs in the background, sacrificing the less critical parts to preserve the essential ones, and assembles the final prompt sent to the LLM.

```bash
npm run demo:10
```
