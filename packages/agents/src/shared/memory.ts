import type { AgentMemory } from './types';

/** In-process memory store keyed by taskId (Phase 1). Replace with Redis/SQLite in Phase 2. */
const store = new Map<string, AgentMemory>();

export const memory = {
  get: (taskId: string): AgentMemory | undefined => store.get(taskId),

  set: (taskId: string, data: AgentMemory): void => { store.set(taskId, data); },

  update: (taskId: string, patch: Partial<AgentMemory>): void => {
    const existing = store.get(taskId);
    if (existing) store.set(taskId, { ...existing, ...patch });
  },

  clear: (taskId: string): void => { store.delete(taskId); },
};
