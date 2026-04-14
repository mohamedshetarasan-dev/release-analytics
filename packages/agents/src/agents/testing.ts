import Anthropic from '@anthropic-ai/sdk';
import path from 'path';
import { runToolLoop } from '../shared/toolLoop';
import { fileToolDefinitions, executeTool as execFileTool } from '../tools/fileTools';
import { testRunnerToolDefinitions, executeTool as execTestTool } from '../tools/testRunnerTools';
import type { AgentTask, AgentResult } from '../shared/types';

const ALLOWED_TOOLS = ['read_file', 'write_file', 'list_directory', 'run_tests'];

const SYSTEM_PROMPT = `You are a QA engineer writing unit tests for the Release Analytics monorepo.

## Testing Conventions

### Backend (Jest + ts-jest)
- Test files: packages/backend/tests/unit/<filename>.test.ts
- Integration tests: packages/backend/tests/integration/<filename>.test.ts
- Use better-sqlite3 in :memory: mode for DB tests — never real files
- Use supertest for integration tests — wrap the Express app, don't start a server
- Import pattern: import { functionName } from '../../../src/services/serviceName'
- Coverage target: 80% lines and branches

### Frontend (Vitest + @testing-library/react)
- Test files: packages/frontend/tests/components/<ComponentName>.test.tsx
- Use msw (Mock Service Worker) to mock API calls — never mock axios directly
- Setup file: packages/frontend/tests/setup.ts (imports @testing-library/jest-dom)
- Coverage target: 70% lines

### Test Structure (for each function/component)
Write tests for:
1. Happy path — normal expected inputs produce correct outputs
2. Edge cases — from the outcome doc's "Edge Cases / Failure Modes" section
3. Failure modes — invalid inputs, null values, network errors
4. Boundary conditions — empty arrays, zero values, max values

### Backend Service Test Template
\`\`\`typescript
import { functionUnderTest } from '../../../src/services/serviceName';

describe('functionUnderTest', () => {
  it('should return X when given valid input', () => {
    const result = functionUnderTest(validInput);
    expect(result).toEqual(expectedOutput);
  });

  it('should handle null/empty input gracefully', () => {
    expect(functionUnderTest(null)).toBeNull();
  });
});
\`\`\`

## Rules
- No mocking of the module under test itself
- One describe block per function/component
- Test names must be human-readable sentences starting with "should"
- Always run tests after writing them and fix any failures
`;

export async function runTestingAgent(task: AgentTask): Promise<AgentResult> {
  const targetFile = task.context?.target as string | undefined;
  const feature = task.context?.feature as string | undefined;

  if (!targetFile && !feature) {
    return {
      taskId: task.id,
      agent: 'testing',
      success: false,
      output: '',
      toolsUsed: [],
      error: 'Provide --target=<file path> or --feature=<feature name>',
    };
  }

  // Derive which package to run tests for
  const pkgName = targetFile?.includes('packages/frontend')
    ? 'frontend'
    : targetFile?.includes('packages/agents')
      ? 'agents'
      : 'backend';

  // Derive test file path from source file
  let testFilePath: string | undefined;
  if (targetFile) {
    const basename = path.basename(targetFile, path.extname(targetFile));
    const isBackend = pkgName === 'backend';
    testFilePath = isBackend
      ? `packages/backend/tests/unit/${basename}.test.ts`
      : `packages/frontend/tests/components/${basename}.test.tsx`;
  }

  const tools: Anthropic.Tool[] = [
    ...fileToolDefinitions,
    ...testRunnerToolDefinitions,
  ].filter((t) => ALLOWED_TOOLS.includes(t.name)) as Anthropic.Tool[];

  const toolHandlers = [
    ...fileToolDefinitions.map((t) => ({
      name: t.name,
      execute: (input: Record<string, unknown>) => execFileTool(t.name, input),
    })),
    ...testRunnerToolDefinitions.map((t) => ({
      name: t.name,
      execute: (input: Record<string, unknown>) => execTestTool(t.name, input),
    })),
  ];

  const userMessage = targetFile
    ? `Write comprehensive unit tests for: ${targetFile}

Steps:
1. Read the source file at ${targetFile}
2. If a related outcome doc exists (check docs/outcomes/), read it for edge cases
3. Read any existing test files in the same test directory to match patterns
4. Write tests covering: happy path, edge cases from outcome doc, failure modes
5. Save the test file to: ${testFilePath}
6. Run the tests: run_tests with package="${pkgName}" and test_file="${testFilePath}"
7. If tests fail, fix them and re-run until all pass
8. Report the final test results and coverage`
    : `Write tests for the feature: "${feature}"

Steps:
1. Read docs/outcomes/${feature!.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md for acceptance criteria and edge cases
2. List files in the relevant packages to find the implementation files
3. Write tests for each new file, covering all acceptance criteria as test scenarios
4. Run the tests and report results`;

  return runToolLoop({
    agentName: 'testing',
    taskId: task.id,
    systemPrompt: SYSTEM_PROMPT,
    userMessage,
    tools,
    toolHandlers,
  });
}
