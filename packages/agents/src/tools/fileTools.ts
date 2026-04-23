import fs from 'fs';
import path from 'path';

/** Absolute path to the repository root */
const REPO_ROOT = path.resolve(__dirname, '../../../../');

function safePath(relativePath: string): string {
  const resolved = path.resolve(REPO_ROOT, relativePath);
  if (!resolved.startsWith(REPO_ROOT)) {
    throw new Error(`Path "${relativePath}" escapes the repository root. Access denied.`);
  }
  return resolved;
}

// ── Tool Definitions ──────────────────────────────────────────────────────────

export const fileToolDefinitions = [
  {
    name: 'read_file',
    description: 'Read the contents of a file in the repository. Path is relative to the repo root.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to repo root (e.g. "docs/outcomes/02-bug-count-analytics.md")' },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write content to a file in the repository. Creates parent directories if needed. Path is relative to the repo root.',
    input_schema: {
      type: 'object',
      properties: {
        path:    { type: 'string', description: 'File path relative to repo root' },
        content: { type: 'string', description: 'Full file content to write' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'list_directory',
    description: 'List files and directories at a given path in the repository.',
    input_schema: {
      type: 'object',
      properties: {
        path:      { type: 'string', description: 'Directory path relative to repo root', default: '.' },
        recursive: { type: 'boolean', description: 'Whether to list recursively', default: false },
      },
    },
  },
] as const;

// ── Tool Implementations ──────────────────────────────────────────────────────

export function executeTool(name: string, input: Record<string, unknown>): string {
  switch (name) {
    case 'read_file': {
      const filePath = safePath(input.path as string);
      if (!fs.existsSync(filePath)) {
        return `File not found: ${input.path}`;
      }
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        return `"${input.path}" is a directory, not a file. Use list_directory instead.`;
      }
      return fs.readFileSync(filePath, 'utf-8');
    }

    case 'write_file': {
      const filePath = safePath(input.path as string);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, input.content as string, 'utf-8');
      return `Written: ${input.path}`;
    }

    case 'list_directory': {
      const dirPath = safePath((input.path as string) ?? '.');
      if (!fs.existsSync(dirPath)) {
        return `Directory not found: ${input.path}`;
      }
      if (input.recursive) {
        return listRecursive(dirPath, REPO_ROOT);
      }
      return fs.readdirSync(dirPath).join('\n');
    }

    default:
      throw new Error(`Unknown file tool: ${name}`);
  }
}

function listRecursive(dir: string, root: string, indent = ''): string {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const lines: string[] = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    lines.push(`${indent}${entry.name}${entry.isDirectory() ? '/' : ''}`);
    if (entry.isDirectory()) {
      lines.push(listRecursive(path.join(dir, entry.name), root, indent + '  '));
    }
  }
  return lines.filter(Boolean).join('\n');
}
