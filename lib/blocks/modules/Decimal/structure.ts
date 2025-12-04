// lib/blocks/modules/Decimal/structure.ts
// A 타입: Decimal 블록의 속성 스키마 정의 (새로운 방식)

import { BlockStructureDefinition } from '../common/types';

export const DecimalStructure: BlockStructureDefinition = {
  name: 'Decimal',
  color: 'blue',
  col_editable: false,
  
  // 속성 스키마 정의
  properties: {
    variable_scope: {
      type: 'string',
      default: '0',
      optional: false,
    },
    score_type: {
      type: 'string',
      default: 'finalScore',
      optional: false,
    },
    decimal_places: {
      type: 'string',
      default: '2',
      optional: false,
    },
    decimal_option: {
      type: 'string',
      default: '0',
      optional: false,
    },
  },
  
  // 기본값
  defaults: {
    variable_scope: '0',
    score_type: 'finalScore',
    decimal_places: '2',
    decimal_option: '0',
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
