// /lib/utils/context.ts
import type { Context } from '@/types/domain';
import type { Subject } from '@/types/domain';

export const deepClone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

export const cloneSubject = (s: Subject): Subject => deepClone(s);

export const replaceSubjects = (ctx: Context, subs: Subject[]): Context => ({
  ...ctx,
  subjects: subs.map(cloneSubject),
});

// 최종 점수 선택 규칙: final → weighted → converted → originalScore
export const getSubjectFinal = (s: Subject): number | undefined =>
  s.score?.final ??
  s.score?.weighted ??
  s.score?.converted ??
  (typeof s.originalScore === 'number' ? s.originalScore : undefined);
