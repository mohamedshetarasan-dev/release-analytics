import Anthropic from '@anthropic-ai/sdk';
import { execSync } from 'child_process';
import path from 'path';
import { runToolLoop } from '../shared/toolLoop';
import { fileToolDefinitions, executeTool as execFileTool } from '../tools/fileTools';
import { githubToolDefinitions, executeTool as execGithubTool } from '../tools/githubTools';
import { testRunnerToolDefinitions, executeTool as execTestTool } from '../tools/testRunnerTools';
import { memory } from '../shared/memory';
import type { AgentTask, AgentResult } from '../shared/types';

const REPO_ROOT = path.resolve(__dirname, '../../../../../');
const ALLOWED_TOOLS = ['read_file', 'write_file', 'list_directory', 'create_pull_request', 'run_tests'];

const SYSTEM_PROMPT = `You are a TypeScript developer implementing features for the Release Analytics monorepo.

## Repository Structure
- packages/backend/src/services/   — business logic (importService, metricsService, releaseService)
- packages/backend/src/routes/     — Express route handlers
- packages/backend/src/config/     — columnMap, database, env
- packages/backend/src/db/schema.ts — Drizzle ORM schema (source of truth for data model)
- packages/backend/src/types/      — shared TypeScript types
- packages/backend/tests/unit/     — Jest unit tests
- packages/backend/tests/integration/ — Jest integration tests (supertest)
- packages/frontend/src/pages/     — React pages
- packages/frontend/src/components/ — React components (charts/, shared/, layout/, upload/)
- packages/frontend/src/services/  — API clients (api.ts, releases.ts, uploads.ts)
- packages/frontend/src/types/     — shared frontend types

## Code Rules
- TypeScript strict mode — no 'any', no unused vars
- Backend functions are pure where possible — no side effects in services
- All database access goes through Drizzle ORM (no raw SQL strings)
- All API inputs validated with Zod
- No error handling for impossible states — only validate at system boundaries
- No premature abstractions — implement exactly what the outcome says
- Tests must be written for every new service function

## Implementation Workflow
1. Read the outcome document carefully
2. Read existing similar files to match patterns (e.g., read metricsService.ts before writing a new service)
3. Implement the code — backend first, then frontend if needed
4. Run tests to confirm they pass before opening a PR
5. Create a feature branch name: feat/<feature-slug>
6. Open a PR with title "feat: <Feature Name>" and body that links to the outcome doc

## Branch Creation
You cannot directly create git branches via tools. Instead, include in your output the exact git command to run:
  git checkout -b feat/<slug> && git add <files> && git commit -m "<msg>"
The orchestrator will execute this before calling create_pull_request.
`;

export async function runDeveloperAgent(task: AgentTask): Promise<AgentResult> {
  const feature = (task.context?.feature as string) ?? task.description;
  const slug = feature.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const outcomePath = `docs/outcomes/${slug}.md`;
  const branch = `feat/${slug}`;

  const tools: Anthropic.Tool[] = [
    ...fileToolDefinitions,
    ...githubToolDefinitions,
    ...testRunnerToolDefinitions,
  ].filter((t) => ALLOWED_TOOLS.includes(t.name)) as Anthropic.Tool[];

  const toolHandlers = [
    ...fileToolDefinitions.map((t) => ({
      name: t.name,
      execute: (input: Record<string, unknown>) => execFileTool(t.name, input),
    })),
    ...githubToolDefinitions
      .filter((t) => t.name === 'create_pull_request')
      .map((t) => ({
        name: t.name,
        execute: async (input: Record<string, unknown>) => {
          // Create branch and commit before opening PR
          try {
            execSync(`cd "${REPO_ROOT}" && git checkout -b ${branch} 2>/dev/null || git checkout ${branch}`, { stdio: 'pipe' });
            execSync(`cd "${REPO_ROOT}" && git add -A && git commit -m "feat: implement ${feature}" --allow-empty`, { stdio: 'pipe' });
            execSync(`cd "${REPO_ROOT}" && git push -u origin ${branch}`, { stdio: 'pipe' });
          } catch (err) {
            console.warn('[Developer] Git error:', String(err));
          }
          return execGithubTool(t.name, { ...input, head: branch, base: 'main' });
        },
      })),
    ...testRunnerToolDefinitions.map((t) => ({
      name: t.name,
      execute: (input: Record<string, unknown>) => execTestTool(t.name, input),
    })),
  ];

  const userMessage = `Implement the feature described in: ${outcomePath}

Steps:
1. Read the outcome document at ${outcomePath}
2. Confirm all AI Inquiries are resolved (if not, stop and report which ones need resolution)
3. Read similar existing files to understand patterns before writing code
4. Write the implementation — only what is In Scope in the outcome
5. Run tests to verify correctness (run_tests tool)
6. Open a Pull Request with title "feat: ${feature}" that links to ${outcomePath}

Branch name to use: ${branch}`;

  const result = await runToolLoop({
    agentName: 'developer',
    taskId: task.id,
    systemPrompt: SYSTEM_PROMPT,
    userMessage,
    tools,
    toolHandlers,
  });

  memory.update(task.id, { outcomePath });

  return result;
}
