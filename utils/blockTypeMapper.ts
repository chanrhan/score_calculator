// utils/blockTypeMapper.ts
// 블록 타입과 DB 저장 코드 간의 매핑 관리

export const BLOCK_TYPE_CODES = {
  'ApplyTerm': 1,
  'Division': 2, 
  'ScoreMap': 3,
  'ApplySubject': 4,
  'TopSubject': 5,
  'SubjectGroupRatio': 6,
  'SeparationRatio': 7,
  'GradeRatio': 8,
  'Formula': 9,
  'Variable': 10,
  'Condition': 11
} as const;

export const BLOCK_TYPE_NAMES = {
  1: 'ApplyTerm',
  2: 'Division',
  3: 'ScoreMap', 
  4: 'ApplySubject',
  5: 'TopSubject',
  6: 'SubjectGroupRatio',
  7: 'SeparationRatio',
  8: 'GradeRatio',
  9: 'Formula',
  10: 'Variable',
  11: 'Condition'
} as const;

export type BlockTypeName = keyof typeof BLOCK_TYPE_CODES;
export type BlockTypeCode = typeof BLOCK_TYPE_CODES[BlockTypeName];

/**
 * 블록 타입 이름을 DB 코드로 변환
 */
export function getBlockTypeCode(blockTypeName: string): number {
  const code = BLOCK_TYPE_CODES[blockTypeName as BlockTypeName];
  if (!code) {
    console.warn(`Unknown block type: ${blockTypeName}, defaulting to Formula (9)`);
    return BLOCK_TYPE_CODES.Formula;
  }
  return code;
}

/**
 * DB 코드를 블록 타입 이름으로 변환
 */
export function getBlockTypeName(blockTypeCode: number): string {
  const name = BLOCK_TYPE_NAMES[blockTypeCode as BlockTypeCode];
  if (!name) {
    console.warn(`Unknown block type code: ${blockTypeCode}, defaulting to Formula`);
    return 'Formula';
  }
  return name;
}

/**
 * 블록이 Division 타입인지 확인
 */
export function isDivisionBlock(blockTypeName: string): boolean {
  return blockTypeName === 'Division';
}

/**
 * 블록이 Function 타입(실제 계산 수행)인지 확인
 */
export function isFunctionBlock(blockTypeName: string): boolean {
  return !['Division', 'Variable', 'Condition'].includes(blockTypeName);
}

/**
 * 모든 지원되는 블록 타입 목록 반환
 */
export function getSupportedBlockTypes(): BlockTypeName[] {
  return Object.keys(BLOCK_TYPE_CODES) as BlockTypeName[];
}