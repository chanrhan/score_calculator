// lib/blocks/modules/Division/structure.ts
// A 타입: Division 블록의 구조 정의

import { FlowBlockType } from '@/types/block-structure';

export const DivisionStructure: FlowBlockType = {
  name: 'Division',
  color: 'green',
  col_editable: true,
  header: {
    gender: 'division_criteria',
    grade: 'division_criteria',
  },
  children: {
    gender: [
      { type: 'Token', optional: false, visible: true, menu_key: 'division_values' }
    ],
    grade: [
      { type: 'Token', optional: false, visible: true, menu_key: 'division_values' }
    ],
  },
};

