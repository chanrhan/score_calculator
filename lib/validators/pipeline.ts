// /lib/validators/pipeline.ts
import { z } from 'zod';
import { AnyBlockSchema } from './blocks';

// Component
export const ComponentSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  predecessorId: z.number().int().positive().nullable().optional(),
  position: z.number().int().positive(),
  blocks: z.array(AnyBlockSchema).default([]),
});

// Pipeline
export const PipelineSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  isActive: z.boolean(),
  components: z.array(ComponentSchema).min(1),
}).superRefine((val, ctx) => {
  const ids = new Set<number>(val.components.map(c => c.id));
  // predecessor 존재성 체크
  for (const c of val.components) {
    if (c.predecessorId != null && !ids.has(c.predecessorId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `predecessorId ${c.predecessorId}가 존재하지 않습니다.`,
        path: ['components', val.components.indexOf(c), 'predecessorId'],
      });
    }
  }
  // position 유일성
  const posSet = new Set<number>();
  for (const c of val.components) {
    if (posSet.has(c.position)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `position ${c.position}이 중복되었습니다.`,
        path: ['components', val.components.indexOf(c), 'position'],
      });
    }
    posSet.add(c.position);
  }
  // DAG 사이클 체크
  const pred = new Map<number, number | null>();
  for (const c of val.components) pred.set(c.id, c.predecessorId ?? null);

  // DFS로 cycle 검출
  const visiting = new Set<number>();
  const visited = new Set<number>();
  const hasCycle = (id: number): boolean => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    const p = pred.get(id);
    if (p != null) {
      if (!ids.has(p)) {
        // 존재성은 위에서 체크했으므로 통과
      } else if (hasCycle(p)) {
        return true;
      }
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  };

  for (const c of val.components) {
    if (hasCycle(c.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `컴포넌트 그래프에 사이클이 있습니다. (component ${c.id})`,
        path: ['components', val.components.indexOf(c)],
      });
      break;
    }
  }

  // Function 블록 caseId 존재성 (해당 컴포넌트 내 Division 케이스 아이디와의 일치 여부까지는 프론트 v0에선 스킵)
  for (const comp of val.components) {
    for (const b of comp.blocks) {
      if (b.kind === 'function') {
        if (!b.caseId || b.caseId <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'function 블록은 caseId가 필요합니다.',
            path: ['components', val.components.indexOf(comp), 'blocks', comp.blocks.indexOf(b), 'caseId'],
          });
        }
      }
    }
  }
});

// helpers
export function validatePipeline(input: unknown) {
  return PipelineSchema.safeParse(input);
}
export function validateComponents(input: unknown) {
  return z.array(ComponentSchema).safeParse(input);
}
