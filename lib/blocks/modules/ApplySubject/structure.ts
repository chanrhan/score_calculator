// lib/blocks/modules/ApplySubject/structure.ts
// A 타입: ApplySubject 블록의 속성 스키마 정의 (새로운 방식)

import { BlockStructureDefinition } from '../common/types';

export const ApplySubjectStructure: BlockStructureDefinition = {
  name: 'ApplySubject',
  color: 'blue',
  col_editable: false,
  
  // 속성 스키마 정의
  properties: {
    include_option: {
      type: 'string',
      default: 'include',
      optional: false,
    },
    subject_groups: {
      type: 'array',
      default: [],
      optional: false,
      itemType: 'string',
    },
  },
  
  // 기본값
  defaults: {
    include_option: 0,
    subject_groups: [],
  },
  
  // 레이아웃 정의는 layout.tsx에서만 정의
  layout: {
    header: {},
    body: {},
  },
};
