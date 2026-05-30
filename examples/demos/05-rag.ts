// ============================================
// Demo 05: RAG — 检索增强生成
// ============================================
// 本 Demo 将展示完整的 RAG 管道：文档分块 -> 嵌入 -> 存储 -> 检索 -> 生成。
// 我们将手动实现一个简化的 RAG 流程，以帮助理解底层原理。

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const printHeader = (text: string) => {
  console.log(`\n══════════════════════════════════════════════════`);
  console.log(`🎯 ${text}`);
  console.log(`══════════════════════════════════════════════════\n`);
};

// === 第一部分：文档加载与分块 (Document Loading & Chunking) ===

interface Document {
  content: string;
  metadata: Record<string, any>;
}

// 简单的固定长度分块策略 (带重叠)
function fixedSizeChunk(text: string, size: number, overlap: number): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += (size - overlap);
  }
  return chunks;
}

// 按句子分块策略
function sentenceChunk(text: string): string[] {
  // 简单以句号、问号、叹号或换行符作为句子边界
  return text.split(/([。！？\n]+)/).reduce((acc: string[], curr: string, i: number, arr: string[]) => {
    if (i % 2 === 0) {
      const sentence = curr + (arr[i + 1] || '');
      if (sentence.trim()) acc.push(sentence.trim());
    }
    return acc;
  }, []);
}

// === 第二部分：嵌入向量生成 (Embedding) ===

// 简单的 Mock 嵌入引擎（基于词频的 TF-IDF 简化版）
class MockEmbedding {
  // 定义一个极简词表
  private vocab = ['mastra', 'agent', 'tool', 'workflow', 'rag', '检索', '工具', '工作流', '记忆', '自主', '编排', '向量'];
  
  embed(text: string): number[] {
    const lowerText = text.toLowerCase();
    return this.vocab.map(word => {
      // 简单计算词频作为向量维度值
      const regex = new RegExp(word, 'g');
      const match = lowerText.match(regex);
      return match ? match.length : 0;
    });
  }

  embedBatch(texts: string[]): number[][] {
    return texts.map(t => this.embed(t));
  }
}

// 计算余弦相似度
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  let dotProduct = 0; let normA = 0; let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// === 第三部分：向量存储 (Vector Store) ===

interface VectorRecord {
  id: string;
  vector: number[];
  metadata: { text: string; source: string };
}

class InMemoryVectorStore {
  private records: VectorRecord[] = [];

  insert(id: string, vector: number[], metadata: { text: string; source: string }) {
    this.records.push({ id, vector, metadata });
  }

  search(queryVector: number[], topK: number = 2) {
    // 如果查询向量全为0（没命中任何关键词），返回空
    if (queryVector.every(v => v === 0)) return [];

    const scored = this.records.map(r => ({
      ...r,
      score: cosineSimilarity(queryVector, r.vector)
    }));

    return scored
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}

// === 第四部分：完整 RAG 管道 ===

class RAGPipeline {
  private embedder = new MockEmbedding();
  private vectorStore = new InMemoryVectorStore();

  // 1. 摄入知识 (Ingestion)
  async ingestDocs(docs: Document[]) {
    console.log(`\n📚 开始摄入 ${docs.length} 篇文档...`);
    let chunkCount = 0;

    for (const doc of docs) {
      // 步骤 1a: 分块
      const chunks = sentenceChunk(doc.content);
      
      // 步骤 1b: 嵌入
      const vectors = this.embedder.embedBatch(chunks);
      
      // 步骤 1c: 存储
      chunks.forEach((chunkText, i) => {
        this.vectorStore.insert(
          `${doc.metadata.title}-chunk-${i}`,
          vectors[i],
          { text: chunkText, source: doc.metadata.title }
        );
        chunkCount++;
      });
      console.log(`   📎 文档 [${doc.metadata.title}] 分为了 ${chunks.length} 个 Chunk 并向量化存储。`);
    }
    console.log(`✅ 摄入完成！共存储 ${chunkCount} 个向量。`);
  }

  // 2. 检索增强生成 (Retrieval-Augmented Generation)
  async ask(question: string, useRAG: boolean = true) {
    console.log(`\n──────────────────────────────────────────────────`);
    console.log(`📨 用户提问: "${question}" (RAG开启: ${useRAG ? '✅' : '❌'})`);
    
    let contextStr = '';
    
    if (useRAG) {
      console.log(`   🔍 正在检索知识库...`);
      // 步骤 2a: 嵌入查询
      const queryVector = this.embedder.embed(question);
      
      // 步骤 2b: 向量检索
      const results = this.vectorStore.search(queryVector, 2);
      
      if (results.length > 0) {
        console.log(`   🎯 找到 ${results.length} 个相关上下文：`);
        results.forEach((r, i) => {
          console.log(`      [${i+1}] 来源: ${r.metadata.source} (相似度: ${(r.score * 100).toFixed(1)}%)`);
          console.log(`          内容: "${r.metadata.text.substring(0, 40)}..."`);
        });
        
        contextStr = results.map(r => r.metadata.text).join('\n\n');
      } else {
        console.log(`   ⚠️ 未检索到相关内容。`);
      }
    }

    // 步骤 2c: 构建 Prompt 并模拟 LLM 生成
    console.log(`\n   🧠 LLM 思考中...`);
    await sleep(1000);
    
    const response = this.mockLlmGenerate(question, contextStr, useRAG);
    console.log(`\n🤖 Agent 回答:\n${response}`);
  }

  private mockLlmGenerate(question: string, context: string, useRAG: boolean): string {
    // 模拟纯 LLM 回答（幻觉）
    if (!useRAG || !context) {
      if (question.includes('Mastra')) {
        return "Mastra 听起来像是一个汽车品牌（马自达 Mazda 的变体？）或者可能是某个不知名的软件库。由于我的训练数据截止日期，我没有关于它的确切信息。";
      }
      return "我不知道。";
    }

    // 模拟基于上下文的回答（RAG）
    if (question.includes('工作流') || question.includes('workflow')) {
      return `根据参考资料，Mastra 提供原生的 Workflow 引擎。它基于图状态机，允许开发者预先定义好执行路径，非常适合需要确定性和可预测性的业务流程。`;
    }
    if (question.includes('Tool') || question.includes('工具')) {
      return `在 Mastra 中，Tool 系统允许 Agent 调用外部函数。这让 AI 能够突破自身的限制，去查询数据库、调用外部 API 等，极大扩展了能力边界。`;
    }
    
    return `根据检索到的资料：${context}\n\n这就是关于你问题的全部信息。`;
  }
}

// === 运行演示 ===

const knowledgeBase: Document[] = [
  {
    metadata: { title: "Mastra Agent 概述" },
    content: "Mastra Agent 是一个 TypeScript 原生的自主 AI 实体。它能够理解指令，并能自主决定如何完成任务。"
  },
  {
    metadata: { title: "Mastra Tool 系统" },
    content: "Mastra 的 Tool 系统允许 Agent 调用外部函数。这扩展了 AI 的能力边界，使其能够读写数据库或请求外部 API。"
  },
  {
    metadata: { title: "Mastra Workflow 引擎" },
    content: "Agent 具有不可预测性，而 Mastra 提供原生的 Workflow 工作流引擎。工作流基于图状态机，提供确定性编排，适合严谨的业务流程。"
  },
  {
    metadata: { title: "Mastra RAG 管道" },
    content: "Mastra 提供端到端的 RAG 支持。它可以对文档进行 chunking 分块，生成 vector 向量，并在 vector store 向量库中进行检索。"
  }
];

async function runDemo() {
  printHeader('Demo 05: RAG — 检索增强生成');

  // 1. 展示分块策略
  console.log(`\n🔪 演示分块策略 (Chunking)`);
  const sampleText = "Mastra 是一个极其强大的框架。它有 Agent 和 Workflow。我很喜欢它。";
  console.log(`原文: "${sampleText}"`);
  console.log(`固定长度分块 (size=15, overlap=5):`, fixedSizeChunk(sampleText, 15, 5));
  console.log(`按句子分块:`, sentenceChunk(sampleText));

  // 2. 初始化 RAG 管道
  const rag = new RAGPipeline();
  
  // 3. 摄入外部知识（给 Agent 喂数据）
  await rag.ingestDocs(knowledgeBase);

  // 4. 不使用 RAG 的提问（产生幻觉）
  await rag.ask("Mastra 是什么？它有工作流引擎吗？", false);

  // 5. 使用 RAG 的提问（精准回答）
  await rag.ask("Mastra 是什么？它有工作流引擎吗？", true);

  await rag.ask("Mastra 的 Tool 工具系统有什么用？", true);

  console.log(`\n══════════════════════════════════════════════════`);
  console.log(`✅ RAG 演示完成！`);
  console.log(`
🎯 你学到了：
   ✓ 分块 (Chunking)：将长文档切分为短文本块，保留语义
   ✓ 嵌入 (Embedding)：将文本转化为高维向量
   ✓ 向量检索：通过余弦相似度找到最相关的文本块
   ✓ 增强生成 (RAG)：将检索结果作为上下文注入 Prompt，消灭幻觉`);
  console.log(`══════════════════════════════════════════════════\n`);
}

runDemo().catch(console.error);

/*
// === 第五部分：使用 Mastra（真实代码示例） ===
import { MDocument, embed } from '@mastra/rag';
import { openai } from '@ai-sdk/openai';
import { PgVector } from '@mastra/pg-storage'; // 假设配置好 pgvector

// 1. 分块
const doc = new MDocument({ text: "Mastra 内容..." });
const chunks = await doc.chunk({ strategy: 'recursive', size: 512 });

// 2. 嵌入与存储
const model = openai.embedding('text-embedding-3-small');
const vectorStore = new PgVector({ tableName: 'embeddings' });

for (const chunk of chunks) {
  const { embedding } = await embed({ value: chunk.text, model });
  await vectorStore.insert(chunk.id, embedding, chunk.metadata);
}

// 3. 检索
const { embedding: queryEmbedding } = await embed({ value: "工作流", model });
const results = await vectorStore.search(queryEmbedding, { topK: 3 });
*/
