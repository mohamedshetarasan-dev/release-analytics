import { v4 as uuidv4 } from 'uuid';
import { route } from './router';
import { memory } from '../shared/memory';
import type { AgentTask, AgentResult } from '../shared/types';

// Agent implementations wired in Phase 3
// import { runProductManagerAgent } from '../agents/productManager';
// import { runDeveloperAgent } from '../agents/developer';
// import { runCodeReviewAgent } from '../agents/codeReview';
// import { runTestingAgent } from '../agents/testing';

export async function runOrchestrator(
  type: AgentTask['type'],
  description: string,
  context?: Record<string, unknown>,
): Promise<AgentResult[]> {
  const taskId = uuidv4();

  memory.set(taskId, {
    taskId,
    taskDescription: description,
    agentHistory: [],
  });

  const task: AgentTask = { id: taskId, type, description, context };
  const sequence = route(task);
  const results: AgentResult[] = [];

  console.info(`[Orchestrator] Task ${taskId}: running agents ${sequence.join(' → ')}`);

  for (const agentName of sequence) {
    console.info(`[Orchestrator] Invoking ${agentName} agent...`);

    // Placeholder — agent implementations wired in Phase 3
    const result: AgentResult = {
      taskId,
      agent: agentName,
      success: false,
      output: `Agent ${agentName} not yet implemented (Phase 3)`,
      toolsUsed: [],
    };

    results.push(result);
    memory.update(taskId, {
      agentHistory: [
        ...(memory.get(taskId)?.agentHistory ?? []),
        { agent: agentName, result, timestamp: Date.now() },
      ],
    });
  }

  return results;
}
