import Anthropic from '@anthropic-ai/sdk';
import { runToolLoop } from '../shared/toolLoop';
import { githubToolDefinitions, executeTool as execGithubTool } from '../tools/githubTools';
import { fileToolDefinitions, executeTool as execFileTool } from '../tools/fileTools';
import type { AgentTask, AgentResult } from '../shared/types';

const ALLOWED_TOOLS = ['list_files_changed', 'get_file_from_pr', 'add_pr_comment', 'read_file'];

const SYSTEM_PROMPT = `You are a senior TypeScript engineer performing a code review for the Release Analytics project.

## Project Context
- Monorepo: packages/backend (Node.js + Express), packages/frontend (React + Vite), packages/agents (Anthropic SDK)
- Backend uses: Drizzle ORM, SQLite (better-sqlite3), Zod validation, Multer for file upload
- Frontend uses: React 18, React Query, Zustand, Recharts, react-dropzone
- Agents use: @anthropic-ai/sdk with tool-use loops and prompt caching
- All TypeScript with strict mode enabled
- Tests: Jest + supertest (backend), Vitest + Testing Library + msw (frontend)

## Review Checklist
Assess the PR across these dimensions:

**Correctness**
- Does the code do what the outcome/PR description claims?
- Are there logic errors or off-by-one issues?
- Are null/undefined cases handled?

**TypeScript**
- Is strict typing used? No unnecessary `any`?
- Are all exported types properly defined?

**Tests**
- Are unit tests added for new services/utilities?
- Do tests cover edge cases from the outcome document?
- Coverage target: 80% backend, 70% frontend

**Security**
- No SQL injection, XSS, or path traversal risks
- No secrets or API keys in code
- File uploads validated (type + size)

**Code Quality**
- No premature abstractions
- No unused variables, imports, or dead code
- Functions do one thing

**Outcome Adherence**
- Does the implementation match the In Scope and Acceptance Criteria?
- Are Out of Scope items correctly excluded?

## Comment Format
Structure your PR comment as:

### Code Review — Release Analytics Agent

**Summary**: [one sentence]

**Issues Found** (if any):
- 🔴 [critical] file.ts:line — description
- 🟡 [suggestion] file.ts:line — description

**Positives**:
- ✅ item

**Verdict**: ✅ Approve | 🔄 Request Changes

---
*Reviewed by Code Review Agent (claude-sonnet-4-6)*
`;

export async function runCodeReviewAgent(task: AgentTask): Promise<AgentResult> {
  const prNumber = task.context?.prNumber as number | undefined;
  if (!prNumber) {
    return {
      taskId: task.id,
      agent: 'code-review',
      success: false,
      output: '',
      toolsUsed: [],
      error: 'prNumber is required for the Code Review Agent. Pass --pr=<number>',
    };
  }

  const tools: Anthropic.Tool[] = [
    ...githubToolDefinitions,
    ...fileToolDefinitions,
  ].filter((t) => ALLOWED_TOOLS.includes(t.name)) as Anthropic.Tool[];

  const toolHandlers = [
    ...githubToolDefinitions.map((t) => ({
      name: t.name,
      execute: (input: Record<string, unknown>) => execGithubTool(t.name, input),
    })),
    ...fileToolDefinitions.map((t) => ({
      name: t.name,
      execute: (input: Record<string, unknown>) => execFileTool(t.name, input),
    })),
  ];

  const userMessage = `Review Pull Request #${prNumber}.

Steps:
1. Call list_files_changed with pr_number=${prNumber} to see what changed
2. For each changed file, call get_file_from_pr to read the contents (focus on .ts/.tsx files)
3. If there is an outcome doc referenced in the PR or relevant to the changes, read it with read_file
4. Write a structured code review comment and post it with add_pr_comment (pr_number=${prNumber})

Be specific: reference file names and line numbers where possible. Apply all checklist dimensions.`;

  return runToolLoop({
    agentName: 'code-review',
    taskId: task.id,
    systemPrompt: SYSTEM_PROMPT,
    userMessage,
    tools,
    toolHandlers,
  });
}
