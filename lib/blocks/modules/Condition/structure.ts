// lib/blocks/modules/Condition/structure.ts
// A 타입: Condition 블록의 속성 스키마 정의 (새로운 방식)

import { BlockStructureDefinition } from '../common/types';

export const ConditionStructure: BlockStructureDefinition = {
  name: 'Condition',
  color: 'purple',
  col_editable: false,
  
  // 속성 스키마 정의
  properties: {
    variable_scope: {
      type: 'string',
      default: '0',
      optional: false,
    },
    conditions: {
      type: 'array',
      default: [],
      optional: false,
      itemType: 'array', // 조건 체인 배열
    },
  },
  
  // 기본값
  defaults: {
    variable_scope: '0',
    conditions: [],
  },
  
  // 레이아웃 정의는 layout.tsx로 이동
  layout: {
    header: {
      0: [],
    },
    body: {
      0: [],
    },
  },
};
