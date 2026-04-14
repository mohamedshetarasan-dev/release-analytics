import type { AgentTask, AgentName } from '../shared/types';

/**
 * Determines which agent(s) to invoke for a given task type,
 * and the sequence in which to invoke them.
 */
export function route(task: AgentTask): AgentName[] {
  switch (task.type) {
    case 'product-manager':
      return ['product-manager'];

    case 'developer':
      // Developer writes code → Testing agent verifies
      return ['developer', 'testing'];

    case 'code-review':
      return ['code-review'];

    case 'testing':
      return ['testing'];

    default:
      throw new Error(`Unknown agent task type: ${(task as AgentTask).type}`);
  }
}
