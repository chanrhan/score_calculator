// types/block-data.ts
// block_data와 token_menu 관련 타입 정의

// 그룹 유형 상수
export const GROUP_TYPES = {
  DIVISION: '구분',
  SCORE_CALCULATION: '기준점수 환산',
  SUBJECT_APPLICATION: '반영교과 필터링',
  OTHER: '기타'
} as const;

export type GroupType = typeof GROUP_TYPES[keyof typeof GROUP_TYPES];

// 범용적인 10개 색상 팔레트
export const COLOR_PALETTE = [
  '#ffffff', // 흰색
  '#f3f4f6', // 연한 회색
  '#e5e7eb', // 회색
  '#6b7280', // 진한 회색
  '#1f2937', // 검은색
  '#3b82f6', // 파란색
  '#10b981', // 초록색
  '#f59e0b', // 주황색
  '#ef4444', // 빨간색
  '#8b5cf6'  // 보라색
] as const;

export type ColorPalette = typeof COLOR_PALETTE[number];

export interface BlockData {
  block_type: number;
  block_name: string;
  header_cell_type: any; // Union 타입으로 인한 복잡성 때문에 any로 변경
  body_cell_type: any;   // Union 타입으로 인한 복잡성 때문에 any로 변경
  init_row?: number;
  init_col?: number;
  col_editable?: boolean; // 동적 열 추가/삭제 가능 여부
  group_name?: string; // 그룹 유형 ('구분', '점수 계산', '과목 반영', '기타')
  color?: string; // 컬러 값 (#ffffff 형식)
  created_at?: Date;
  updated_at?: Date;
}

export interface TokenMenu {
  id: number;
  univ_id: string;
  key: string;
  name: string;
  items: TokenMenuItem[];
  created_at?: Date;
  updated_at?: Date;
}

export interface TokenMenuItem {
  id: number;
  order: number;
  label: string;
  value: string;
  created_at?: Date;
  updated_at?: Date;
}

// Division 블록용 헤더 셀 타입 (Map 형태)
export interface DivisionHeaderCellType {
  [divisionType: string]: string; // divisionType -> menuKey 매핑
}

// Division 블록용 바디 셀 타입 (Map 형태)
export interface DivisionBodyCellType {
  [divisionType: string]: ElementType[]; // divisionType -> elementTypes 매핑
}

// 일반 블록용 헤더/바디 셀 타입 (배열 형태)
export interface GeneralCellType {
  element_types: ElementType[];
}

export type HeaderCellType = DivisionHeaderCellType | GeneralCellType;
export type BodyCellType = DivisionBodyCellType | GeneralCellType;

export interface ElementType {
  name: 'Token' | 'Text' | 'Formula' | 'InputField' | 'OrderToken';
  optional?: boolean;
  visible?: boolean;
  menu_key?: string;
  // OrderToken용 보조 메뉴 키
  menu_key2?: string;
}

// 블록 데이터와 토큰 메뉴를 함께 관리하는 상태 타입
export interface BlockDataState {
  blockData: BlockData[];
  tokenMenus: TokenMenu[];
  loading: boolean;
  error: string | null;
}

// 특정 블록 타입의 데이터를 찾는 유틸리티 타입
export interface BlockDataLookup {
  getBlockDataByType: (blockType: number) => BlockData | undefined;
  getTokenMenuByKey: (key: string) => TokenMenu | undefined;
  getTokenMenuItemsByKey: (key: string) => TokenMenuItem[];
}
