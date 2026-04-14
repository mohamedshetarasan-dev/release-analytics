# Release Analytics

A release health metrics dashboard that ingests Azure DevOps exports (CSV/XLSX) and presents interactive charts for bug counts, resolution time, effort variance, and release duration.

## Packages

| Package | Description |
|---|---|
| `packages/frontend` | React + TypeScript + Vite dashboard |
| `packages/backend` | Node.js + Express REST API |
| `packages/agents` | Anthropic multi-agent system (PM, Dev, Code Review, Testing) |

## Quick Start

```bash
# Install dependencies
npm install

# Start all packages in dev mode
npm run dev

# Run all tests
npm test

# Build all packages
npm run build
```

## Documentation

| Document | Description |
|---|---|
| [PRD](docs/PRD.md) | Product Requirements Document |
| [Development Plan](docs/development-plan.md) | Architecture and phases |
| [Outcomes](docs/outcomes/) | Individual feature outcome documents |

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Recharts, Zustand, React Query
- **Backend**: Node.js, Express, TypeScript, Drizzle ORM, SQLite, SheetJS
- **Agents**: Anthropic Claude SDK (`claude-sonnet-4-6`), Octokit
- **Monorepo**: npm workspaces + Turborepo
- **CI/CD**: GitHub Actions

## Development Workflow

All changes go through Pull Requests — no direct commits to `main`.

1. Create a feature branch
2. Open a PR → Code Review Agent automatically posts a review
3. Address feedback, ensure CI passes
4. Merge after human approval

## Environment Setup

```bash
cp .env.example .env
# Fill in ANTHROPIC_API_KEY and GITHUB_TOKEN
```

## Project Status

- [x] Phase 0 — Foundation (repository, monorepo, docs)
- [ ] Phase 1 — Backend Core
- [ ] Phase 2 — Frontend Core
- [ ] Phase 3 — Multi-Agent System
- [ ] Phase 4 — Polish
- [ ] Phase 5 — Azure DevOps API Integration
