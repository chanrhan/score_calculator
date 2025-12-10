// lib/data/token-menus.ts
// token_menu 데이터 상수 정의
// 이 파일은 scripts/export-token-menu-data.ts 스크립트로 자동 생성됩니다.

export interface TokenMenuItem {
  label: string
  value: string
  scope?: number // 0: 과목, 1: 학생, 2: 상관없음(기본값)
}

export interface TokenMenu {
  key: string
  name: string
  items: TokenMenuItem[]
}

export const APPLICANT_SC_CODE_MENU: TokenMenu = {
  key: 'applicant_sc_code',
  name: '지원자 유형',
  items: [
    { label: '재학생', value: '1' },
    { label: '졸업생', value: '2' },
  ]
} as const

export const CALCULATION_SCOPE_MENU: TokenMenu = {
  key: 'calculation_scope',
  name: '계산 범위',
  items: [
    { label: '학생', value: '0' },
    { label: '과목별', value: '1' },
    { label: '교과군별', value: '2' },
  ]
} as const

export const COMPARE_OPTION_MENU: TokenMenu = {
  key: 'compare_option',
  name: '비교옵션',
  items: [
    { label: '일치', value: '0' },
    { label: '이하', value: '1' },
    { label: '미만', value: '2' },
    { label: '이상', value: '3' },
    { label: '초과', value: '4' },
  ]
} as const

export const DECIMAL_OPTION_MENU: TokenMenu = {
  key: 'decimal_option',
  name: '소수점 처리 유형',
  items: [
    { label: '반올림', value: '0' },
    { label: '올림', value: '1' },
    { label: '내림', value: '2' },
    { label: '절사', value: '3' },
  ]
} as const

export const DIVISION_TYPE_MENU: TokenMenu = {
  key: 'division_type',
  name: '구분 유형',
  items: [
    { label: '졸업년도', value: 'graduateYear' },
    { label: '졸업학년', value: 'graduateGrade' },
    { label: '교과군', value: 'subjectGroup' },
    { label: '모집전형', value: 'admissionCode' },
    { label: '모집단위', value: 'majorCode' },
    { label: '지원자 유형', value: 'applicantScCode' },
    { label: '과목구분', value: 'subjectSeparationCode' },
    { label: '교과군별 이수단위 합', value: 'subjectGroupUnitSum' },
    { label: '필터링된 블록 ID', value: 'filtered_block_id' },
  ]
} as const

export const EXTENDED_SCORE_TYPE_MENU: TokenMenu = {
  key: 'extended_score_type',
  name: '점수 유형(확장)',
  items: [
    { label: '원점수', value: 'originalScore', scope: 0 }, // 과목
    { label: '석차등급', value: 'rankingGrade', scope: 0 }, // 과목
    { label: '성취도등급', value: 'achievement', scope: 0 }, // 과목
    { label: '평어등급', value: 'assessment', scope: 0 }, // 과목
    { label: '기준점수', value: 'score', scope: 0 }, // 과목
    { label: '최종점수', value: 'finalScore', scope: 2 }, // 상관없음
  ]
} as const

export const GRADE_MENU: TokenMenu = {
  key: 'grade',
  name: '학년',
  items: [
    { label: '1학년', value: '1' },
    { label: '2학년', value: '2' },
    { label: '3학년', value: '3' },
  ]
} as const

export const INCLUDE_EXCLUDE_MENU: TokenMenu = {
  key: 'include_option',
  name: '포함 여부',
  items: [
    { label: '포함', value: '0' },
    { label: '제외', value: '1' },
  ]
} as const

export const LOGICAL_OPERATOR_MENU: TokenMenu = {
  key: 'logical_operator',
  name: '논리 연산자',
  items: [
    { label: '그리고', value: '&&' },
    { label: '또는', value: '||' },
  ]
} as const

export const MATCH_OPTION_MENU: TokenMenu = {
  key: 'match_option',
  name: '매칭 옵션',
  items: [
    { label: '일치', value: '0' },
    { label: '범위', value: '1' },
  ]
} as const

export const OPERATOR_MENU: TokenMenu = {
  key: 'operator',
  name: '연산자',
  items: [
    { label: '보다 큼', value: '>' },
    { label: '보다 크거나 같음', value: '>=' },
    { label: '같음', value: '==' },
    { label: '보다 작거나 같음', value: '<=' },
    { label: '보다 작음', value: '<' },
    { label: '값이 존재함', value: 'exists' },
    { label: '값이 존재하지 않음', value: 'not_exists' },
  ]
} as const

export const ORDER_MENU: TokenMenu = {
  key: 'order',
  name: '정렬',
  items: [
    { label: '🔼', value: '0' },
    { label: '🔽', value: '1' },
  ]
} as const

export const SCORE_TYPE_MENU: TokenMenu = {
  key: 'score_type',
  name: '점수 유형',
  items: [
    { label: '원점수', value: 'originalScore', scope: 0 }, // 과목
    { label: '석차등급', value: 'rankingGrade', scope: 0 }, // 과목
    { label: '성취도등급', value: 'achievement', scope: 0 }, // 과목
    { label: '평어등급', value: 'assessment', scope: 0 }, // 과목
    { label: '기준점수', value: 'score', scope: 0 }, // 과목,
    {label: '최종점수', value: 'finalScore', scope: 1 }, // 과목,
  ]
} as const

export const SCOREMAP_OPTION_MENU: TokenMenu = {
  key: 'scoremap_option',
  name: '배점표 옵션',
  items: [
    { label: '옵션없음', value: '0' },
    { label: '일치하지 않으면 제외', value: '1' },
  ]
} as const

export const SUBJECT_SEPARATION_CODE_MENU: TokenMenu = {
  key: 'subject_separation_code',
  name: '과목 구분 코드',
  items: [
    { label: '공통/일반선택교과', value: '01' },
    { label: '진로선택과목', value: '02' },
    { label: '예체능/전문교과', value: '03' },
    { label: '공통교과', value: '00' },
    { label: '모두', value: '*' },
  ]
} as const

export const TOPSUBJECT_OPTION_MENU: TokenMenu = {
  key: 'topsubject_option',
  name: '우수과목 옵션',
  items: [
    { label: '교과군별', value: '0' },
    { label: '모든 과목 중', value: '1' },
  ]
} as const

export const TOPSUBJECT_ORDER_MENU: TokenMenu = {
  key: 'topsubject_order',
  name: '상위과목 선정기준',
  items: [
    { label: '이수단위', value: 'unit' },
    { label: '최근 학기', value: 'yearterm' },
    { label: '과목명(사전순)', value: 'subjectName' },
  ]
} as const

export const VARIABLE_MENU: TokenMenu = {
  key: 'variable',
  name: '변수',
  items: [
    { label: '원점수', value: 'originalScore', scope: 0 }, // 과목
    { label: '석차등급', value: 'rankingGrade', scope: 0 }, // 과목
    { label: '성취도점수', value: 'achievement', scope: 0 }, // 과목
    { label: '평어점수', value: 'assessment', scope: 0 }, // 과목
    { label: '기준점수', value: 'score', scope: 0 }, // 과목
    { label: '최종점수', value: 'finalScore', scope: 1 }, // 상관없음 (학생/과목 모두)
    { label: '이수단위', value: 'unit', scope: 0 }, // 과목
    { label: '필터링 블록 ID', value: 'filtered_block_id', scope: 0 }, // 과목
    { label: '평균', value: 'avgScore', scope: 0 }, // 학생
    { label: '표준편차', value: 'standardDeviation', scope: 0 }, // 학생
  ]
} as const

export const VAR_SCOPE_MENU: TokenMenu = {
  key: 'var_scope',
  name: '변수 범위',
  items: [
    { label: '과목', value: '0', scope: 2 }, // 상관없음
    { label: '학생', value: '1', scope: 2 }, // 상관없음
  ]
} as const

export const DECIMAL_FUNC_MENU: TokenMenu = {
  key: 'decimal_func',
  name: '소수점 처리 함수',
  items: [
    { label: '반올림', value: '0' },
    { label: '올림', value: '1' },
    { label: '내림', value: '2' },
    { label: '절사', value: '3' },
  ]
} as const

export const SUBJECT_GROUP_MENU: TokenMenu = {
  key: 'subject_group',
  name: '교과군',
  items: [
    { label: '국어', value: '국어' },
    { label: '수학', value: '수학' },
    { label: '영어', value: '영어' },
    { label: '사회', value: '사회' },
    { label: '과학', value: '과학' },
    { label: '한국사', value: '한국사' },
    { label: '체육', value: '체육' },
  ]
} as const

export const AGGREGATION_FUNC_MENU: TokenMenu = {
  key: 'aggregation_func',
  name: '집계 함수',
  items: [
    { label: '이수단위 가중평균', value: '0' },
    { label: '평균', value: '1' },
    { label: '과목 개수', value: '2' },
    { label: '합', value: '3' },
  ]
} as const

// 모든 메뉴를 키로 접근할 수 있는 객체
export const TOKEN_MENUS = {
  applicant_sc_code: APPLICANT_SC_CODE_MENU,
  calculation_scope: CALCULATION_SCOPE_MENU,
  compare_option: COMPARE_OPTION_MENU,
  decimal_option: DECIMAL_OPTION_MENU,
  division_type: DIVISION_TYPE_MENU,
  extended_score_type: EXTENDED_SCORE_TYPE_MENU,
  grade: GRADE_MENU,
  include_option: INCLUDE_EXCLUDE_MENU,
  logical_operator: LOGICAL_OPERATOR_MENU,
  match_option: MATCH_OPTION_MENU,
  operator: OPERATOR_MENU,
  order: ORDER_MENU,
  score_type: SCORE_TYPE_MENU,
  scoremap_option: SCOREMAP_OPTION_MENU,
  subject_separation_code: SUBJECT_SEPARATION_CODE_MENU,
  topsubject_option: TOPSUBJECT_OPTION_MENU,
  topsubject_order: TOPSUBJECT_ORDER_MENU,
  variable: VARIABLE_MENU,
  var_scope: VAR_SCOPE_MENU,
  decimal_func: DECIMAL_FUNC_MENU,
  subject_group: SUBJECT_GROUP_MENU,
  aggregation_func: AGGREGATION_FUNC_MENU,
} as const

// 키로 메뉴를 찾는 헬퍼 함수
export function getTokenMenu(key: string): TokenMenu | undefined {
  return TOKEN_MENUS[key as keyof typeof TOKEN_MENUS]
}

// 각 메뉴의 key를 상수로 export
export const TOKEN_MENU_KEYS = {
  APPLICANT_SC_CODE: APPLICANT_SC_CODE_MENU.key,
  CALCULATION_SCOPE: CALCULATION_SCOPE_MENU.key,
  COMPARE_OPTION: COMPARE_OPTION_MENU.key,
  DECIMAL_OPTION: DECIMAL_OPTION_MENU.key,
  DIVISION_TYPE: DIVISION_TYPE_MENU.key,
  EXTENDED_SCORE_TYPE: EXTENDED_SCORE_TYPE_MENU.key,
  GRADE: GRADE_MENU.key,
  INCLUDE_EXCLUDE: INCLUDE_EXCLUDE_MENU.key,
  LOGICAL_OPERATOR: LOGICAL_OPERATOR_MENU.key,
  MATCH_OPTION: MATCH_OPTION_MENU.key,
  OPERATOR: OPERATOR_MENU.key,
  ORDER: ORDER_MENU.key,
  SCORE_TYPE: SCORE_TYPE_MENU.key,
  SCOREMAP_OPTION: SCOREMAP_OPTION_MENU.key,
  SUBJECT_SEPARATION_CODE: SUBJECT_SEPARATION_CODE_MENU.key,
  TOPSUBJECT_OPTION: TOPSUBJECT_OPTION_MENU.key,
  TOPSUBJECT_ORDER: TOPSUBJECT_ORDER_MENU.key,
  VARIABLE: VARIABLE_MENU.key,
  VAR_SCOPE: VAR_SCOPE_MENU.key,
  DECIMAL_FUNC: DECIMAL_FUNC_MENU.key,
  SUBJECT_GROUP: SUBJECT_GROUP_MENU.key,
  AGGREGATION_FUNC: AGGREGATION_FUNC_MENU.key,
} as const

// 모든 메뉴 배열
export const ALL_TOKEN_MENUS: readonly TokenMenu[] = [
  APPLICANT_SC_CODE_MENU,
  CALCULATION_SCOPE_MENU,
  COMPARE_OPTION_MENU,
  DECIMAL_OPTION_MENU,
  DIVISION_TYPE_MENU,
  EXTENDED_SCORE_TYPE_MENU,
  GRADE_MENU,
  INCLUDE_EXCLUDE_MENU,
  LOGICAL_OPERATOR_MENU,
  MATCH_OPTION_MENU,
  OPERATOR_MENU,
  ORDER_MENU,
  SCORE_TYPE_MENU,
  SCOREMAP_OPTION_MENU,
  SUBJECT_SEPARATION_CODE_MENU,
  TOPSUBJECT_OPTION_MENU,
  TOPSUBJECT_ORDER_MENU,
  VARIABLE_MENU,
  VAR_SCOPE_MENU,
  DECIMAL_FUNC_MENU,
  SUBJECT_GROUP_MENU,
  AGGREGATION_FUNC_MENU,
] as const
