# AGENTS.md — Release Analytics Multi-Agent System

This file is the living reference for the AI agent system built into this repository.
It is updated automatically each time a new agent or tool is added.

> **Rule for all agents**: Never commit directly to `main`. All changes go through a Pull Request.
> AI Inquiries in any outcome document must be resolved by a human before the Developer Agent begins implementation.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Running Agents](#running-agents)
- [Agent Catalog](#agent-catalog)
  - [Product Manager Agent](#1-product-manager-agent)
  - [Code Review Agent](#2-code-review-agent)
  - [Developer Agent](#3-developer-agent)
  - [Testing Agent](#4-testing-agent)
- [Tools Reference](#tools-reference)
  - [GitHub Tools](#github-tools)
  - [File Tools](#file-tools)
  - [Test Runner Tools](#test-runner-tools)
- [Orchestrator](#orchestrator)
- [Shared Memory](#shared-memory)
- [Adding a New Agent](#adding-a-new-agent)
- [Environment Variables](#environment-variables)
- [Build Status](#build-status)

---

## Overview

The Release Analytics agent system automates four key development workflows using the **Anthropic Claude SDK** (`claude-sonnet-4-6`):

| Agent | When it runs | What it does |
|---|---|---|
| **Product Manager** | Manual CLI trigger | Writes outcome documents in the standard 18-section template |
| **Code Review** | Automatically on PR open (GitHub Actions) | Reviews PR diffs and posts inline comments |
| **Developer** | Manual CLI trigger | Reads an outcome doc, scaffolds code, opens a PR |
| **Testing** | Manual CLI trigger / after Developer agent | Writes Jest/Vitest tests for new code and runs them |

All agents share:
- A **single Anthropic client** with prompt caching (cost-efficient)
- A **shared memory store** (task context passed between agents)
- A common **tools layer** (GitHub API, file I/O, test runner)

---

## Architecture

```
packages/agents/src/
├── index.ts                  ← CLI entry point
├── orchestrator/
│   ├── index.ts              ← runOrchestrator() — coordinates agent sequence
│   └── router.ts             ← Maps task type → agent sequence
├── agents/
│   ├── productManager.ts     ← PM Agent ✅
│   ├── codeReview.ts         ← Code Review Agent ✅
│   ├── developer.ts          ← Developer Agent ✅
│   └── testing.ts            ← Testing Agent ✅
├── tools/
│   ├── githubTools.ts        ← Octokit: createPR, addComment, listChangedFiles, createIssue
│   ├── fileTools.ts          ← readFile, writeFile, listDirectory
│   └── testRunnerTools.ts    ← runTests (Jest / Vitest)
└── shared/
    ├── anthropicClient.ts    ← Singleton Anthropic client + MODEL constant
    ├── types.ts              ← AgentTask, AgentResult, AgentMemory, etc.
    └── memory.ts             ← In-process task memory store
```

### Tool Use Loop

Each agent follows the standard Anthropic tool-use loop:

```
1. Send system prompt (cached) + user task to Claude
2. Receive response
3. If stop_reason === 'tool_use':
   a. Execute the requested tool
   b. Append tool_result to messages
   c. Go to step 1
4. If stop_reason === 'end_turn': return final text as output
```

---

## Running Agents

```bash
# Install dependencies first
npm install

# Product Manager — write an outcome doc
npx tsx packages/agents/src/index.ts --task=product-manager --feature="Bug Count Analytics"

# Code Review — review an open PR
npx tsx packages/agents/src/index.ts --task=code-review --pr=42

# Developer — implement an approved outcome
npx tsx packages/agents/src/index.ts --task=developer --feature="Bug Count Analytics"

# Testing — generate and run tests for a file
npx tsx packages/agents/src/index.ts --task=testing --target=packages/backend/src/services/metricsService.ts
```

The **Code Review Agent** also runs automatically via GitHub Actions on every PR open/sync event (see `.github/workflows/pr-automation.yml`).

---

## Agent Catalog

---

### 1. Product Manager Agent

**File**: `packages/agents/src/agents/productManager.ts`
**Status**: ✅ Built

**Purpose**: Generates a properly structured outcome document in the standard 18-section format and saves it to `docs/outcomes/<feature-slug>.md`. Surfaces AI Inquiries that must be resolved before development starts.

**Trigger**:
```bash
npx tsx packages/agents/src/index.ts --task=product-manager --feature="<Feature Name>"
```

**System prompt focus**: You are a product manager. Given a feature name and project context, write a complete outcome document following the 18-section template exactly. Always populate the AI Inquiries section with real questions about unclear requirements.

**Tools available**:
| Tool | Purpose |
|---|---|
| `read_file` | Read existing outcomes or PRD for context |
| `write_file` | Save the generated outcome document |
| `create_github_issue` | Open a GitHub issue to track the outcome |

**Output**:
- `docs/outcomes/<feature-slug>.md` — outcome document
- GitHub issue created and linked in the Dependencies section

**Prompt caching**: System prompt is cached with `cache_control: { type: "ephemeral" }`.

---

### 2. Code Review Agent

**File**: `packages/agents/src/agents/codeReview.ts`
**Status**: ✅ Built

**Purpose**: Reads the changed files in a Pull Request and posts a structured code review comment covering correctness, test coverage, adherence to outcomes, and potential edge cases.

**Trigger**:
- Automatic: GitHub Actions `pr-automation.yml` fires on every PR open/sync
- Manual: `npx tsx packages/agents/src/index.ts --task=code-review --pr=<number>`

**System prompt focus**: You are a senior software engineer performing a code review. Assess correctness, test coverage gaps, adherence to the outcome document, TypeScript strictness, and edge cases. Be specific — reference file names and line numbers where possible.

**Tools available**:
| Tool | Purpose |
|---|---|
| `list_files_changed` | Get the list of files changed in the PR |
| `read_file` | Read file contents for review |
| `add_pr_comment` | Post the review as a PR comment |

**Output**: A structured PR comment with sections: Summary, Issues Found, Suggestions, and Verdict (Approve / Request Changes).

**Prompt caching**: System prompt + project context cached.

---

### 3. Developer Agent

**File**: `packages/agents/src/agents/developer.ts`
**Status**: ✅ Built

**Purpose**: Reads an approved outcome document, scaffolds the required backend/frontend code following the project's existing patterns, creates a feature branch, and opens a Pull Request.

**Trigger**:
```bash
npx tsx packages/agents/src/index.ts --task=developer --feature="<Feature Name>"
```

**Prerequisite**: The outcome document for the feature must exist in `docs/outcomes/` and all AI Inquiries must be resolved.

**System prompt focus**: You are a TypeScript developer building features for a Node.js + React monorepo. Read the outcome document carefully. Follow existing code patterns. Write code only for what is in scope. Open a PR with a clear description linking to the outcome.

**Tools available**:
| Tool | Purpose |
|---|---|
| `read_file` | Read outcome doc, existing code for patterns |
| `write_file` | Write new source files |
| `create_pull_request` | Open a PR with description |
| `run_tests` | Verify tests pass before opening PR |

**Output**: Feature branch + open PR linking to the outcome document.

---

### 4. Testing Agent

**File**: `packages/agents/src/agents/testing.ts`
**Status**: ✅ Built

**Purpose**: Reads a source file, generates comprehensive Jest (backend) or Vitest (frontend) unit tests covering happy paths, edge cases, and failure modes defined in the outcome document. Runs the tests and reports results.

**Trigger**:
```bash
npx tsx packages/agents/src/index.ts --task=testing --target=<path/to/file.ts>
```

**System prompt focus**: You are a QA engineer writing unit tests. Read the source file and its corresponding outcome document. Write tests for: happy path, edge cases listed in the outcome, and failure modes. Use the project's existing test patterns (ts-jest for backend, vitest for frontend).

**Tools available**:
| Tool | Purpose |
|---|---|
| `read_file` | Read source file and outcome doc |
| `write_file` | Write the test file |
| `run_tests` | Execute tests and return pass/fail/coverage |

**Output**: Test file at `tests/unit/<filename>.test.ts` + test run summary.

---

## Tools Reference

---

### GitHub Tools

**File**: `packages/agents/src/tools/githubTools.ts`

Built on `@octokit/rest`. All tools require `GITHUB_TOKEN` and `REPO_OWNER`/`REPO_NAME` env vars.

| Tool name | Description | Key inputs |
|---|---|---|
| `create_pull_request` | Opens a PR on GitHub | `title`, `body`, `head` (branch), `base` |
| `add_pr_comment` | Posts a comment on a PR | `pr_number`, `body` |
| `create_github_issue` | Creates a GitHub issue | `title`, `body`, `labels` |
| `list_files_changed` | Lists files changed in a PR | `pr_number` |
| `get_file_from_pr` | Gets file content at PR head SHA | `pr_number`, `path` |

---

### File Tools

**File**: `packages/agents/src/tools/fileTools.ts`

Safe file I/O scoped to the repository root.

| Tool name | Description | Key inputs |
|---|---|---|
| `read_file` | Read a file's content | `path` (relative to repo root) |
| `write_file` | Write content to a file (creates dirs) | `path`, `content` |
| `list_directory` | List files in a directory | `path`, `recursive` |

---

### Test Runner Tools

**File**: `packages/agents/src/tools/testRunnerTools.ts`

| Tool name | Description | Key inputs |
|---|---|---|
| `run_tests` | Run Jest or Vitest for a package | `package` (`backend`\|`frontend`\|`agents`), `test_file` (optional) |

Returns: `{ passed, failed, skipped, coverage, output }`.

---

## Orchestrator

**File**: `packages/agents/src/orchestrator/index.ts`

`runOrchestrator(type, description, context)` coordinates the agent sequence:

1. Assigns a `taskId` (UUID)
2. Initialises shared memory for the task
3. Routes to the correct agent sequence via `router.ts`
4. Passes memory context between agents
5. Returns all `AgentResult[]` objects

**Routing table** (`router.ts`):

| Task type | Agent sequence |
|---|---|
| `product-manager` | PM Agent |
| `code-review` | Code Review Agent |
| `developer` | Developer Agent → Testing Agent |
| `testing` | Testing Agent |

---

## Shared Memory

**File**: `packages/agents/src/shared/memory.ts`

In-process `Map<taskId, AgentMemory>` — sufficient for single-session runs.

```typescript
interface AgentMemory {
  taskId: string;
  taskDescription: string;
  prdPath?: string;
  outcomePath?: string;         // set by PM Agent, read by Developer Agent
  prNumber?: number;            // set by Developer Agent, read by Code Review Agent
  agentHistory: AgentHistoryEntry[];
}
```

Phase 2 upgrade path: replace with Redis or SQLite-backed store for persistent cross-session memory.

---

## Adding a New Agent

1. Create `packages/agents/src/agents/<agentName>.ts` following the tool-use loop pattern
2. Add the agent type to `AgentName` in `shared/types.ts`
3. Add routing in `orchestrator/router.ts`
4. Wire the agent import in `orchestrator/index.ts`
5. Add a section to this file under **Agent Catalog** with Status, Purpose, Trigger, Tools, and Output
6. Update the **Build Status** table below

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for all Claude calls |
| `GITHUB_TOKEN` | Yes (for GitHub tools) | GitHub personal access token or Actions token |
| `REPO_OWNER` | Yes (for GitHub tools) | GitHub username: `mohamedshetarasan-dev` |
| `REPO_NAME` | Yes (for GitHub tools) | Repository name: `release-analytics` |

Copy `.env.example` to `.env` and fill in values. In GitHub Actions, add `ANTHROPIC_API_KEY` as a repository secret.

---

## Build Status

| Agent / Tool | Status | File |
|---|---|---|
| **Tools: GitHub** | ✅ Built | `packages/agents/src/tools/githubTools.ts` |
| **Tools: File** | ✅ Built | `packages/agents/src/tools/fileTools.ts` |
| **Tools: Test Runner** | ✅ Built | `packages/agents/src/tools/testRunnerTools.ts` |
| **PM Agent** | ✅ Built | `packages/agents/src/agents/productManager.ts` |
| **Code Review Agent** | ✅ Built | `packages/agents/src/agents/codeReview.ts` |
| **Developer Agent** | ✅ Built | `packages/agents/src/agents/developer.ts` |
| **Testing Agent** | ✅ Built | `packages/agents/src/agents/testing.ts` |
| **Orchestrator** | ✅ Built | `packages/agents/src/orchestrator/index.ts` |

> This table is updated after each agent is implemented and merged.
