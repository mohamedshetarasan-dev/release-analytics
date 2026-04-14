#!/usr/bin/env node
import 'dotenv/config';
import { runOrchestrator } from './orchestrator';
import type { AgentTask } from './shared/types';

const VALID_TASKS: AgentTask['type'][] = ['product-manager', 'code-review', 'developer', 'testing'];

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (prefix: string) => args.find((a) => a.startsWith(prefix))?.split('=').slice(1).join('=');

  const task = get('--task=') as AgentTask['type'] | undefined;
  const pr = get('--pr=');
  const feature = get('--feature=');
  const target = get('--target=');

  return { task, pr: pr ? parseInt(pr, 10) : undefined, feature, target };
}

async function main() {
  const { task, pr, feature, target } = parseArgs();

  if (!task || !VALID_TASKS.includes(task)) {
    console.error(`
Usage: npx tsx packages/agents/src/index.ts --task=<type> [options]

Task types:
  product-manager   Write an outcome document
  code-review       Review an open PR
  developer         Implement an approved outcome
  testing           Write and run tests for a file

Options:
  --feature=<name>  Feature name (required for: product-manager, developer, testing)
  --pr=<number>     PR number (required for: code-review)
  --target=<path>   Source file path (optional for: testing)

Examples:
  npx tsx packages/agents/src/index.ts --task=product-manager --feature="Bug Count Analytics"
  npx tsx packages/agents/src/index.ts --task=code-review --pr=42
  npx tsx packages/agents/src/index.ts --task=developer --feature="Bug Count Analytics"
  npx tsx packages/agents/src/index.ts --task=testing --target=packages/backend/src/services/metricsService.ts
`);
    process.exit(1);
  }

  const context: Record<string, unknown> = {};
  if (pr) context.prNumber = pr;
  if (feature) context.feature = feature;
  if (target) context.target = target;

  const description = feature
    ? `${task} — ${feature}`
    : pr
      ? `${task} — PR #${pr}`
      : task;

  console.info(`\n🤖 Release Analytics Agent System`);
  console.info(`   Task: ${task}`);
  if (feature) console.info(`   Feature: ${feature}`);
  if (pr) console.info(`   PR: #${pr}`);
  if (target) console.info(`   Target: ${target}`);
  console.info('');

  try {
    const results = await runOrchestrator(task, description, context);

    console.info('\n─── Results ───');
    for (const r of results) {
      const icon = r.success ? '✅' : '❌';
      console.info(`${icon} [${r.agent}] Tools used: ${r.toolsUsed.join(', ') || 'none'}`);
      if (r.output) console.info(r.output);
      if (r.error) console.error(`   Error: ${r.error}`);
    }

    const anyFailed = results.some((r) => !r.success);
    process.exit(anyFailed ? 1 : 0);
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

main();
