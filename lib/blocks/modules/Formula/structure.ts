// lib/blocks/modules/Formula/structure.ts
// A 타입: Formula 블록의 속성 스키마 정의 (새로운 방식)

import { BlockStructureDefinition } from '../common/types';

export const FormulaStructure: BlockStructureDefinition = {
  name: 'Formula',
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
    expr: {
      type: 'string',
      default: '',
      optional: false,
    },
  },
  
  // 기본값
  defaults: {
    variable_scope: '0',
    score_type: 'finalScore',
    expr: '',
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
