// lib/blocks/modules/Condition/instance.ts
// B 인스턴스: Condition 블록의 데이터 관리

import { BlockInstance, BlockInstanceData } from '../../BlockInstance';
import { BLOCK_TYPE } from '@/types/block-types';
import { FlowBlockType } from '@/types/block-structure';

export class ConditionBlockInstance extends BlockInstance {
  private headerCell: {
    var_scope: string;
  };
  
  private bodyCells: Array<{
    exprs: any[];
  }>;

  constructor(blockId: number, data: BlockInstanceData) {
    super(blockId, BLOCK_TYPE.CONDITION, data);
    
    // 기본값 정의
    const defaultVarScope = '0';
    const defaultExprs: any[] = [];
    
    // header_cells 처리
    if (data.header_cells && Array.isArray(data.header_cells) && data.header_cells.length > 0) {
      const headerObj = data.header_cells[0];
      if (typeof headerObj === 'object' && headerObj !== null && !Array.isArray(headerObj)) {
        this.headerCell = {
          var_scope: headerObj.var_scope || defaultVarScope,
        };
      } else {
        this.headerCell = { var_scope: defaultVarScope };
      }
    } else {
      this.headerCell = { var_scope: defaultVarScope };
    }
    
    // body_cells 처리
    if (data.body_cells && Array.isArray(data.body_cells) && data.body_cells.length > 0) {
      this.bodyCells = data.body_cells.map((row: any) => {
        if (typeof row === 'object' && row !== null && !Array.isArray(row)) {
          return {
            exprs: Array.isArray(row.exprs) ? row.exprs : defaultExprs,
          };
        }
        return { exprs: defaultExprs };
      });
    } else {
      this.bodyCells = [{ exprs: defaultExprs }];
    }
  }

  static fromDbFormat(blockId: number, data: BlockInstanceData): ConditionBlockInstance {
    return new ConditionBlockInstance(blockId, data);
  }

  updateCellValue(rowIndex: number, colIndex: number, elementIndex: number, value: any): void {
    if (rowIndex === -1) {
      if (elementIndex === 0) {
        this.headerCell.var_scope = value;
      }
    } else {
      if (this.bodyCells[rowIndex] && elementIndex === 0) {
        this.bodyCells[rowIndex].exprs = Array.isArray(value) ? value : [];
      }
    }
  }

  addRow(rowIndex?: number): void {
    const newRow = { exprs: [] as any[] };
    if (rowIndex !== undefined && rowIndex >= 0) {
      this.bodyCells.splice(rowIndex + 1, 0, newRow);
    } else {
      this.bodyCells.push(newRow);
    }
  }

  addColumn(colIndex?: number): void {
    throw new Error('Condition does not support column addition');
  }

  removeRow(rowIndex: number): void {
    if (rowIndex >= 0 && rowIndex < this.bodyCells.length) {
      this.bodyCells.splice(rowIndex, 1);
    }
  }

  removeColumn(colIndex: number): void {
    throw new Error('Condition does not support column removal');
  }

  getStructure(): FlowBlockType {
    // BlockInstance 내에서 직접 구조 생성 (structure.ts 제거)
    return {
      name: 'Condition',
      color: 'blue',
      col_editable: false, // 열 추가 불가
      cols: [{
        header: { elements: [] },
        rows: [{ elements: [] }]
      }]
    };
  }

  toDbFormat(): { header_cells: any; body_cells: any } {
    return {
      header_cells: [this.headerCell],
      body_cells: this.bodyCells
    };
  }

  getHeaderCellValues(colIndex: number): any[] {
    if (colIndex === 0) {
      return [this.headerCell.var_scope];
    }
    return [];
  }

  getBodyCellValues(rowIndex: number, colIndex: number): any[] {
    if (colIndex === 0 && this.bodyCells[rowIndex]) {
      return [this.bodyCells[rowIndex].exprs];
    }
    return [];
  }

  getHeaderProperties(colIndex: number): Record<string, any> {
    if (colIndex === 0) {
      return {
        var_scope: this.headerCell.var_scope,
      };
    }
    return {};
  }

  getBodyProperties(rowIndex: number, colIndex: number): Record<string, any> {
    if (colIndex === 0 && this.bodyCells[rowIndex]) {
      return {
        exprs: this.bodyCells[rowIndex].exprs,
      };
    }
    return {};
  }

  updateProperty(propertyName: string, value: any, rowIndex?: number, colIndex?: number): void {
    if (propertyName === 'var_scope') {
      this.headerCell.var_scope = value;
    } else if (propertyName === 'exprs' && rowIndex !== undefined && this.bodyCells[rowIndex]) {
      this.bodyCells[rowIndex].exprs = Array.isArray(value) ? value : [];
    }
  }
}
