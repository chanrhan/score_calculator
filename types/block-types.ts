// types/block-types.ts
// Block Type 상수 정의 (간단한 객체 상수 방식)

export const BLOCK_TYPE = {
  DIVISION: 1,                    // 구분 블록
  APPLY_SUBJECT: 2,               // 반영교과 블록
  GRADE_RATIO: 3,                 // 학년별 반영비율 블록
  APPLY_TERM: 4,                  // 반영학기 블록
  TOP_SUBJECT: 5,                  // 우수 N 과목 블록
  SUBJECT_GROUP_RATIO: 6,          // 교과군별 반영비율 블록
  SEPARATION_RATIO: 7,             // 과목구분별 반영비율 블록
  SCORE_MAP: 8,                    // 배점표 블록
  FORMULA: 9,                      // 수식 블록
  VARIABLE: 10,                    // 변수 블록
  CONDITION: 11,                   // 조건 블록
  AGGREGATION: 12,                 // 집계 블록,
  RATIO: 13,                       // 비율 블록
  DECIMAL: 14,                     // 소수점 처리 블록
} as const;

export const BLOCK_TYPE_MAP = {
  [BLOCK_TYPE.DIVISION]: '구분',
  [BLOCK_TYPE.APPLY_SUBJECT]: '반영교과',
  [BLOCK_TYPE.GRADE_RATIO]: '학년별 반영비율',
  [BLOCK_TYPE.APPLY_TERM]: '반영학기',
  [BLOCK_TYPE.TOP_SUBJECT]: '우수 N과목',
  [BLOCK_TYPE.SUBJECT_GROUP_RATIO]: '교과군별 반영비율',
  [BLOCK_TYPE.SEPARATION_RATIO]: '과목구분별 반영비율',
  [BLOCK_TYPE.SCORE_MAP]: '배점표',
  [BLOCK_TYPE.FORMULA]: '수식',
  [BLOCK_TYPE.VARIABLE]: '변수',
  [BLOCK_TYPE.CONDITION]: '조건',
  [BLOCK_TYPE.AGGREGATION]: '집계',
  [BLOCK_TYPE.RATIO]: '반영비율',
  [BLOCK_TYPE.DECIMAL]: '소수점 처리',
} as const;

// 타입 정의
export type BlockTypeId = typeof BLOCK_TYPE[keyof typeof BLOCK_TYPE];
