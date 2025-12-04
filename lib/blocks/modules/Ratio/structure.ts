// lib/blocks/modules/Ratio/structure.ts
// A 타입: Ratio 블록의 속성 스키마 정의 (새로운 방식)

import { BlockStructureDefinition } from '../common/types';

export const RatioStructure: BlockStructureDefinition = {
  name: 'Ratio',
  color: 'blue',
  col_editable: false,
  
  // 속성 스키마 정의
  properties: {
    ratio: {
      type: 'string',
      default: '100',
      optional: false,
    },
    score_type: {
      type: 'string',
      default: 'finalScore',
      optional: false,
    },
  },
  
  // 기본값
  defaults: {
    ratio: '100',
    score_type: 'finalScore',
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
