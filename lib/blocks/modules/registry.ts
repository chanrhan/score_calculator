// lib/blocks/modules/registry.ts
// 블록 모듈 레지스트리 - 모든 블록 타입의 A, B, C를 등록

import { BLOCK_TYPE } from '@/types/block-types';
import { FlowBlockType } from '@/types/block-structure';
import { BlockInstance, BlockInstanceData } from '../BlockInstance';
import { BlockLayoutRenderer } from '../layout/BlockLayoutRenderer';
import type { BlockStructureDefinition } from './common/types';
import { toFlowBlockType } from './common/types';

// ApplySubject 모듈
import { 
  ApplySubjectStructure, 
  ApplySubjectBlockInstance, 
  ApplySubjectLayoutRenderer 
} from './ApplySubject';

// Division 모듈
import { 
  DivisionStructure, 
  DivisionBlockInstance, 
  DivisionLayoutRenderer 
} from './Division';

// GradeRatio 모듈
import { 
  GradeRatioStructure, 
  GradeRatioBlockInstance, 
  GradeRatioLayoutRenderer 
} from './GradeRatio';

// ApplyTerm 모듈
import { 
  ApplyTermStructure, 
  ApplyTermBlockInstance, 
  ApplyTermLayoutRenderer 
} from './ApplyTerm';

// TopSubject 모듈
import { 
  TopSubjectStructure, 
  TopSubjectBlockInstance, 
  TopSubjectLayoutRenderer 
} from './TopSubject';

// SubjectGroupRatio 모듈
import { 
  SubjectGroupRatioStructure, 
  SubjectGroupRatioBlockInstance, 
  SubjectGroupRatioLayoutRenderer 
} from './SubjectGroupRatio';

// SeparationRatio 모듈
import { 
  SeparationRatioStructure, 
  SeparationRatioBlockInstance, 
  SeparationRatioLayoutRenderer 
} from './SeparationRatio';

// ScoreMap 모듈
import { 
  ScoreMapStructure, 
  ScoreMapBlockInstance, 
  ScoreMapLayoutRenderer 
} from './ScoreMap';

// Formula 모듈
import { 
  FormulaStructure, 
  FormulaBlockInstance, 
  FormulaLayoutRenderer 
} from './Formula';

// Variable 모듈
import { 
  VariableStructure, 
  VariableBlockInstance, 
  VariableLayoutRenderer 
} from './Variable';

// Condition 모듈
import { 
  ConditionStructure, 
  ConditionBlockInstance, 
  ConditionLayoutRenderer 
} from './Condition';

// Aggregation 모듈
import { 
  AggregationStructure, 
  AggregationBlockInstance, 
  AggregationLayoutRenderer 
} from './Aggregation';

// Ratio 모듈
import { 
  RatioStructure, 
  RatioBlockInstance, 
  RatioLayoutRenderer 
} from './Ratio';

// Decimal 모듈
import { 
  DecimalStructure, 
  DecimalBlockInstance, 
  DecimalLayoutRenderer 
} from './Decimal';

/**
 * 블록 구조 정의 레지스트리 (A 타입)
 * 새로운 구조(BlockStructureDefinition)와 기존 구조(FlowBlockType) 모두 지원
 */
export const BlockStructureRegistry: Record<number, FlowBlockType | BlockStructureDefinition> = {
  [BLOCK_TYPE.DIVISION]: DivisionStructure,
  [BLOCK_TYPE.APPLY_SUBJECT]: ApplySubjectStructure, // 새로운 구조
  [BLOCK_TYPE.GRADE_RATIO]: GradeRatioStructure,
  [BLOCK_TYPE.APPLY_TERM]: ApplyTermStructure,
  [BLOCK_TYPE.TOP_SUBJECT]: TopSubjectStructure,
  [BLOCK_TYPE.SUBJECT_GROUP_RATIO]: SubjectGroupRatioStructure,
  [BLOCK_TYPE.SEPARATION_RATIO]: SeparationRatioStructure,
  [BLOCK_TYPE.SCORE_MAP]: ScoreMapStructure, // 새로운 구조
  [BLOCK_TYPE.FORMULA]: FormulaStructure, // 새로운 구조
  [BLOCK_TYPE.VARIABLE]: VariableStructure,
  [BLOCK_TYPE.CONDITION]: ConditionStructure, // 새로운 구조
  [BLOCK_TYPE.AGGREGATION]: AggregationStructure,
  [BLOCK_TYPE.RATIO]: RatioStructure,
  [BLOCK_TYPE.DECIMAL]: DecimalStructure,
};

/**
 * 구조를 FlowBlockType으로 변환하는 헬퍼 함수
 */
function getFlowBlockType(blockType: number): FlowBlockType {
  const structure = BlockStructureRegistry[blockType];
  if (!structure) {
    return {
      name: 'Unknown',
      color: 'gray',
      col_editable: false,
      cols: [{ header: { elements: [] }, rows: [] }]
    };
  }
  // 새로운 구조인지 확인
  if ('properties' in structure && 'defaults' in structure && 'layout' in structure) {
    return toFlowBlockType(structure as BlockStructureDefinition);
  }
  // 기존 구조면 그대로 반환
  return structure as FlowBlockType;
}

/**
 * 블록 인스턴스 생성자 레지스트리 (B 인스턴스)
 */
export const BlockInstanceRegistry: Record<number, new (blockId: number, data: BlockInstanceData) => BlockInstance> = {
  [BLOCK_TYPE.DIVISION]: DivisionBlockInstance,
  [BLOCK_TYPE.APPLY_SUBJECT]: ApplySubjectBlockInstance,
  [BLOCK_TYPE.GRADE_RATIO]: GradeRatioBlockInstance,
  [BLOCK_TYPE.APPLY_TERM]: ApplyTermBlockInstance,
  [BLOCK_TYPE.TOP_SUBJECT]: TopSubjectBlockInstance,
  [BLOCK_TYPE.SUBJECT_GROUP_RATIO]: SubjectGroupRatioBlockInstance,
  [BLOCK_TYPE.SEPARATION_RATIO]: SeparationRatioBlockInstance,
  [BLOCK_TYPE.SCORE_MAP]: ScoreMapBlockInstance,
  [BLOCK_TYPE.FORMULA]: FormulaBlockInstance,
  [BLOCK_TYPE.VARIABLE]: VariableBlockInstance,
  [BLOCK_TYPE.CONDITION]: ConditionBlockInstance,
  [BLOCK_TYPE.AGGREGATION]: AggregationBlockInstance,
  [BLOCK_TYPE.RATIO]: RatioBlockInstance,
  [BLOCK_TYPE.DECIMAL]: DecimalBlockInstance,
};

/**
 * 블록 레이아웃 렌더러 레지스트리 (C 객체)
 */
export const BlockLayoutRendererRegistry: Record<number, () => BlockLayoutRenderer> = {
  [BLOCK_TYPE.DIVISION]: () => new DivisionLayoutRenderer(),
  [BLOCK_TYPE.APPLY_SUBJECT]: () => new ApplySubjectLayoutRenderer(),
  [BLOCK_TYPE.GRADE_RATIO]: () => new GradeRatioLayoutRenderer(),
  [BLOCK_TYPE.APPLY_TERM]: () => new ApplyTermLayoutRenderer(),
  [BLOCK_TYPE.TOP_SUBJECT]: () => new TopSubjectLayoutRenderer(),
  [BLOCK_TYPE.SUBJECT_GROUP_RATIO]: () => new SubjectGroupRatioLayoutRenderer(),
  [BLOCK_TYPE.SEPARATION_RATIO]: () => new SeparationRatioLayoutRenderer(),
  [BLOCK_TYPE.SCORE_MAP]: () => new ScoreMapLayoutRenderer(),
  [BLOCK_TYPE.FORMULA]: () => new FormulaLayoutRenderer(),
  [BLOCK_TYPE.VARIABLE]: () => new VariableLayoutRenderer(),
  [BLOCK_TYPE.CONDITION]: () => new ConditionLayoutRenderer(),
  [BLOCK_TYPE.AGGREGATION]: () => new AggregationLayoutRenderer(),
  [BLOCK_TYPE.RATIO]: () => new RatioLayoutRenderer(),
  [BLOCK_TYPE.DECIMAL]: () => new DecimalLayoutRenderer(),
};

/**
 * 새로운 블록 타입을 등록하는 헬퍼 함수
 * 개발자가 새로운 블록을 추가할 때 이 함수를 사용하면 됩니다.
 */
export function registerBlockType(
  blockType: number,
  structure: FlowBlockType,
  instanceClass: new (blockId: number, data: BlockInstanceData) => BlockInstance,
  layoutRendererFactory: () => BlockLayoutRenderer
): void {
  BlockStructureRegistry[blockType] = structure;
  BlockInstanceRegistry[blockType] = instanceClass;
  BlockLayoutRendererRegistry[blockType] = layoutRendererFactory;
}

/**
 * 블록 인스턴스 팩토리
 * 모듈 레지스트리를 사용하여 자동으로 블록 타입을 로드
 */
import { GenericBlockInstance } from '../BlockInstance';
import { getBlockDefaults, mergeWithDefaults } from './common/defaults';

export class BlockInstanceFactory {
  /**
   * 기본값으로 초기화된 BlockInstance 생성 (새 블록 생성용)
   */
  static createWithDefaults(blockType: number, blockId: number): BlockInstance {
    const defaults = getBlockDefaults(blockType);
    
    // 기본값을 DB 형식으로 변환하여 전달
    // 각 BlockInstance의 constructor에서 기본값을 사용하도록 수정 필요
    const InstanceClass = BlockInstanceRegistry[blockType];
    
    if (InstanceClass) {
      // 빈 데이터로 생성하면 constructor에서 defaults 사용
      return new InstanceClass(blockId, {
        header_cells: [],
        body_cells: []
      });
    }
    
    return new GenericBlockInstance(blockId, blockType, {
      header_cells: [],
      body_cells: []
    });
  }

  /**
   * DB 데이터로 BlockInstance 생성 (기존 데이터 로드용)
   */
  static create(blockType: number, blockId: number, data: any): BlockInstance {
    // 레지스트리에서 블록 타입 찾기
    const InstanceClass = BlockInstanceRegistry[blockType];
    
    if (InstanceClass) {
      // 레지스트리에 등록된 클래스 사용
      // data가 없거나 불완전하면 constructor에서 defaults로 보정
      return new InstanceClass(blockId, {
        header_cells: data?.header_cells || [],
        body_cells: data?.body_cells || []
      });
    }
    
    // 레지스트리에 없으면 GenericBlockInstance 사용
    return new GenericBlockInstance(blockId, blockType, {
      header_cells: data?.header_cells || [],
      body_cells: data?.body_cells || []
    });
  }
}

