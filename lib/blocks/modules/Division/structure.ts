// lib/blocks/modules/Division/structure.ts
// A 타입: Division 블록의 구조 정의

import { FlowBlockType } from '@/types/block-structure';

export const DivisionStructure: FlowBlockType = {
  name: 'Division',
  color: 'green',
  col_editable: true,
  header: [
    {
      type: 'Token',
      optional: false,
      visible: true,
      menu_key: 'division_criteria',
      value: 'gender',
    },
  ],
  children: [
    {
      elements: [
        { type: 'Token', optional: false, visible: true, menu_key: 'division_values', value: null }
      ],
      children: []
    },
  ],
};

