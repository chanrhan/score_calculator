import { create } from 'zustand';

export type PipelineVariable = {
  univ_id: string;
  pipeline_id: number;
  variable_name: string;
};

type PipelineVariablesState = {
  variablesByName: Map<string, PipelineVariable>;
  currentKey?: { univId: string; pipelineId: number };
  load: (univId: string, pipelineId: number) => Promise<void>;
  create: (univId: string, pipelineId: number, name: string) => Promise<{ success: boolean; error?: string }>;
  clear: () => void;
};

export const usePipelineVariables = create<PipelineVariablesState>()((set, get) => ({
  variablesByName: new Map<string, PipelineVariable>(),
  currentKey: undefined,
  async load(univId, pipelineId) {
    const res = await fetch(`/api/pipeline-variables?universityId=${encodeURIComponent(univId)}&pipelineId=${pipelineId}`);
    if (!res.ok) {
      set({ variablesByName: new Map(), currentKey: undefined });
      return;
    }
    const data = await res.json();
    const map = new Map<string, PipelineVariable>();
    (data.data as PipelineVariable[]).forEach(v => map.set(v.variable_name, v));
    set({ variablesByName: map, currentKey: { univId, pipelineId } });
  },
  async create(univId, pipelineId, name) {
    const res = await fetch('/api/pipeline-variables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ universityId: univId, pipelineId, name }),
    });
    if (!res.ok) {
      const msg = await res.json().catch(() => ({} as any));
      return { success: false, error: msg?.message || 'failed' };
    }
    await get().load(univId, pipelineId);
    return { success: true };
  },
  clear() {
    set({ variablesByName: new Map(), currentKey: undefined });
  },
}));


