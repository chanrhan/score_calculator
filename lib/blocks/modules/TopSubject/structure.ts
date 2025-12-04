// lib/blocks/modules/TopSubject/structure.ts
// A 타입: TopSubject 블록의 속성 스키마 정의 (새로운 방식)

import { BlockStructureDefinition } from '../common/types';

export const TopSubjectStructure: BlockStructureDefinition = {
  name: 'TopSubject',
  color: 'blue',
  col_editable: false,
  
  // 속성 스키마 정의
  properties: {
    top_subject_scope: {
      type: 'string',
      default: 'overall',
      optional: true,
    },
    top_subject_count: {
      type: 'string',
      default: '3',
      optional: false,
    },
  },
  
  // 기본값
  defaults: {
    top_subject_scope: 'overall',
    top_subject_count: '3',
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
