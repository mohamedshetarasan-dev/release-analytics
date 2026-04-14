import Anthropic from '@anthropic-ai/sdk';
import { anthropic, MODEL } from './anthropicClient';
import type { AgentResult, AgentName } from './types';

export interface ToolHandler {
  name: string;
  execute: (input: Record<string, unknown>) => Promise<string> | string;
}

export interface RunAgentOptions {
  agentName: AgentName;
  taskId: string;
  systemPrompt: string;
  userMessage: string;
  tools: Anthropic.Tool[];
  toolHandlers: ToolHandler[];
  maxIterations?: number;
}

/**
 * Standard Anthropic tool-use loop shared by all agents.
 * Runs until stop_reason === 'end_turn' or max iterations reached.
 */
export async function runToolLoop({
  agentName,
  taskId,
  systemPrompt,
  userMessage,
  tools,
  toolHandlers,
  maxIterations = 20,
}: RunAgentOptions): Promise<AgentResult> {
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: userMessage },
  ];

  const toolsUsed: string[] = [];
  let iterations = 0;
  let finalOutput = '';

  while (iterations < maxIterations) {
    iterations++;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8096,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },  // prompt caching
        },
      ],
      tools,
      messages,
    });

    // Collect any text output
    const textBlocks = response.content.filter((b): b is Anthropic.TextBlock => b.type === 'text');
    if (textBlocks.length > 0) {
      finalOutput = textBlocks.map((b) => b.text).join('\n');
    }

    if (response.stop_reason === 'end_turn') {
      break;
    }

    if (response.stop_reason !== 'tool_use') {
      console.warn(`[${agentName}] Unexpected stop_reason: ${response.stop_reason}`);
      break;
    }

    // Process tool calls
    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    );

    // Append assistant message
    messages.push({ role: 'assistant', content: response.content });

    // Execute each tool and collect results
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const toolUse of toolUseBlocks) {
      const handler = toolHandlers.find((h) => h.name === toolUse.name);
      toolsUsed.push(toolUse.name);

      let resultContent: string;
      if (!handler) {
        resultContent = `Error: unknown tool "${toolUse.name}"`;
      } else {
        try {
          console.info(`[${agentName}] Tool call: ${toolUse.name}`);
          resultContent = await handler.execute(toolUse.input as Record<string, unknown>);
        } catch (err) {
          resultContent = `Error executing ${toolUse.name}: ${String(err)}`;
        }
      }

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: resultContent,
      });
    }

    messages.push({ role: 'user', content: toolResults });
  }

  if (iterations >= maxIterations) {
    console.warn(`[${agentName}] Reached max iterations (${maxIterations})`);
  }

  return {
    taskId,
    agent: agentName,
    success: true,
    output: finalOutput,
    toolsUsed,
  };
}
