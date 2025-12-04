// lib/blocks/modules/SubjectGroupRatio/structure.ts
// A 타입: SubjectGroupRatio 블록의 속성 스키마 정의 (새로운 방식)

import { BlockStructureDefinition } from '../common/types';

export const SubjectGroupRatioStructure: BlockStructureDefinition = {
  name: 'SubjectGroupRatio',
  color: 'blue',
  col_editable: true,
  
  // 속성 스키마 정의 (동적 열 구조)
  properties: {
    // 동적 열: 각 열마다 subject_group과 ratio 쌍
    columns: {
      type: 'array',
      default: [],
      optional: false,
      itemType: 'object',
      properties: {
        subject_group: {
          type: 'string',
          default: null,
          optional: false,
        },
        ratio: {
          type: 'string',
          default: '100',
          optional: false,
        },
      },
    },
  },
  
  // 기본값
  defaults: {
    columns: [],
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
