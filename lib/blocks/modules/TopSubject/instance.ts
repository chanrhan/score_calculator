// lib/blocks/modules/TopSubject/instance.ts
// B 인스턴스: TopSubject 블록의 데이터 관리

import { BlockInstance, BlockInstanceData } from '../../BlockInstance';
import { BLOCK_TYPE } from '@/types/block-types';
import { FlowBlockType } from '@/types/block-structure';
import { TopSubjectStructure } from './structure';
import { toFlowBlockType } from '../common/types';

export class TopSubjectBlockInstance extends BlockInstance {
  constructor(blockId: number, data: BlockInstanceData) {
    super(blockId, BLOCK_TYPE.TOP_SUBJECT, data);
  }

  static fromDbFormat(blockId: number, data: BlockInstanceData): TopSubjectBlockInstance {
    return new TopSubjectBlockInstance(blockId, data);
  }

  updateCellValue(rowIndex: number, colIndex: number, elementIndex: number, value: any): void {
    // GenericBlockInstance의 로직 사용
  }

  addRow(rowIndex?: number): void {
    // GenericBlockInstance의 로직 사용
  }

  addColumn(colIndex?: number): void {
    // GenericBlockInstance의 로직 사용
  }

  removeRow(rowIndex: number): void {
    // GenericBlockInstance의 로직 사용
  }

  removeColumn(colIndex: number): void {
    // GenericBlockInstance의 로직 사용
  }

  getStructure(): FlowBlockType {
    return toFlowBlockType(TopSubjectStructure);
  }

  toDbFormat(): { header_cells: any; body_cells: any } {
    return {
      header_cells: this.data.header_cells || [],
      body_cells: this.data.body_cells || []
    };
  }

  getHeaderCellValues(colIndex: number): any[] {
    const dbFormat = this.toDbFormat();
    if (Array.isArray(dbFormat.header_cells) && dbFormat.header_cells[colIndex]) {
      return Array.isArray(dbFormat.header_cells[colIndex]) 
        ? dbFormat.header_cells[colIndex] 
        : [];
    }
    return [];
  }

  getBodyCellValues(rowIndex: number, colIndex: number): any[] {
    const dbFormat = this.toDbFormat();
    if (Array.isArray(dbFormat.body_cells) && dbFormat.body_cells[rowIndex]) {
      const row = dbFormat.body_cells[rowIndex];
      if (Array.isArray(row) && row[colIndex]) {
        return Array.isArray(row[colIndex]) ? row[colIndex] : [];
      }
    }
    return [];
  }
}

