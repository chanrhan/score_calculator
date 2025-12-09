// Context와 Subject의 사용 가능한 속성 정의
// 명세서: docs/calculation-context-structure.md

export interface ScopeAttribute {
  key: string;
  label: string;
}

// Context (학생) 속성 목록
export const CONTEXT_ATTRIBUTES: ScopeAttribute[] = [
  { key: 'admissionCode', label: '전형 코드' },
  { key: 'majorCode', label: '단위 코드' },
  { key: 'graduateYear', label: '졸업년도' },
  { key: 'graduateGrade', label: '졸업학년' },
  { key: 'applicantScCode', label: '지원자 유형' },
  { key: 'finalScore', label: '최종점수' },
];

// Subject (과목) 속성 목록
export const SUBJECT_ATTRIBUTES: ScopeAttribute[] = [
  { key: 'grade', label: '이수 학년' },
  { key: 'term', label: '이수 학기' },
  { key: 'unit', label: '이수 학점' },
  { key: 'organizationCode', label: '편제코드' },
  { key: 'subjectGroup', label: '교과군' },
  { key: 'subjectName', label: '과목명' },
  { key: 'assessment', label: '평어점수' },
  { key: 'achievement', label: '성취도점수' },
  { key: 'achievementRatio', label: '성취도비율' },
  { key: 'studentCount', label: '동일 과목 이수 학생 수' },
  { key: 'originalScore', label: '원점수' },
  { key: 'avgScore', label: '평균점수' },
  { key: 'standardDeviation', label: '표준편차' },
  { key: 'rankingGrade', label: '석차등급' },
  { key: 'subjectSeparationCode', label: '과목구분코드' },
  { key: 'filtered_block_id', label: '필터링된 블록 ID' },
];

// scope 값에 따른 속성 목록 가져오기
export function getAttributesByScope(scope: '0' | '1'): ScopeAttribute[] {
  return scope === '0' ? CONTEXT_ATTRIBUTES : SUBJECT_ATTRIBUTES;
}

// 속성 키로 레이블 찾기
export function getAttributeLabel(key: string, scope: '0' | '1'): string | undefined {
  const attributes = getAttributesByScope(scope);
  return attributes.find(attr => attr.key === key)?.label;
}

