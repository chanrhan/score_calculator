// lib/blocks/modules/ApplyTerm/structure.ts
// A 타입: ApplyTerm 블록의 속성 스키마 정의 (새로운 방식)

import { BlockStructureDefinition } from '../common/types';

export const ApplyTermStructure: BlockStructureDefinition = {
  name: 'ApplyTerm',
  color: 'blue',
  col_editable: false,
  
  // 속성 스키마 정의
  properties: {
    include_option: {
      type: 'string',
      default: 'include',
      optional: false,
    },
    term_1_1: {
      type: 'string',
      default: '1-1:on',
      optional: false,
    },
    term_1_2: {
      type: 'string',
      default: '1-2:on',
      optional: false,
    },
    term_2_1: {
      type: 'string',
      default: '2-1:on',
      optional: false,
    },
    term_2_2: {
      type: 'string',
      default: '2-2:on',
      optional: false,
    },
    term_3_1: {
      type: 'string',
      default: '3-1:on',
      optional: false,
    },
    term_3_2: {
      type: 'string',
      default: '3-2:on',
      optional: false,
    },
    top_terms: {
      type: 'string',
      default: null,
      optional: true,
    },
  },
  
  // 기본값
  defaults: {
    include_option: 'include',
    term_1_1: '1-1:on',
    term_1_2: '1-2:on',
    term_2_1: '2-1:on',
    term_2_2: '2-2:on',
    term_3_1: '3-1:on',
    term_3_2: '3-2:on',
    top_terms: null,
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
