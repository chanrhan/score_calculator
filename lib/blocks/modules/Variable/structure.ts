// lib/blocks/modules/Variable/structure.ts
// A 타입: Variable 블록의 속성 스키마 정의 (새로운 방식)

import { BlockStructureDefinition } from '../common/types';

export const VariableStructure: BlockStructureDefinition = {
  name: 'Variable',
  color: 'red',
  col_editable: false,
  
  // 속성 스키마 정의
  properties: {
    var_name: {
      type: 'string',
      default: '',
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
    var_name: '',
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
