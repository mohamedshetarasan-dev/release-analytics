import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { runToolLoop } from '../shared/toolLoop';
import { fileToolDefinitions, executeTool as execFileTool } from '../tools/fileTools';
import { githubToolDefinitions, executeTool as execGithubTool } from '../tools/githubTools';
import type { AgentTask, AgentResult } from '../shared/types';

const ALLOWED_TOOLS = ['read_file', 'write_file', 'list_directory', 'create_github_issue'];

const SYSTEM_PROMPT = `You are a Product Manager for the Release Analytics project — a tool that tracks Azure DevOps release metrics.

Your job is to write complete, well-structured outcome documents following the project's 18-section template exactly.

## Outcome Template (18 sections — all required unless marked optional)
1. Outcome Title — short, clear name
2. Problem Definition — what issue exists, who is affected, what is the impact
3. Scope of Implementation — [x] New Feature | [x] Enhancement | [x] Removal
4. Trigger — event or user action that activates the outcome
5. Success Matrices — measurable, trackable indicators (business impact, user behavior, system performance)
6. Description — what the system should achieve; high-level behavior and key rules; intent not implementation
7. Acceptance Criteria / Scenarios — testable success conditions
8. In Scope — included capabilities and supported flows
9. Out of Scope *(optional)* — excluded items
10. Edge Cases / Failure Modes *(optional)* — uncommon scenarios
11. Impacted Areas — systems, services, user journeys
12. Constraints — Business Constraints + Technical Constraints
13. Assumptions *(optional)* — expected conditions
14. Suggested Slices *(optional)* — ordered by value for incremental delivery
15. Figma Design Link *(optional)* — UI/prototype reference
16. Translations *(optional)* — user-facing text, data dictionary
17. AI Inquiries — questions raised by AI about unclear areas. RULE: Must be resolved before execution begins.
18. Dependencies / Links — related outcomes, tickets, external dependencies

## Project Context
- Stack: Node.js + Express (backend), React + TypeScript (frontend), SQLite (DB)
- Data source: Azure DevOps CSV export with columns: ID, Work Item Type, Parent, Title, Assigned To, State, Tags, Release Version, Created Date, Activated Date, Resolved Date, Closed Date, Iteration Path, Original Estimate, Completed Work, Story Points
- Key metrics: bug count per release, avg bug resolution time, planned vs actual effort, release duration
- Outcomes are saved to: docs/outcomes/<feature-slug>.md
- Existing outcomes are in docs/outcomes/ — read them for style and context

## Rules
- Always read existing outcome files first to match the style
- Populate AI Inquiries with real, specific questions about unclear requirements
- Save the outcome document, then create a GitHub issue to track it
- File naming: lowercase, hyphens, no spaces (e.g. "bug-count-analytics.md")
`;

export async function runProductManagerAgent(task: AgentTask): Promise<AgentResult> {
  const feature = (task.context?.feature as string) ?? task.description;
  const slug = feature.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const outcomePath = `docs/outcomes/${slug}.md`;

  const tools: Anthropic.Tool[] = [
    ...fileToolDefinitions,
    ...githubToolDefinitions,
  ].filter((t) => ALLOWED_TOOLS.includes(t.name)) as Anthropic.Tool[];

  const toolHandlers = [
    ...fileToolDefinitions.map((t) => ({
      name: t.name,
      execute: (input: Record<string, unknown>) => execFileTool(t.name, input),
    })),
    ...githubToolDefinitions
      .filter((t) => t.name === 'create_github_issue')
      .map((t) => ({
        name: t.name,
        execute: (input: Record<string, unknown>) => execGithubTool(t.name, input),
      })),
  ];

  const userMessage = `Write a complete outcome document for the feature: "${feature}".

Steps:
1. Read docs/outcomes/ to understand the existing style and context
2. Read docs/PRD.md for project context
3. Write the outcome document to: ${outcomePath}
4. Create a GitHub issue titled "Outcome: ${feature}" with label "outcome" and link it in the Dependencies section
5. Return a summary of the outcome and the AI Inquiries that need resolution

The output file must follow the 18-section template exactly. Do not skip any required section.`;

  const result = await runToolLoop({
    agentName: 'product-manager',
    taskId: task.id,
    systemPrompt: SYSTEM_PROMPT,
    userMessage,
    tools,
    toolHandlers,
  });

  return { ...result, output: `Outcome written to ${outcomePath}\n\n${result.output}` };
}
