// lib/blocks/modules/GradeRatio/structure.ts
// A 타입: GradeRatio 블록의 속성 스키마 정의 (새로운 방식)

import { BlockStructureDefinition } from '../common/types';

export const GradeRatioStructure: BlockStructureDefinition = {
  name: 'GradeRatio',
  color: 'blue',
  col_editable: false,
  
  // 속성 스키마 정의
  properties: {
    grade1_ratio: {
      type: 'string',
      default: '100',
      optional: false,
    },
    grade2_ratio: {
      type: 'string',
      default: '100',
      optional: false,
    },
    grade3_ratio: {
      type: 'string',
      default: '100',
      optional: false,
    },
  },
  
  // 기본값
  defaults: {
    grade1_ratio: '100',
    grade2_ratio: '100',
    grade3_ratio: '100',
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
