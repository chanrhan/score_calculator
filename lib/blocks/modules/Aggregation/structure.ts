// lib/blocks/modules/Aggregation/structure.ts
// A 타입: Aggregation 블록의 속성 스키마 정의 (새로운 방식)

import { BlockStructureDefinition } from '../common/types';

export const AggregationStructure: BlockStructureDefinition = {
  name: 'Aggregation',
  color: 'purple',
  col_editable: false,
  
  // 속성 스키마 정의
  properties: {
    variable_scope: {
      type: 'string',
      default: '0',
      optional: false,
    },
    input_score_type: {
      type: 'string',
      default: 'finalScore',
      optional: false,
    },
    aggregation_function: {
      type: 'string',
      default: '0',
      optional: false,
    },
    output_score_type: {
      type: 'string',
      default: 'finalScore',
      optional: false,
    },
  },
  
  // 기본값
  defaults: {
    variable_scope: '0',
    input_score_type: 'finalScore',
    aggregation_function: '0',
    output_score_type: 'finalScore',
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
