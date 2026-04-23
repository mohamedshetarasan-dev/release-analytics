import { execSync } from 'child_process';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../../../../');

export const testRunnerToolDefinitions = [
  {
    name: 'run_tests',
    description: 'Run Jest (backend/agents) or Vitest (frontend) tests for a package. Returns pass/fail counts and coverage summary.',
    input_schema: {
      type: 'object',
      properties: {
        package: {
          type: 'string',
          enum: ['backend', 'frontend', 'agents'],
          description: 'Which package to run tests for',
        },
        test_file: {
          type: 'string',
          description: 'Optional: path to a specific test file relative to the package root (e.g. "tests/unit/metricsService.test.ts")',
        },
      },
      required: ['package'],
    },
  },
] as const;

export function executeTool(name: string, input: Record<string, unknown>): string {
  if (name !== 'run_tests') throw new Error(`Unknown test runner tool: ${name}`);

  const pkg = input.package as string;
  const testFile = input.test_file as string | undefined;
  const pkgPath = path.join(REPO_ROOT, 'packages', pkg);

  const runner = pkg === 'frontend' ? 'vitest run' : 'jest';
  const fileArg = testFile ? ` ${testFile}` : '';
  const coverageFlag = testFile ? '' : ' --coverage';
  const cmd = `cd "${pkgPath}" && npx ${runner}${fileArg}${coverageFlag} --no-color 2>&1`;

  try {
    const output = execSync(cmd, { timeout: 120_000 }).toString();
    return truncate(output, 4000);
  } catch (err: unknown) {
    // execSync throws on non-zero exit — still return the output for the agent
    const output = err instanceof Error && 'stdout' in err
      ? String((err as NodeJS.ErrnoException & { stdout: Buffer }).stdout)
      : String(err);
    return truncate(output, 4000);
  }
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `...truncated (${text.length} chars total)...\n${text.slice(-max)}`;
}
