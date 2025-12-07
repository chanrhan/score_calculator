// lib/blocks/modules/registry.ts
// 블록 모듈 레지스트리 - 모든 블록 타입의 A, B, C를 등록

import { BLOCK_TYPE } from '@/types/block-types';
import { FlowBlockType } from '@/types/block-structure';
import { BlockInstance, BlockInstanceData } from '../BlockInstance';
import { BlockLayoutRenderer } from '../layout/BlockLayoutRenderer';

// ApplySubject 모듈
import { 
  ApplySubjectBlockInstance, 
  ApplySubjectLayoutRenderer 
} from './ApplySubject';

// GradeRatio 모듈
import { 
  GradeRatioBlockInstance, 
  GradeRatioLayoutRenderer 
} from './GradeRatio';

// ApplyTerm 모듈
import { 
  ApplyTermBlockInstance, 
  ApplyTermLayoutRenderer 
} from './ApplyTerm';

// TopSubject 모듈
import { 
  TopSubjectBlockInstance, 
  TopSubjectLayoutRenderer 
} from './TopSubject';

// SubjectGroupRatio 모듈
import { 
  SubjectGroupRatioBlockInstance, 
  SubjectGroupRatioLayoutRenderer 
} from './SubjectGroupRatio';

// SeparationRatio 모듈
import { 
  SeparationRatioBlockInstance, 
  SeparationRatioLayoutRenderer 
} from './SeparationRatio';

// ScoreMap 모듈
import { 
  ScoreMapBlockInstance, 
  ScoreMapLayoutRenderer 
} from './ScoreMap';

// Formula 모듈
import { 
  FormulaBlockInstance, 
  FormulaLayoutRenderer 
} from './Formula';

// Variable 모듈
import { 
  VariableBlockInstance, 
  VariableLayoutRenderer 
} from './Variable';

// Condition 모듈
import { 
  ConditionBlockInstance, 
  ConditionLayoutRenderer 
} from './Condition';

// Aggregation 모듈
import { 
  AggregationBlockInstance, 
  AggregationLayoutRenderer 
} from './Aggregation';

// Ratio 모듈
import { 
  RatioBlockInstance, 
  RatioLayoutRenderer 
} from './Ratio';

// Decimal 모듈
import { 
  DecimalBlockInstance, 
  DecimalLayoutRenderer 
} from './Decimal';

/**
 * 블록 구조를 가져오는 헬퍼 함수
 * BlockInstance의 getStructure()를 사용하여 구조를 가져옵니다.
 */
export function getFlowBlockType(blockType: number): FlowBlockType {
  const InstanceClass = BlockInstanceRegistry[blockType];
  if (InstanceClass) {
    // 임시 인스턴스를 생성하여 getStructure() 호출
    const tempInstance = new InstanceClass(0, { header_cells: [], body_cells: [] });
    return tempInstance.getStructure();
  }
  return {
    name: 'Unknown',
    color: 'gray',
    col_editable: false,
    cols: [{ header: { elements: [] }, rows: [] }]
  };
}

/**
 * 블록 인스턴스 생성자 레지스트리 (B 인스턴스)
 */
export const BlockInstanceRegistry: Record<number, new (blockId: number, data: BlockInstanceData) => BlockInstance> = {
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
  instanceClass: new (blockId: number, data: BlockInstanceData) => BlockInstance,
  layoutRendererFactory: () => BlockLayoutRenderer
): void {
  BlockInstanceRegistry[blockType] = instanceClass;
  BlockLayoutRendererRegistry[blockType] = layoutRendererFactory;
}

/**
 * 블록 인스턴스 팩토리
 * 모듈 레지스트리를 사용하여 자동으로 블록 타입을 로드
 */
import { GenericBlockInstance } from '../BlockInstance';

export class BlockInstanceFactory {
  /**
   * 기본값으로 초기화된 BlockInstance 생성 (새 블록 생성용)
   */
  static createWithDefaults(blockType: number, blockId: number): BlockInstance {
    const InstanceClass = BlockInstanceRegistry[blockType];
    
    if (InstanceClass) {
      // 빈 데이터로 생성하면 constructor에서 기본값 사용
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

