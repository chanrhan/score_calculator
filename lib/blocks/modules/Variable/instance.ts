// lib/blocks/modules/Variable/instance.ts
// B 인스턴스: Variable 블록의 데이터 관리

import { BlockInstance, BlockInstanceData } from '../../BlockInstance';
import { BLOCK_TYPE } from '@/types/block-types';
import { FlowBlockType } from '@/types/block-structure';

export class VariableBlockInstance extends BlockInstance {
  private bodyCells: Array<{
    var_name: string;
    expr: string;
  }>;

  constructor(blockId: number, data: BlockInstanceData) {
    super(blockId, BLOCK_TYPE.VARIABLE, data);
    
    // 기본값 정의 (structure.ts 제거)
    const defaultVarName = '';
    const defaultExpr = '';
    
    // body_cells 처리: 기본 1*1
    if (data.body_cells && Array.isArray(data.body_cells) && data.body_cells.length > 0) {
      this.bodyCells = data.body_cells.map((row: any) => {
        if (typeof row === 'object' && row !== null && !Array.isArray(row)) {
          return {
            var_name: row.var_name || defaultVarName,
            expr: row.expr || defaultExpr,
          };
        }
        return {
          var_name: defaultVarName,
          expr: defaultExpr,
        };
      });
    } else {
      // 기본 1*1 구조
      this.bodyCells = [{
        var_name: defaultVarName,
        expr: defaultExpr,
      }];
    }
  }

  static fromDbFormat(blockId: number, data: BlockInstanceData): VariableBlockInstance {
    return new VariableBlockInstance(blockId, data);
  }

  updateCellValue(rowIndex: number, colIndex: number, elementIndex: number, value: any): void {
    if (this.bodyCells[rowIndex]) {
      if (elementIndex === 0) {
        this.bodyCells[rowIndex].var_name = value || '';
      } else if (elementIndex === 1) {
        this.bodyCells[rowIndex].expr = value || '';
      }
    }
  }

  addRow(rowIndex?: number): void {
    const defaults = getBlockDefaults(BLOCK_TYPE.VARIABLE);
    const newRow = {
      var_name: defaults.var_name || '',
      expr: defaults.expr || '',
    };
    if (rowIndex !== undefined && rowIndex >= 0) {
      this.bodyCells.splice(rowIndex + 1, 0, newRow);
    } else {
      this.bodyCells.push(newRow);
    }
  }

  addColumn(colIndex?: number): void {
    throw new Error('Variable does not support column addition');
  }

  removeRow(rowIndex: number): void {
    if (rowIndex >= 0 && rowIndex < this.bodyCells.length) {
      this.bodyCells.splice(rowIndex, 1);
    }
  }

  removeColumn(colIndex: number): void {
    throw new Error('Variable does not support column removal');
  }

  getStructure(): FlowBlockType {
    // BlockInstance 내에서 직접 구조 생성 (structure.ts 제거)
    return {
      name: 'Variable',
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
      header_cells: [],
      body_cells: this.bodyCells
    };
  }

  getHeaderCellValues(colIndex: number): any[] {
    return [];
  }

  getBodyCellValues(rowIndex: number, colIndex: number): any[] {
    if (colIndex === 0 && this.bodyCells[rowIndex]) {
      return [
        this.bodyCells[rowIndex].var_name,
        this.bodyCells[rowIndex].expr
      ];
    }
    return [];
  }

  getHeaderProperties(colIndex: number): Record<string, any> {
    return {};
  }

  getBodyProperties(rowIndex: number, colIndex: number): Record<string, any> {
    if (colIndex === 0 && this.bodyCells[rowIndex]) {
      return {
        var_name: this.bodyCells[rowIndex].var_name,
        expr: this.bodyCells[rowIndex].expr,
      };
    }
    return {};
  }

  updateProperty(propertyName: string, value: any, rowIndex?: number, colIndex?: number): void {
    if (rowIndex !== undefined && this.bodyCells[rowIndex]) {
      if (propertyName === 'var_name') {
        this.bodyCells[rowIndex].var_name = value || '';
      } else if (propertyName === 'expr') {
        this.bodyCells[rowIndex].expr = value || '';
      }
    }
  }
}
