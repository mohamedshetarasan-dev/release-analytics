import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const OWNER = process.env.REPO_OWNER ?? 'mohamedshetarasan-dev';
const REPO = process.env.REPO_NAME ?? 'release-analytics';

// ── Tool Definitions (passed to Claude) ──────────────────────────────────────

export const githubToolDefinitions = [
  {
    name: 'create_pull_request',
    description: 'Opens a Pull Request on GitHub. Always use a feature branch as head — never main.',
    input_schema: {
      type: 'object',
      properties: {
        title:  { type: 'string', description: 'PR title (concise, under 70 chars)' },
        body:   { type: 'string', description: 'PR description in markdown, including link to outcome doc' },
        head:   { type: 'string', description: 'Source branch name (feature branch)' },
        base:   { type: 'string', description: 'Target branch (usually "main")', default: 'main' },
      },
      required: ['title', 'body', 'head'],
    },
  },
  {
    name: 'add_pr_comment',
    description: 'Posts a comment on an existing Pull Request.',
    input_schema: {
      type: 'object',
      properties: {
        pr_number: { type: 'number', description: 'Pull Request number' },
        body:      { type: 'string', description: 'Comment body in markdown' },
      },
      required: ['pr_number', 'body'],
    },
  },
  {
    name: 'create_github_issue',
    description: 'Creates a GitHub issue to track an outcome or task.',
    input_schema: {
      type: 'object',
      properties: {
        title:  { type: 'string', description: 'Issue title' },
        body:   { type: 'string', description: 'Issue body in markdown' },
        labels: { type: 'array', items: { type: 'string' }, description: 'Labels to apply' },
      },
      required: ['title', 'body'],
    },
  },
  {
    name: 'list_files_changed',
    description: 'Returns the list of files changed in a Pull Request.',
    input_schema: {
      type: 'object',
      properties: {
        pr_number: { type: 'number', description: 'Pull Request number' },
      },
      required: ['pr_number'],
    },
  },
  {
    name: 'get_file_from_pr',
    description: 'Gets the content of a file at the head commit of a Pull Request.',
    input_schema: {
      type: 'object',
      properties: {
        pr_number: { type: 'number', description: 'Pull Request number' },
        path:      { type: 'string', description: 'File path relative to repo root' },
      },
      required: ['pr_number', 'path'],
    },
  },
] as const;

// ── Tool Implementations ──────────────────────────────────────────────────────

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
): Promise<string> {
  switch (name) {
    case 'create_pull_request': {
      const { title, body, head, base = 'main' } = input as {
        title: string; body: string; head: string; base?: string;
      };
      const { data } = await octokit.pulls.create({
        owner: OWNER, repo: REPO, title, body, head, base,
      });
      return JSON.stringify({ pr_number: data.number, url: data.html_url });
    }

    case 'add_pr_comment': {
      const { pr_number, body } = input as { pr_number: number; body: string };
      const { data } = await octokit.issues.createComment({
        owner: OWNER, repo: REPO, issue_number: pr_number, body,
      });
      return JSON.stringify({ comment_id: data.id, url: data.html_url });
    }

    case 'create_github_issue': {
      const { title, body, labels = [] } = input as {
        title: string; body: string; labels?: string[];
      };
      const { data } = await octokit.issues.create({
        owner: OWNER, repo: REPO, title, body, labels,
      });
      return JSON.stringify({ issue_number: data.number, url: data.html_url });
    }

    case 'list_files_changed': {
      const { pr_number } = input as { pr_number: number };
      const { data } = await octokit.pulls.listFiles({
        owner: OWNER, repo: REPO, pull_number: pr_number, per_page: 100,
      });
      return JSON.stringify(data.map((f) => ({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
      })));
    }

    case 'get_file_from_pr': {
      const { pr_number, path } = input as { pr_number: number; path: string };
      const { data: pr } = await octokit.pulls.get({
        owner: OWNER, repo: REPO, pull_number: pr_number,
      });
      try {
        const { data } = await octokit.repos.getContent({
          owner: OWNER, repo: REPO, path, ref: pr.head.sha,
        });
        if ('content' in data && data.content) {
          return Buffer.from(data.content, 'base64').toString('utf-8');
        }
        return 'File is not a text file or is empty.';
      } catch {
        return `File not found at path: ${path}`;
      }
    }

    default:
      throw new Error(`Unknown GitHub tool: ${name}`);
  }
}
