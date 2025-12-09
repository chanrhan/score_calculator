import { create } from 'zustand';

export type PipelineVariable = {
  univ_id: string;
  pipeline_id: number;
  variable_name: string;
  scope: string; // '0': 과목(Subject), '1': 학생(Student)
};

type PipelineVariablesState = {
  variablesByName: Map<string, PipelineVariable>;
  currentKey?: { univId: string; pipelineId: number };
  load: (univId: string, pipelineId: number, scope?: string) => Promise<void>;
  create: (univId: string, pipelineId: number, name: string, scope?: string) => Promise<{ success: boolean; error?: string }>;
  clear: () => void;
  getByScope: (scope: '0' | '1') => PipelineVariable[];
};

export const usePipelineVariables = create<PipelineVariablesState>()((set, get) => ({
  variablesByName: new Map<string, PipelineVariable>(),
  currentKey: undefined,
  async load(univId, pipelineId, scope) {
    let url = `/api/pipeline-variables?universityId=${encodeURIComponent(univId)}&pipelineId=${pipelineId}`;
    if (scope) {
      url += `&scope=${scope}`;
    }
    const res = await fetch(url);
    if (!res.ok) {
      set({ variablesByName: new Map(), currentKey: undefined });
      return;
    }
    const data = await res.json();
    const map = new Map<string, PipelineVariable>();
    (data.data as PipelineVariable[]).forEach(v => map.set(v.variable_name, v));
    set({ variablesByName: map, currentKey: { univId, pipelineId } });
  },
  async create(univId, pipelineId, name, scope = '0') {
    const res = await fetch('/api/pipeline-variables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ universityId: univId, pipelineId, name, scope }),
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
  getByScope(scope) {
    const variables = Array.from(get().variablesByName.values());
    return variables.filter(v => v.scope === scope);
  },
}));


