// /lib/utils/sort.ts
import type { Subject } from '@/types/domain';
import { getSubjectFinal } from './context';

// 타이브레이커: 표준편차 내림 → 이수단위 내림 → 과목명 오름
export const tieBreak = (a: Subject, b: Subject) => {
  const sdA = a.standardDeviation ?? -Infinity;
  const sdB = b.standardDeviation ?? -Infinity;
  if (sdA !== sdB) return sdB - sdA;

  const cA = a.credit ?? 0;
  const cB = b.credit ?? 0;
  if (cA !== cB) return cB - cA;

  return a.subjectName.localeCompare(b.subjectName);
};

export const sortByPreferredScore = (a: Subject, b: Subject) => {
  const av = getSubjectFinal(a) ?? -Infinity;
  const bv = getSubjectFinal(b) ?? -Infinity;
  if (av !== bv) return bv - av; // 내림차순
  return tieBreak(a, b);
};
