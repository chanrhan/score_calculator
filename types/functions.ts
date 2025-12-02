// /types/functions.ts
// 기능형(Function) 서브 블록 파라미터 타입

export type FunctionKind =
  | 'apply_subject'
  | 'apply_term'
  | 'top_subject'
  | 'score_map'
  | 'grade_ratio'
  | 'subject_group_ratio'
  | 'separation_ratio'
  | 'multiply_ratio'
  | 'formula';

/** 1) ApplySubject */
export type ApplySubjectParams = {
  mode: 'include' | 'exclude';
  groups?: string[]; // 교과군/분류명 등
  organizationNames?: string[]; // 과목 명칭 배열
};

/** 2) ApplyTerm */
export type ApplyTermParams = {
  terms: Array<{ grade: 1 | 2 | 3; term: 1 | 2; enabled: boolean }>;
  topTerms?: number; // 우수학기 N
  sortExpr?: string; // DSL (옵션)
};

/** 3) TopSubject */
export type TopSubjectParams = {
  N: number;
  mode: 'perGroup' | 'overall';
  groupBy?: 'organizationName' | 'subjectSeparationCode' | 'custom';
  customKeyExpr?: string; // groupBy='custom' 일 때 DSL
  sortExpr?: string; // DSL (옵션)
};

/** 4) ScoreMap */
export type ScoreMapParams = {
  inputType: 'original' | 'rankingGrade' | 'percentile' | 'customExpr';
  match: 'exact' | 'range_inclusive' | 'linear';
  table: any; // 프론트에서는 zod로 엄격 검증
  outOfRange: 'clip' | 'error';
  customExpr?: string; // inputType='customExpr' 일 때
};

/** 5) GradeRatio */
export type GradeRatioParams = { g1: number; g2: number; g3: number };

/** 6) SubjectGroupRatio */
export type SubjectGroupRatioRow = { groups: string[]; ratio: number };
export type SubjectGroupRatioParams = { rows: SubjectGroupRatioRow[] };

/** 7) SeparationRatio */
export type SeparationRatioParams = { general: number; career: number; arts: number };

/** 8) MultiplyRatio */
export type MultiplyRatioParams = { ratio: number };

/** 9) Formula */
export type FormulaParams = {
  dsl: string;
  /** 기본: 'score.final' */
  target?:
    | 'score.final'
    | 'score.weighted'
    | 'score.converted'
    | `metrics.${string}`;
};

/** 통합 유니온 */
export type FunctionParams =
  | { kind: 'apply_subject'; params: ApplySubjectParams }
  | { kind: 'apply_term'; params: ApplyTermParams }
  | { kind: 'top_subject'; params: TopSubjectParams }
  | { kind: 'score_map'; params: ScoreMapParams }
  | { kind: 'grade_ratio'; params: GradeRatioParams }
  | { kind: 'subject_group_ratio'; params: SubjectGroupRatioParams }
  | { kind: 'separation_ratio'; params: SeparationRatioParams }
  | { kind: 'multiply_ratio'; params: MultiplyRatioParams }
  | { kind: 'formula'; params: FormulaParams };
