// lib/blocks/modules/Ratio/instance.ts
// B 인스턴스: Ratio 블록의 데이터 관리

import { BlockInstance, BlockInstanceData } from '../../BlockInstance';
import { BLOCK_TYPE } from '@/types/block-types';
import { FlowBlockType } from '@/types/block-structure';
import { RatioStructure } from './structure';
import { toFlowBlockType } from '../common/types';

export class RatioBlockInstance extends BlockInstance {
  constructor(blockId: number, data: BlockInstanceData) {
    super(blockId, BLOCK_TYPE.RATIO, data);
  }

  static fromDbFormat(blockId: number, data: BlockInstanceData): RatioBlockInstance {
    return new RatioBlockInstance(blockId, data);
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
    return toFlowBlockType(RatioStructure);
  }

  toDbFormat(): { header_cells: any; body_cells: any } {
    // body_cells 변환
    let bodyCells: any = [];
    if (this.data.body_cells && Array.isArray(this.data.body_cells)) {
      bodyCells = this.data.body_cells.map((row: any) => {
        if (!Array.isArray(row) || row.length === 0) return row;
        const cellValues = row[0];
        if (!Array.isArray(cellValues)) return row;
        
        const bodyObj: any = {};
        bodyObj.ratio = cellValues[0] || 0;
        bodyObj.score_type = cellValues[1] || null;
        
        return Object.keys(bodyObj).length > 0 ? [bodyObj] : row;
      });
    } else {
      bodyCells = this.data.body_cells || [];
    }

    return {
      header_cells: this.data.header_cells || [],
      body_cells: bodyCells
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
    const bodyCells = dbFormat.body_cells;
    
    if (!bodyCells || !Array.isArray(bodyCells) || !bodyCells[rowIndex]) {
      return [];
    }

    const row = bodyCells[rowIndex];
    
    if (typeof row === 'object' && row !== null && colIndex === 0) {
      return [row.ratio || 0, row.score_type || null];
    }
    
    return [];
  }
}

