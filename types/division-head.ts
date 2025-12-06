// types/division-head.ts
// 구분 헤드(Division Head) 타입 정의

/**
 * 구분 헤드 헤더 셀 구조
 * 각 셀은 { division_type: "값" } 형태
 */
export type DivisionHeadHeader = Array<{
  division_type: string;
}>;

/**
 * 구분 헤드 바디 셀 구조
 * 2차원 배열: 외부 배열은 행(row), 내부 배열은 열(column)
 * 각 셀은 key-value 형태의 객체 (완전히 동적)
 */
export type DivisionHeadBody = Array<Array<Record<string, any>>>;

/**
 * 구분 헤드 데이터 구조
 */
export interface DivisionHeadData {
  header: DivisionHeadHeader;
  body: DivisionHeadBody;
  isActive: boolean;
}

/**
 * 셀 병합 정보
 */
export interface CellMergeInfo {
  rowspan: number;
  colspan: number;
}

