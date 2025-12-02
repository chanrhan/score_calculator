// /store/useBatches.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Batch, BatchResult, StudentWithSubjects, Pipeline, Context,
} from '@/types/domain';
import { nanoid } from '@/lib/utils/id';
import { now } from '@/lib/utils/time';
// import { runPipeline } from '@/lib/engine'; // 삭제된 파일
import { hashJSON } from '@/lib/utils/hashing';

type BatchesState = {
  batches: Batch[];
  getById: (id: string) => Batch | undefined;
  createBatch: (pipelineId: string, studentIds: string[]) => Batch;
  removeBatch: (batchId: string) => void;
  runBatch: (batchId: string, pipeline: Pipeline, students: StudentWithSubjects[], options?: {
    auditLevel?: 'none'|'summary'|'full';
  }) => Promise<Batch>;
  exportJSON: () => Batch[];
  importJSON: (raw: any) => void;
};

const LS_KEY = 'gpb:batches';

function buildContext(row: StudentWithSubjects): Context {
  return {
    student: {
      admission: row.student.admission,
      major: row.student.major,
      graduateYear: row.student.graduateYear,
      applicantScCode: row.student.applicantScCode,
      identifyNumber: row.student.identifyNumber,
    },
    subjects: row.subjects.map(s => JSON.parse(JSON.stringify(s))),
    metrics: {},
    vars: { pipeline: {}, components: {} },
  };
}

function computeTieBreaker(ctx: Context): { std_weight: number; credit_sum: number; name_key: string } {
  // 간단 합산: 표준편차 합, 이수단위 합, 식별키
  const std_weight = (ctx.subjects ?? []).reduce((a, s) => a + (s.standardDeviation ?? 0), 0);
  const credit_sum = (ctx.subjects ?? []).reduce((a, s) => a + (s.credit ?? 0), 0);
  const name_key = ctx.student.identifyNumber ?? '';
  return { std_weight, credit_sum, name_key };
}

function rankWithTies(rows: Array<{ studentId: string; finalScore: number; tie: { std_weight: number; credit_sum: number; name_key: string } }>): BatchResult[] {
  // 정렬: finalScore DESC, std_weight DESC, credit_sum DESC, name_key ASC
  const sorted = rows.slice().sort((a, b) => {
    if (a.finalScore !== b.finalScore) return b.finalScore - a.finalScore;
    if (a.tie.std_weight !== b.tie.std_weight) return b.tie.std_weight - a.tie.std_weight;
    if (a.tie.credit_sum !== b.tie.credit_sum) return b.tie.credit_sum - a.tie.credit_sum;
    return a.tie.name_key.localeCompare(b.tie.name_key);
  });

  // 랭크(동점 허용: finalScore 기준으로만 동순위)
  let lastScore: number | null = null;
  let lastRank = 0;
  return sorted.map((row, idx) => {
    const rank = lastScore !== null && Math.abs(row.finalScore - lastScore) < 1e-9 ? lastRank : idx + 1;
    lastScore = row.finalScore;
    lastRank = rank;
    return {
      studentId: row.studentId,
      finalScore: row.finalScore,
      rank,
      tieBreaker: row.tie,
    };
  });
}

export const useBatches = create<BatchesState>()(
  persist(
    (set, get) => ({
      batches: [],

      getById: (id) => get().batches.find(b => b.id === id),

      createBatch: (pipelineId, studentIds) => {
        const batch: Batch = {
          id: nanoid(),
          pipelineId,
          status: 'running',
          startedAt: now(),
          items: studentIds.map(sid => ({
            id: nanoid(),
            studentId: sid,
            status: 'running',
            startedAt: now(),
            audit: [],
          })),
        };
        set(state => ({ batches: [...state.batches, batch] }));
        return batch;
      },

      removeBatch: (batchId) => {
        set(state => ({ batches: state.batches.filter(b => b.id !== batchId) }));
      },

      runBatch: async (batchId, pipeline, students, options) => {
        const st = get();
        const batch = st.batches.find(b => b.id === batchId);
        if (!batch) throw new Error('Batch not found');

        // 인덱스 맵
        const studentMap = new Map(students.map(s => [s.student.id, s]));
        const itemMap = new Map(batch.items.map(i => [i.id, i]));

        // 실행 루프(순차)
        for (const item of batch.items) {
          const row = studentMap.get(item.studentId);
          if (!row) {
            // 누락된 학생
            item.status = 'failed';
            item.error = 'Student not found';
            item.finishedAt = now();
            continue;
          }
          // 감사 push 함수: item.audit에 직접 기록
          const pushAudit = (entry: any) => {
            item.audit.push(entry);
          };

          try {
            const baseCtx = buildContext(row);
            // TODO: 새로운 성적 계산 엔진으로 교체 필요
            // const { ctx, finalScore } = await runPipeline(pipeline, baseCtx, {
            //   auditLevel: options?.auditLevel ?? 'summary',
            //   pushAudit,
            //   // componentId: 0,
            // });
            
            // 임시 처리: 에러 발생
            throw new Error('runPipeline이 삭제되었습니다. 새로운 성적 계산 엔진을 구현해야 합니다.');

            // TODO: 새로운 엔진에서 반환되는 값으로 교체
            // item.finalScore = finalScore;
            // item.metrics = ctx.metrics;
            // item.vars = ctx.vars;
            // item.ctxHash = hashJSON(ctx);
            item.status = 'succeeded';
            item.finishedAt = now();
          } catch (e: any) {
            item.status = 'failed';
            item.error = e?.message ?? String(e);
            item.finishedAt = now();
          }

          // 매 아이템마다 setState 커밋(간단 구현)
          set(state => ({
            batches: state.batches.map(b => (b.id === batchId ? { ...batch } : b)),
          }));
        }

        // 정렬/랭크 생성
        const succeeded = batch.items.filter(i => i.status === 'succeeded');
        const rows = succeeded.map(i => {
          // tie breaker: ctx.metrics 우선 사용, 없으면 간이 계산
          const row = studentMap.get(i.studentId)!;
          const ctx: Context = buildContext(row);
          // metrics가 담긴 item 자체의 ctx는 저장할 때 이미 hash만 저장했음.
          // tie가 metrics에 있다면 그것을 우선 사용
          const tie = {
            std_weight:
              (i.metrics?.['std_weight'] as number) ??
              computeTieBreaker(ctx).std_weight,
            credit_sum:
              (i.metrics?.['credit_sum'] as number) ??
              computeTieBreaker(ctx).credit_sum,
            name_key:
              (i.metrics?.['name_key'] as string) ??
              computeTieBreaker(ctx).name_key,
          };
          return { studentId: i.studentId, finalScore: i.finalScore ?? 0, tie };
        });

        const results: BatchResult[] = rankWithTies(rows);
        batch.results = results;
        batch.status = batch.items.some(i => i.status === 'failed') ? 'failed' : 'succeeded';
        batch.finishedAt = now();

        set(state => ({
          batches: state.batches.map(b => (b.id === batchId ? { ...batch } : b)),
        }));

        return batch;
      },

      exportJSON: () => get().batches,

      importJSON: (raw: any) => {
        if (!Array.isArray(raw)) throw new Error('batches JSON must be an array');
        set({ batches: raw as Batch[] });
      },
    }),
    {
      name: LS_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);
