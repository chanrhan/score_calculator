import type { Subject } from '@/types/domain';

export type SubjectFilters = {
  subjectSeparationCode?: string[]; // 과목구분 코드
  grade?: number[];                 // 학년
  term?: number[];                  // 학기
  reflected?: ('반영' | '필터')[];  // 반영여부
};

export function filterSubjects(
  subjects: Subject[],
  filters: SubjectFilters = {},
  search: string = ''
): Subject[] {
  if (!subjects || subjects.length === 0) return [];

  const searchLower = (search || '').trim().toLowerCase();
  const hasSearch = searchLower.length > 0;

  return subjects.filter((s) => {
    // 검색: 과목명 부분 일치 (대소문자 무시)
    if (hasSearch) {
      const name = (s.subjectName || '').toLowerCase();
      if (!name.includes(searchLower)) return false;
    }

    // 과목구분 (코드 매칭)
    if (filters.subjectSeparationCode && filters.subjectSeparationCode.length > 0) {
      if (!filters.subjectSeparationCode.includes(s.subjectSeparationCode)) return false;
    }

    // 학년
    if (filters.grade && filters.grade.length > 0) {
      const gradeVal = Number(s.grade ?? NaN);
      if (!filters.grade.includes(gradeVal)) return false;
    }

    // 학기
    if (filters.term && filters.term.length > 0) {
      const termVal = Number(s.term ?? NaN);
      if (!filters.term.includes(termVal)) return false;
    }

    // 반영여부
    if (filters.reflected && filters.reflected.length > 0) {
      const isReflected = (s.filtered_block_id === 0) ? '반영' : '필터';
      if (!filters.reflected.includes(isReflected)) return false;
    }

    return true;
  });
}

export function getSubjectFilterOptions(subjects: Subject[]) {
  const separationCodes = new Set<string>();
  const grades = new Set<number>();
  const terms = new Set<number>();
  let hasReflected = false;
  let hasFiltered = false;

  subjects.forEach((s) => {
    if (s.subjectSeparationCode) separationCodes.add(s.subjectSeparationCode);
    if (typeof s.grade === 'number') grades.add(s.grade);
    if (typeof s.term === 'number') terms.add(s.term);
    if (s.filtered_block_id === 0) hasReflected = true; else hasFiltered = true;
  });

  return {
    subjectSeparationCodes: Array.from(separationCodes).sort((a, b) => a.localeCompare(b)),
    grade: Array.from(grades).sort((a, b) => a - b),
    term: Array.from(terms).sort((a, b) => a - b),
    reflected: [
      ...(hasReflected ? ['반영'] as const : []),
      ...(hasFiltered ? ['필터'] as const : []),
    ],
  };
}


