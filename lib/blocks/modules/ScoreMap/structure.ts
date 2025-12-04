// lib/blocks/modules/ScoreMap/structure.ts
// A 타입: ScoreMap 블록의 속성 스키마 정의 (새로운 방식)

import { BlockStructureDefinition } from '../common/types';

export const ScoreMapStructure: BlockStructureDefinition = {
  name: 'ScoreMap',
  color: 'blue',
  col_editable: false,
  
  // 속성 스키마 정의
  properties: {
    variable_scope: {
      type: 'string',
      default: '0',
      optional: false,
    },
    filter_option: {
      type: 'string',
      default: '0',
      optional: false,
    },
    input_type: {
      type: 'string',
      default: 'originalScore',
      optional: false,
    },
    input_range: {
      type: 'number',
      default: 1, // 1: range, 0: exact
      optional: false,
    },
    output_type: {
      type: 'string',
      default: 'score',
      optional: false,
    },
    table: {
      type: 'array',
      default: [],
      optional: false,
      itemType: 'array',
    },
  },
  
  // 기본값
  defaults: {
    variable_scope: '0',
    filter_option: '0',
    input_type: 'originalScore',
    input_range: 1,
    output_type: 'score',
    table: [],
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
