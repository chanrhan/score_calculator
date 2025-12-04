// lib/blocks/modules/Condition/instance.ts
// B 인스턴스: Condition 블록의 데이터 관리

import { BlockInstance, BlockInstanceData } from '../../BlockInstance';
import { BLOCK_TYPE } from '@/types/block-types';
import { FlowBlockType } from '@/types/block-structure';
import { ConditionStructure } from './structure';
import { toFlowBlockType } from '../common/types';

export class ConditionBlockInstance extends BlockInstance {
  constructor(blockId: number, data: BlockInstanceData) {
    super(blockId, BLOCK_TYPE.CONDITION, data);
  }

  static fromDbFormat(blockId: number, data: BlockInstanceData): ConditionBlockInstance {
    return new ConditionBlockInstance(blockId, data);
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
    return toFlowBlockType(ConditionStructure);
  }

  toDbFormat(): { header_cells: any; body_cells: any } {
    // header_cells 변환
    let headerCells: any = [];
    if (this.data.header_cells && Array.isArray(this.data.header_cells) && this.data.header_cells.length > 0) {
      const headerValues = this.data.header_cells[0];
      if (Array.isArray(headerValues)) {
        const headerObj: any = {};
        headerObj.variable_scope = headerValues[1] || 0;
        headerCells = Object.keys(headerObj).length > 0 ? [headerObj] : this.data.header_cells;
      } else {
        headerCells = this.data.header_cells;
      }
    } else {
      headerCells = this.data.header_cells || [];
    }

    // body_cells 변환
    let bodyCells: any = [];
    if (this.data.body_cells && Array.isArray(this.data.body_cells)) {
      bodyCells = this.data.body_cells.map((row: any) => {
        if (!Array.isArray(row) || row.length === 0) return row;
        const cellValues = row[0];
        if (!Array.isArray(cellValues)) return row;
        
        const bodyObj: any = {};
        bodyObj.conditions = cellValues[0] || [];
        
        return Object.keys(bodyObj).length > 0 ? [bodyObj] : row;
      });
    } else {
      bodyCells = this.data.body_cells || [];
    }

    return {
      header_cells: headerCells,
      body_cells: bodyCells
    };
  }

  getHeaderCellValues(colIndex: number): any[] {
    const dbFormat = this.toDbFormat();
    const headerCells = dbFormat.header_cells;
    
    if (!headerCells || !Array.isArray(headerCells) || headerCells.length === 0) {
      return [];
    }

    if (colIndex === 0) {
      const headerObj = headerCells[0];
      if (typeof headerObj === 'object' && headerObj !== null) {
        return [null, headerObj.variable_scope || 0];
      }
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
      return [row.conditions || []];
    }
    
    return [];
  }
}

