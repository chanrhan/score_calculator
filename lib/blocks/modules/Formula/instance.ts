// lib/blocks/modules/Formula/instance.ts
// B 인스턴스: Formula 블록의 데이터 관리

import { BlockInstance, BlockInstanceData } from '../../BlockInstance';
import { BLOCK_TYPE } from '@/types/block-types';
import { FlowBlockType } from '@/types/block-structure';
import { FormulaStructure } from './structure';
import { toFlowBlockType } from '../common/types';

export class FormulaBlockInstance extends BlockInstance {
  constructor(blockId: number, data: BlockInstanceData) {
    super(blockId, BLOCK_TYPE.FORMULA, data);
  }

  static fromDbFormat(blockId: number, data: BlockInstanceData): FormulaBlockInstance {
    return new FormulaBlockInstance(blockId, data);
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
    return toFlowBlockType(FormulaStructure);
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
        bodyObj.score_type = cellValues[0] || null;
        bodyObj.expr = cellValues[2] || null;
        
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
      return [row.score_type || null, ' = ', row.expr || null];
    }
    
    return [];
  }
}

