// ============================================
// Demo 06: 工作流 — 确定性多步编排
// ============================================
// 本 Demo 将展示 Mastra 的 Workflow 引擎核心概念：
// 顺序执行、分支、并行以及人机协作 (HITL)。

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const printHeader = (text: string) => {
  console.log(`\n══════════════════════════════════════════════════`);
  console.log(`🎯 ${text}`);
  console.log(`══════════════════════════════════════════════════\n`);
};

// === 第一部分：Step 定义 ===

interface StepContext {
  initialData: any;
  stepResults: Record<string, any>;
  resumeData?: any; // 用于人机协作恢复时传入的数据
}

interface StepDefinition {
  id: string;
  execute: (context: StepContext, suspend: (reason: string) => Promise<never>) => Promise<any>;
}

// 示例步骤：获取订单数据
const fetchOrderStep: StepDefinition = {
  id: 'fetchOrder',
  execute: async ({ initialData }) => {
    console.log(`   ⏳ [fetchOrder] 正在获取订单 ${initialData.orderId}...`);
    await sleep(500);
    const order = { id: initialData.orderId, amount: initialData.amount || 500, customer: '张三' };
    console.log(`   ✅ [fetchOrder] 获取成功: 订单金额 ¥${order.amount}`);
    return order;
  }
};

// 示例步骤：验证订单
const validateOrderStep: StepDefinition = {
  id: 'validateOrder',
  execute: async ({ stepResults }) => {
    const order = stepResults['fetchOrder'];
    console.log(`   ⏳ [validateOrder] 正在验证订单 ${order.id}...`);
    await sleep(300);
    if (!order.customer) throw new Error("缺少客户信息");
    console.log(`   ✅ [validateOrder] 验证通过`);
    return { valid: true, timestamp: Date.now() };
  }
};

// 示例步骤：自动审批
const autoApproveStep: StepDefinition = {
  id: 'autoApprove',
  execute: async ({ stepResults }) => {
    console.log(`   ✅ [autoApprove] 金额较小，自动审批通过`);
    return { status: 'approved', by: 'system' };
  }
};

// 示例步骤：人工审批 (HITL)
const manualReviewStep: StepDefinition = {
  id: 'manualReview',
  execute: async ({ stepResults, resumeData }, suspend) => {
    // 如果没有恢复数据，说明是第一次执行，需要挂起等待人工
    if (!resumeData) {
      console.log(`   ⏸️ [manualReview] 订单金额过大，需要人工审批。工作流已挂起！`);
      await suspend("WAITING_FOR_MANAGER");
    }
    
    // 如果执行到这里，说明从 suspend 恢复了
    console.log(`   ▶️ [manualReview] 收到人工操作指令...`);
    if (resumeData.approved) {
      console.log(`   ✅ [manualReview] 经理 [${resumeData.manager}] 批准了该订单`);
      return { status: 'approved', by: resumeData.manager };
    } else {
      console.log(`   ❌ [manualReview] 经理 [${resumeData.manager}] 拒绝了该订单`);
      return { status: 'rejected', by: resumeData.manager };
    }
  }
};

// 示例步骤：并行任务
const notifyEmailStep: StepDefinition = {
  id: 'notifyEmail',
  execute: async () => {
    console.log(`   📧 [notifyEmail] 开始发送邮件...`);
    await sleep(800);
    console.log(`   ✅ [notifyEmail] 邮件发送完成`);
    return true;
  }
};

const notifySmsStep: StepDefinition = {
  id: 'notifySms',
  execute: async () => {
    console.log(`   📱 [notifySms] 开始发送短信...`);
    await sleep(600);
    console.log(`   ✅ [notifySms] 短信发送完成`);
    return true;
  }
};

// === 第二部分：简易 Workflow 引擎实现 ===

class SuspendError extends Error {
  constructor(public reason: string) {
    super(reason);
    this.name = 'SuspendError';
  }
}

class SimpleWorkflowEngine {
  private steps: Map<string, StepDefinition> = new Map();
  // 模拟持久化存储
  public stateStore: Record<string, StepContext & { status: 'running'|'suspended'|'completed' }> = {};

  register(step: StepDefinition) {
    this.steps.set(step.id, step);
  }

  // 顺序执行
  async runSequence(runId: string, initialData: any, stepIds: string[]) {
    console.log(`\n🚀 [Workflow] 开始顺序执行: ${stepIds.join(' -> ')}`);
    const context: StepContext = { initialData, stepResults: {} };
    const startTime = Date.now();

    for (const stepId of stepIds) {
      const step = this.steps.get(stepId)!;
      context.stepResults[stepId] = await step.execute(context, async () => { throw new Error("不允许挂起"); });
    }
    
    console.log(`🎉 [Workflow] 顺序执行完成！总耗时: ${Date.now() - startTime}ms`);
    return context.stepResults;
  }

  // 分支与人机协作执行
  async runWithBranchAndHitl(runId: string, initialData: any) {
    console.log(`\n🚀 [Workflow] 开始复杂分支执行 (RunID: ${runId})`);
    
    // 从存储中恢复状态，或者创建新状态
    let context = this.stateStore[runId];
    if (!context) {
      context = { initialData, stepResults: {}, status: 'running' };
      this.stateStore[runId] = context;
    }

    const suspendFn = async (reason: string): Promise<never> => {
      context.status = 'suspended';
      throw new SuspendError(reason);
    };

    try {
      // 1. 获取订单
      if (!context.stepResults['fetchOrder']) {
        context.stepResults['fetchOrder'] = await this.steps.get('fetchOrder')!.execute(context, suspendFn);
      }
      
      const amount = context.stepResults['fetchOrder'].amount;

      // 2. 动态分支判断
      if (amount <= 1000) {
        console.log(`   🔀 [Branch] 走自动审批分支 (金额 <= 1000)`);
        if (!context.stepResults['autoApprove']) {
          context.stepResults['autoApprove'] = await this.steps.get('autoApprove')!.execute(context, suspendFn);
        }
      } else {
        console.log(`   🔀 [Branch] 走人工审批分支 (金额 > 1000)`);
        if (!context.stepResults['manualReview']) {
          context.stepResults['manualReview'] = await this.steps.get('manualReview')!.execute(context, suspendFn);
        }
      }

      context.status = 'completed';
      console.log(`🎉 [Workflow] 执行全部完成！`);
      return context.stepResults;

    } catch (error) {
      if (error instanceof SuspendError) {
        console.log(`\n⏸️ [Workflow 引擎] 检测到挂起信号: ${error.reason}`);
        console.log(`   保存状态快照... 工作流进程已安全退出。等待唤醒。\n`);
        return null;
      }
      throw error;
    }
  }

  // 恢复挂起的工作流
  async resume(runId: string, resumeData: any) {
    console.log(`\n🔄 [Workflow 引擎] 尝试唤醒 RunID: ${runId}`);
    const context = this.stateStore[runId];
    if (!context || context.status !== 'suspended') {
      console.log(`❌ 找不到挂起的实例`);
      return;
    }
    
    context.status = 'running';
    context.resumeData = resumeData; // 注入人类提供的数据
    
    // 重新运行（由于之前的结果已保存在 stepResults 中，已完成的步骤会被跳过）
    return this.runWithBranchAndHitl(runId, context.initialData);
  }

  // 并行执行
  async runParallel(stepIds: string[]) {
    console.log(`\n🚀 [Workflow] 开始并行执行: ${stepIds.join(' , ')}`);
    const context: StepContext = { initialData: {}, stepResults: {} };
    const startTime = Date.now();

    // Promise.all 实现并行
    const promises = stepIds.map(id => this.steps.get(id)!.execute(context, async () => { throw new Error(); }));
    await Promise.all(promises);
    
    console.log(`🎉 [Workflow] 并行执行完成！总耗时: ${Date.now() - startTime}ms (比顺序执行快)`);
  }
}

// === 运行演示 ===

async function runDemo() {
  printHeader('Demo 06: 工作流 (Workflow)');
  
  const engine = new SimpleWorkflowEngine();
  engine.register(fetchOrderStep);
  engine.register(validateOrderStep);
  engine.register(autoApproveStep);
  engine.register(manualReviewStep);
  engine.register(notifyEmailStep);
  engine.register(notifySmsStep);

  // 1. 顺序执行
  console.log(`\n🎯 场景 1: 简单的顺序执行`);
  await engine.runSequence('seq-1', { orderId: 'ORD-001', amount: 500 }, ['fetchOrder', 'validateOrder']);

  // 2. 并行执行
  console.log(`\n🎯 场景 2: 并行执行 (显著减少总耗时)`);
  await engine.runParallel(['notifyEmail', 'notifySms']);

  // 3. 条件分支 + 自动审批
  console.log(`\n🎯 场景 3: 动态分支 (小额订单自动审批)`);
  await engine.runWithBranchAndHitl('branch-auto', { orderId: 'ORD-002', amount: 800 });

  // 4. 人机协作 (挂起与恢复)
  console.log(`\n🎯 场景 4: 人机协作 HITL (大额订单挂起等待人工)`);
  
  // 第一阶段：运行到挂起
  await engine.runWithBranchAndHitl('branch-manual', { orderId: 'ORD-MAX', amount: 5000 });
  
  // 模拟人类经理在 2 秒后在后台系统中点击了"批准"
  console.log(`(模拟真实世界：系统完全停止运行... 等待经理上线处理...)`);
  await sleep(2000);
  console.log(`🧑‍💼 [人类操作] 经理上线，查看了订单 ORD-MAX，点击了[批准]按钮`);
  
  // 第二阶段：唤醒并恢复执行
  await engine.resume('branch-manual', { approved: true, manager: '王总' });

  console.log(`\n══════════════════════════════════════════════════`);
  console.log(`✅ Workflow 演示完成！`);
  console.log(`
🎯 你学到了：
   ✓ Step (步骤) 是最小执行单元
   ✓ 顺序编排 (.then) 与 并行编排 (.parallel)
   ✓ 条件分支 (.branch) 实现业务逻辑路由
   ✓ 挂起 (suspend) 与 恢复 (resume) 实现人机协作
   ✓ 状态持久化确保工作流在重启后能继续运行`);
  console.log(`══════════════════════════════════════════════════\n`);
}

runDemo().catch(console.error);

/*
// === 第五部分：使用 Mastra（真实代码示例） ===
import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

const fetchStep = createStep({
  id: 'fetch',
  outputSchema: z.object({ amount: z.number() }),
  execute: async () => ({ amount: 5000 })
});

const myWorkflow = createWorkflow({ name: 'my-workflow' });

myWorkflow
  .step(fetchStep)
  .then(
    myWorkflow.branch([
      // 如果金额 <= 1000，走 autoApprove
      [({ context }) => context.stepResults.fetch.amount <= 1000, autoApproveStep],
      // 否则走人工
      [({ context }) => context.stepResults.fetch.amount > 1000, manualReviewStep]
    ])
  );

// myWorkflow.commit() // 锁定图结构
// await myWorkflow.execute({ runId: 'run-1' })
*/
