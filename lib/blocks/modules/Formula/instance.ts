// lib/blocks/modules/Formula/instance.ts
// B 인스턴스: Formula 블록의 데이터 관리

import { BlockInstance, BlockInstanceData } from '../../BlockInstance';
import { BLOCK_TYPE } from '@/types/block-types';
import { FlowBlockType } from '@/types/block-structure';

export class FormulaBlockInstance extends BlockInstance {
  private bodyCells: Array<{
    expr: string;
    output_prop: string;
  }>;

  constructor(blockId: number, data: BlockInstanceData) {
    super(blockId, BLOCK_TYPE.FORMULA, data);
    
    // 기본값 정의
    const defaultVarScope = '0';
    const defaultExpr = '';
    const defaultOutputProp = 'finalScore';
    
    // var_scope 초기화 (헤더에서 읽거나 기본값 사용)
    if (data.header_cells && Array.isArray(data.header_cells) && data.header_cells.length > 0) {
      const headerObj = data.header_cells[0];
      if (typeof headerObj === 'object' && headerObj !== null && !Array.isArray(headerObj)) {
        this.setVarScope(headerObj.var_scope || defaultVarScope);
      } else {
        this.setVarScope(defaultVarScope);
      }
    } else {
      this.setVarScope(defaultVarScope);
    }
    
    // body_cells 처리
    if (data.body_cells && Array.isArray(data.body_cells) && data.body_cells.length > 0) {
      this.bodyCells = data.body_cells.map((row: any) => {
        if (typeof row === 'object' && row !== null && !Array.isArray(row)) {
          return {
            expr: row.expr !== undefined ? String(row.expr) : defaultExpr,
            output_prop: row.output_prop || defaultOutputProp,
          };
        }
        return {
          expr: defaultExpr,
          output_prop: defaultOutputProp,
        };
      });
    } else {
      this.bodyCells = [{
        expr: defaultExpr,
        output_prop: defaultOutputProp,
      }];
    }
  }

  static fromDbFormat(blockId: number, data: BlockInstanceData): FormulaBlockInstance {
    return new FormulaBlockInstance(blockId, data);
  }

  updateCellValue(rowIndex: number, colIndex: number, elementIndex: number, value: any): void {
    // 헤더 셀은 더 이상 var_scope를 포함하지 않음
    if (rowIndex === -1) {
      // 헤더 셀 업데이트는 무시 (var_scope는 블록 레벨 속성으로 관리)
    } else {
      if (this.bodyCells[rowIndex]) {
        if (elementIndex === 0) {
          this.bodyCells[rowIndex].expr = String(value);
        } else if (elementIndex === 1) {
          this.bodyCells[rowIndex].output_prop = value;
        }
      }
    }
  }

  addRow(rowIndex?: number): void {
    const newRow = {
      expr: '',
      output_prop: 'finalScore',
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
    // 하위 호환성을 위해 header_cells[0]에 var_scope 포함
    return {
      header_cells: [{ var_scope: this.getVarScope() }],
      body_cells: this.bodyCells
    };
  }

  getHeaderCellValues(colIndex: number): any[] {
    // 헤더 셀에는 더 이상 var_scope가 없음
    if (colIndex === 0) {
      return [];
    }
    return [];
  }

  getBodyCellValues(rowIndex: number, colIndex: number): any[] {
    if (colIndex === 0 && this.bodyCells[rowIndex]) {
      return [this.bodyCells[rowIndex].expr, this.bodyCells[rowIndex].output_prop];
    }
    return [];
  }

  getHeaderProperties(colIndex: number): Record<string, any> {
    // 헤더에는 더 이상 var_scope가 없음
    if (colIndex === 0) {
      return {};
    }
    return {};
  }

  getBodyProperties(rowIndex: number, colIndex: number): Record<string, any> {
    if (colIndex === 0 && this.bodyCells[rowIndex]) {
      return {
        expr: this.bodyCells[rowIndex].expr,
        output_prop: this.bodyCells[rowIndex].output_prop,
      };
    }
    return {};
  }

  updateProperty(propertyName: string, value: any, rowIndex?: number, colIndex?: number): void {
    if (propertyName === 'var_scope') {
      this.setVarScope(value);
    } else if (rowIndex !== undefined && this.bodyCells[rowIndex]) {
      if (propertyName === 'expr') {
        this.bodyCells[rowIndex].expr = String(value);
      } else if (propertyName === 'output_prop') {
        this.bodyCells[rowIndex].output_prop = value;
      }
    }
  }
}

