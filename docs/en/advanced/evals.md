# Evaluation & Testing (Evals)

Large language model outputs are inherently **nondeterministic**. In traditional software development, we guarantee `2 + 2 = 4` through unit tests. But in AI development, an Agent's wording may differ every time, making traditional assertions (`assert(response === "expected string")`) impossible.

Therefore, we need an entirely new paradigm: **LLM Evals**.

## Built-in Scorers in Mastra

Mastra provides a comprehensive evaluation framework, centered around criteria-based "Scorers." These scorers typically "fight fire with fire" — using another LLM as a judge to evaluate the output quality of the Agent.

Built-in main scorers include:

| Evaluation Dimension | Scorer Name | Purpose |
|---------------------|-------------|---------|
| **Relevance** | `AnswerRelevancy` | Evaluates whether the answer is on-topic or off-topic |
| **Hallucination Detection** | `Faithfulness` | Evaluates whether the answer is fully based on provided context (essential for RAG) |
| **Context Quality** | `ContextPrecision` | Evaluates whether retrieved RAG context fragments are useful |
| **Tool Accuracy** | `ToolCallAccuracy` | Evaluates whether the Agent correctly selected tools and passed correct parameters |
| **Content Safety** | `Toxicity` / `Bias` | Detects harmful or biased content in outputs |

---

## How to Use

In Mastra, running evaluations is as simple as running regular functions.

```typescript
import { Agent } from '@mastra/core/agent';
import { AnswerRelevancyMetric } from '@mastra/evals/metrics';
import { openai } from '@ai-sdk/openai';

const agent = new Agent({ /* ... */ });

// 1. Initialize the scorer (specify a model to act as judge)
const relevancyScorer = new AnswerRelevancyMetric({
  model: openai('gpt-4o') // Judge models usually need strong reasoning
});

const input = 'How to implement bubble sort in TypeScript?';
// 2. Agent generates answer
const result = await agent.generate(input);

// 3. Run evaluation
const score = await relevancyScorer.evaluate({
  input: input,
  output: result.text
});

console.log(`Relevance score (0-1): ${score.score}`);
console.log(`Judge's reasoning: ${score.reason}`);
```

---

## Automation & CI/CD

In production-grade applications, single manual evaluations are insufficient. You need to build a "test suite" and run batch evaluations in your CI/CD pipeline every time you modify prompts or switch models.

You can leverage Mastra workflows, or combine with external test runners (e.g., Jest/Vitest):

```typescript
// Pseudo-code example: LLM evaluation in unit tests
test('Agent answer must be faithful to given documents', async () => {
  const context = 'Mastra is a TypeScript framework.';
  const input = 'What language is Mastra written in?';
  
  const result = await agent.generate(input, { context });
  
  const evalResult = await faithfulnessScorer.evaluate({
    input,
    output: result.text,
    context
  });
  
  // Set passing threshold
  expect(evalResult.score).toBeGreaterThan(0.8);
});
```

---

## Best Practices

1. **Separate judge from contestant**: Use smaller, cheaper models (e.g., GPT-4o-mini or Claude Haiku) to generate answers, but use larger models (e.g., GPT-4o or Claude Opus) as judges to ensure evaluation accuracy.
2. **Combine with deterministic tests**: Not all evaluations need an LLM judge. For example, "does the JSON structure meet requirements" can be strictly validated with the Zod Schema from Demo 03 — fast and cheap.
3. **Focus on low scores and edge cases**: Evals usually provide a `reason` when giving low scores. Carefully analyzing these reasons and adjusting prompts or RAG strategies is the path to improving Agent quality.
