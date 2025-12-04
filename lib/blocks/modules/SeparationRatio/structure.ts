// lib/blocks/modules/SeparationRatio/structure.ts
// A 타입: SeparationRatio 블록의 속성 스키마 정의 (새로운 방식)

import { BlockStructureDefinition } from '../common/types';

export const SeparationRatioStructure: BlockStructureDefinition = {
  name: 'SeparationRatio',
  color: 'blue',
  col_editable: false,
  
  // 속성 스키마 정의
  properties: {
    general_ratio: {
      type: 'string',
      default: '100',
      optional: false,
    },
    career_ratio: {
      type: 'string',
      default: '100',
      optional: false,
    },
    arts_ratio: {
      type: 'string',
      default: '100',
      optional: false,
    },
  },
  
  // 기본값
  defaults: {
    general_ratio: '100',
    career_ratio: '100',
    arts_ratio: '100',
  },
  
  // 레이아웃 정의는 layout.tsx로 이동
  layout: {
    header: {
      0: [],
      1: [],
      2: [],
    },
    body: {
      0: [],
      1: [],
      2: [],
    },
  },
};
