export type AgentName = 'product-manager' | 'developer' | 'code-review' | 'testing';

export interface AgentTask {
  id: string;
  type: AgentName;
  description: string;
  context?: Record<string, unknown>;
}

export interface AgentResult {
  taskId: string;
  agent: AgentName;
  success: boolean;
  output: string;
  toolsUsed: string[];
  error?: string;
}

export interface AgentMemory {
  taskId: string;
  taskDescription: string;
  prdPath?: string;
  outcomePath?: string;
  prNumber?: number;
  agentHistory: Array<{ agent: AgentName; result: AgentResult; timestamp: number }>;
}

export interface TestSummary {
  passed: number;
  failed: number;
  skipped: number;
  coverage?: number;
}
