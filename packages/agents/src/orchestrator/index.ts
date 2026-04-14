import { v4 as uuidv4 } from 'uuid';
import { route } from './router';
import { memory } from '../shared/memory';
import { runProductManagerAgent } from '../agents/productManager';
import { runCodeReviewAgent } from '../agents/codeReview';
import { runDeveloperAgent } from '../agents/developer';
import { runTestingAgent } from '../agents/testing';
import type { AgentTask, AgentResult, AgentName } from '../shared/types';

const agentRunners: Record<AgentName, (task: AgentTask) => Promise<AgentResult>> = {
  'product-manager': runProductManagerAgent,
  'code-review':     runCodeReviewAgent,
  'developer':       runDeveloperAgent,
  'testing':         runTestingAgent,
};

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

  console.info(`[Orchestrator] Task ${taskId}`);
  console.info(`[Orchestrator] Sequence: ${sequence.join(' → ')}`);

  for (const agentName of sequence) {
    console.info(`\n[Orchestrator] ─── Running ${agentName} ───`);

    const runner = agentRunners[agentName];
    const agentTask: AgentTask = { ...task, type: agentName };

    let result: AgentResult;
    try {
      result = await runner(agentTask);
    } catch (err) {
      result = {
        taskId,
        agent: agentName,
        success: false,
        output: '',
        toolsUsed: [],
        error: String(err),
      };
    }

    results.push(result);

    memory.update(taskId, {
      agentHistory: [
        ...(memory.get(taskId)?.agentHistory ?? []),
        { agent: agentName, result, timestamp: Date.now() },
      ],
    });

    if (!result.success && result.error) {
      console.error(`[Orchestrator] ${agentName} failed: ${result.error}`);
      break; // Stop the pipeline on hard failure
    }

    console.info(`[Orchestrator] ${agentName} complete. Tools used: ${result.toolsUsed.join(', ') || 'none'}`);
  }

  return results;
}
