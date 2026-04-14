#!/usr/bin/env node
import { runOrchestrator } from './orchestrator';

const args = process.argv.slice(2);
const taskArg = args.find((a) => a.startsWith('--task='))?.split('=')[1];
const prArg = args.find((a) => a.startsWith('--pr='))?.split('=')[1];
const featureArg = args.find((a) => a.startsWith('--feature='))?.split('=')[1];

if (!taskArg) {
  console.error('Usage: agents --task=<type> [--pr=<number>] [--feature=<name>]');
  console.error('  task types: product-manager, developer, code-review, testing');
  process.exit(1);
}

const validTasks = ['product-manager', 'developer', 'code-review', 'testing'];
if (!validTasks.includes(taskArg)) {
  console.error(`Invalid task type "${taskArg}". Valid: ${validTasks.join(', ')}`);
  process.exit(1);
}

const context: Record<string, unknown> = {};
if (prArg) context.prNumber = parseInt(prArg, 10);
if (featureArg) context.feature = featureArg;

runOrchestrator(taskArg as AgentTask['type'], `Run ${taskArg} agent`, context)
  .then((results) => {
    for (const r of results) {
      console.info(`[${r.agent}] ${r.success ? 'SUCCESS' : 'PENDING'}: ${r.output}`);
    }
  })
  .catch((err) => {
    console.error('[Orchestrator] Fatal error:', err);
    process.exit(1);
  });

// Import type after usage to avoid circular reference issue
import type { AgentTask } from './shared/types';
