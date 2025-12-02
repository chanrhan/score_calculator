// /types/blocks.ts
// 블록(division/function/condition/aggregation/variable/finalize) 타입

import type { BlockBase } from './domain';
import type { FunctionParams } from './functions';
import { canCombine } from '@/lib/utils/combine';

// 포트 타입 시스템 (기획서 2.2)
export type PortType = 'subjects' | 'scalar' | 'table' | 'dict';

// 블록 입출력 포트 정의
export type BlockPort = {
  type: PortType;
  description?: string;
};

// 블록 결합 규칙 (기획서 4)
export type BlockConnection = {
  fromBlockId: number;
  toBlockId: number;
  fromPort: 'output';
  toPort: 'input';
};

// 포트 호환 매트릭스 (기획서 4)
export const PORT_COMPATIBILITY_MATRIX: Record<string, Record<string, boolean>> = {
  division: {
    division: false,
    function: true,
    condition: true,
    aggregation: true,
    variable: false,
    finalize: true,
  },
  function: {
    division: false,
    function: true,
    condition: true,
    aggregation: true,
    variable: false,
    finalize: true,
  },
  condition: {
    division: false,
    function: true,
    condition: true,
    aggregation: true,
    variable: true,
    finalize: true,
  },
  aggregation: {
    division: false,
    function: false,
    condition: true,
    aggregation: false,
    variable: true,
    finalize: true,
  },
  variable: {
    division: false,
    function: false,
    condition: false,
    aggregation: false,
    variable: false,
    finalize: false,
  },
  finalize: {
    division: false,
    function: false,
    condition: false,
    aggregation: false,
    variable: false,
    finalize: false,
  },
};

// 블록 포트 정의
export const BLOCK_PORTS: Record<string, { input: BlockPort; output: BlockPort }> = {
  division: {
    input: { type: 'subjects', description: '과목 데이터' },
    output: { type: 'subjects', description: '케이스별 과목 서브셋' },
  },
  function: {
    input: { type: 'subjects', description: '과목 데이터' },
    output: { type: 'subjects', description: '변환된 과목 데이터' },
  },
  condition: {
    input: { type: 'subjects', description: '조건 평가 대상 과목 데이터' },
    output: { type: 'subjects', description: '조건을 만족하는 과목 데이터' },
  },
  aggregation: {
    input: { type: 'subjects', description: '과목 데이터' },
    output: { type: 'scalar', description: '집계 결과' },
  },
  variable: {
    input: { type: 'scalar', description: '저장할 값' },
    output: { type: 'scalar', description: '저장된 값' },
  },
  finalize: {
    input: { type: 'scalar', description: '최종 데이터' },
    output: { type: 'scalar', description: '종료 신호' },
  },
};

/** Division */
export type DivisionSpecRow = { type: string; values: (string | number)[] };
export type DivisionSpec = { rows: DivisionSpecRow[] };

export type DivisionCase = {
  id: number;
  caseKey: string;
  criteria: Record<string, any>;
  position: number;
  isImplicit?: boolean; // GLOBAL case 표기
  /** 이 케이스의 오른쪽 체인 (정규화 생략: 편집/실행 편의) */
  rightChain: AnyBlock[];
};

export type DivisionBlock = BlockBase & {
  kind: 'division';
  skipPolicy: 'skip_empty_case' | 'error_empty_case';
  spec: DivisionSpec;
  cases: DivisionCase[];
};

/** Function (항상 어떤 Case에 귀속) */
export type FunctionBlock = BlockBase & {
  kind: 'function';
  caseId: number; // Function ↔ Case = 1:N 보장
  funcType: FunctionParams['kind'];
  params: FunctionParams extends { kind: infer K; params: infer P }
    ? K extends FunctionParams['kind']
      ? P
      : never
    : never;
};

/** Condition */
export type ConditionBlock = BlockBase & {
  kind: 'condition';
  expr: string; // DSL (boolean)
  thenChain: AnyBlock[];
  elseChain?: AnyBlock[];
};

/** Aggregation */
export type AggregationBlock = BlockBase & {
  kind: 'aggregation';
  agg: 'SUM' | 'AVG' | 'COUNT' | 'MAX' | 'MIN' | 'STD';
  target?: string; // COUNT만 사용 시 생략 가능
  filter?: string;
  outputName?: string; // 있으면 ctx.metrics[outputName] = value
};

/** Variable */
export type VariableBlock = BlockBase & {
  kind: 'variable';
  name: string;
  scope: 'component' | 'pipeline';
  overwrite: 'allow' | 'deny';
};

/** Finalize */
export type FinalizeBlock = BlockBase & {
  kind: 'finalize';
  mode: 'snapshot' | 'terminate';
  note?: string;
};

/** 통합 블록 유니온 */
export type AnyBlock =
  | DivisionBlock
  | FunctionBlock
  | ConditionBlock
  | AggregationBlock
  | VariableBlock
  | FinalizeBlock;

// 블록 결합 유틸리티 함수들
export function canConnectBlocks(fromBlock: AnyBlock, toBlock: AnyBlock): boolean {
  const fromKind = fromBlock.kind;
  const toKind = toBlock.kind;
  
  return PORT_COMPATIBILITY_MATRIX[fromKind]?.[toKind] ?? false;
}

export function getBlockPorts(block: AnyBlock) {
  return BLOCK_PORTS[block.kind];
}

export function validateBlockConnection(fromBlock: AnyBlock, toBlock: AnyBlock): {
  valid: boolean;
  error?: string;
} {
  // canCombine 함수를 사용하여 일관된 검증
  if (!canCombine(fromBlock.kind, toBlock.kind)) {
    return {
      valid: false,
      error: `${fromBlock.kind} 블록에서 ${toBlock.kind} 블록으로의 연결이 허용되지 않습니다.`,
    };
  }

  // 포트 타입 검증은 기본적인 호환성만 확인
  // 실제 비즈니스 로직은 canCombine에서 처리
  const fromPorts = getBlockPorts(fromBlock);
  const toPorts = getBlockPorts(toBlock);

  // subjects 포트는 subjects와만 호환, scalar 포트는 scalar와만 호환
  if (fromPorts.output.type !== toPorts.input.type) {
    return {
      valid: false,
      error: `포트 타입 불일치: ${fromPorts.output.type} → ${toPorts.input.type}`,
    };
  }

  return { valid: true };
}
