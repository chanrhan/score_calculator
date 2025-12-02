// /lib/utils/csv.ts
import type { BatchResult } from '@/types/domain';

const esc = (v: any) => {
  if (v == null) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

export function resultsToCSV(results: BatchResult[], headers?: Record<string, (row: BatchResult) => any>): string {
  const cols: Array<[string, (row: BatchResult) => any]> = headers
    ? Object.entries(headers)
    : [
        ['studentId', r => r.studentId],
        ['finalScore', r => r.finalScore],
        ['rank', r => r.rank],
        ['tieBreaker', r => JSON.stringify(r.tieBreaker ?? {})],
      ];

  const head = cols.map(([h]) => esc(h)).join(',');
  const lines = results.map(r => cols.map(([_, f]) => esc(f(r))).join(','));
  return [head, ...lines].join('\n');
}
