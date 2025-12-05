// lib/blocks/modules/Formula/instance.ts
// B 인스턴스: Formula 블록의 데이터 관리

import { BlockInstance, BlockInstanceData } from '../../BlockInstance';
import { BLOCK_TYPE } from '@/types/block-types';
import { FlowBlockType } from '@/types/block-structure';

export class FormulaBlockInstance extends BlockInstance {
  private headerCell: {
    variable_scope: string;
  };
  
  private bodyCells: Array<{
    score_type: string;
    expr: string;
  }>;

  constructor(blockId: number, data: BlockInstanceData) {
    super(blockId, BLOCK_TYPE.FORMULA, data);
    
    // BlockStructure에서 기본값 가져오기
    const defaults = getBlockDefaults(BLOCK_TYPE.FORMULA);
    const defaultVariableScope = defaults.variable_scope || '0';
    const defaultScoreType = defaults.score_type || 'finalScore';
    const defaultExpr = defaults.expr || '';
    
    // header_cells 처리
    if (data.header_cells && Array.isArray(data.header_cells) && data.header_cells.length > 0) {
      const headerObj = data.header_cells[0];
      if (typeof headerObj === 'object' && headerObj !== null && !Array.isArray(headerObj)) {
        this.headerCell = {
          variable_scope: headerObj.variable_scope || defaultVariableScope,
        };
      } else {
        this.headerCell = { variable_scope: defaultVariableScope };
      }
    } else {
      this.headerCell = { variable_scope: defaultVariableScope };
    }
    
    // body_cells 처리
    if (data.body_cells && Array.isArray(data.body_cells) && data.body_cells.length > 0) {
      this.bodyCells = data.body_cells.map((row: any) => {
        if (typeof row === 'object' && row !== null && !Array.isArray(row)) {
          return {
            score_type: row.score_type || defaultScoreType,
            expr: row.expr || defaultExpr,
          };
        }
        // 배열 형식이면 기본값 사용
        return {
          score_type: defaultScoreType,
          expr: defaultExpr,
        };
      });
    } else {
      this.bodyCells = [{
        score_type: defaultScoreType,
        expr: defaultExpr,
      }];
    }
  }

  static fromDbFormat(blockId: number, data: BlockInstanceData): FormulaBlockInstance {
    return new FormulaBlockInstance(blockId, data);
  }

  updateCellValue(rowIndex: number, colIndex: number, elementIndex: number, value: any): void {
    if (rowIndex === -1) {
      if (elementIndex === 1) {
        this.headerCell.variable_scope = value;
      }
    } else {
      if (this.bodyCells[rowIndex]) {
        if (elementIndex === 0) {
          this.bodyCells[rowIndex].score_type = value;
        } else if (elementIndex === 2) {
          this.bodyCells[rowIndex].expr = value;
        }
      }
    }
  }

  addRow(rowIndex?: number): void {
    const defaults = getBlockDefaults(BLOCK_TYPE.FORMULA);
    const newRow = {
      score_type: defaults.score_type || 'finalScore',
      expr: defaults.expr || '',
    };
    if (rowIndex !== undefined && rowIndex >= 0) {
      this.bodyCells.splice(rowIndex + 1, 0, newRow);
    } else {
      this.bodyCells.push(newRow);
    }
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
    // BlockInstance 내에서 직접 구조 생성 (structure.ts 제거)
    return {
      name: 'Formula',
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
      return [null, this.headerCell.variable_scope];
    }
    return [];
  }

  getBodyCellValues(rowIndex: number, colIndex: number): any[] {
    if (colIndex === 0 && this.bodyCells[rowIndex]) {
      return [this.bodyCells[rowIndex].score_type, ' = ', this.bodyCells[rowIndex].expr];
    }
    return [];
  }

  getHeaderProperties(colIndex: number): Record<string, any> {
    if (colIndex === 0) {
      return {
        variable_scope: this.headerCell.variable_scope,
      };
    }
    return {};
  }

  getBodyProperties(rowIndex: number, colIndex: number): Record<string, any> {
    if (colIndex === 0 && this.bodyCells[rowIndex]) {
      return {
        score_type: this.bodyCells[rowIndex].score_type,
        expr: this.bodyCells[rowIndex].expr,
      };
    }
    return {};
  }

  updateProperty(propertyName: string, value: any, rowIndex?: number, colIndex?: number): void {
    if (propertyName === 'variable_scope') {
      this.headerCell.variable_scope = value;
    } else if (propertyName === 'score_type' && rowIndex !== undefined && this.bodyCells[rowIndex]) {
      this.bodyCells[rowIndex].score_type = value;
    } else if (propertyName === 'expr' && rowIndex !== undefined && this.bodyCells[rowIndex]) {
      this.bodyCells[rowIndex].expr = value;
    }
  }
}

