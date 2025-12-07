// lib/blocks/modules/ScoreMap/instance.ts
// B 인스턴스: ScoreMap 블록의 데이터 관리

import { BlockInstance, BlockInstanceData } from '../../BlockInstance';
import { BLOCK_TYPE } from '@/types/block-types';
import { FlowBlockType } from '@/types/block-structure';

export class ScoreMapBlockInstance extends BlockInstance {
  private headerCell: {
    var_scope: string;
  };
  
  private bodyCells: Array<{
    input_prop: string;
    output_prop: string;
    table: any[][];
  }>;

  constructor(blockId: number, data: BlockInstanceData) {
    super(blockId, BLOCK_TYPE.SCORE_MAP, data);
    
    // 기본값 정의
    const defaultVarScope = '0';
    const defaultInputProp = 'originalScore';
    const defaultOutputProp = 'score';
    const defaultTable: any[][] = [];
    
    // header_cells 처리
    if (data.header_cells && Array.isArray(data.header_cells) && data.header_cells.length > 0) {
      const headerObj = data.header_cells[0];
      if (typeof headerObj === 'object' && headerObj !== null && !Array.isArray(headerObj)) {
        this.headerCell = {
          var_scope: headerObj.var_scope || defaultVarScope,
        };
      } else {
        this.headerCell = {
          var_scope: defaultVarScope,
        };
      }
    } else {
      this.headerCell = {
        var_scope: defaultVarScope,
      };
    }
    
    // body_cells 처리
    if (data.body_cells && Array.isArray(data.body_cells) && data.body_cells.length > 0) {
      this.bodyCells = data.body_cells.map((row: any) => {
        if (typeof row === 'object' && row !== null && !Array.isArray(row)) {
          return {
            input_prop: row.input_prop || defaultInputProp,
            output_prop: row.output_prop || defaultOutputProp,
            table: Array.isArray(row.table) ? row.table : defaultTable,
          };
        }
        return {
          input_prop: defaultInputProp,
          output_prop: defaultOutputProp,
          table: defaultTable,
        };
      });
    } else {
      this.bodyCells = [{
        input_prop: defaultInputProp,
        output_prop: defaultOutputProp,
        table: defaultTable,
      }];
    }
  }

  static fromDbFormat(blockId: number, data: BlockInstanceData): ScoreMapBlockInstance {
    return new ScoreMapBlockInstance(blockId, data);
  }

  updateCellValue(rowIndex: number, colIndex: number, elementIndex: number, value: any): void {
    if (rowIndex === -1) {
      if (elementIndex === 0) {
        this.headerCell.var_scope = value;
      }
    } else {
      if (this.bodyCells[rowIndex]) {
        if (elementIndex === 0) {
          this.bodyCells[rowIndex].input_prop = value;
        } else if (elementIndex === 1) {
          this.bodyCells[rowIndex].output_prop = value;
        } else if (elementIndex === 2) {
          this.bodyCells[rowIndex].table = Array.isArray(value) ? value : [];
        }
      }
    }
  }

  addRow(rowIndex?: number): void {
    const newRow = {
      input_prop: 'originalScore',
      output_prop: 'score',
      table: [] as any[][],
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
      name: 'ScoreMap',
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
      return [
        this.bodyCells[rowIndex].input_prop,
        this.bodyCells[rowIndex].output_prop,
        this.bodyCells[rowIndex].table
      ];
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
        input_prop: this.bodyCells[rowIndex].input_prop,
        output_prop: this.bodyCells[rowIndex].output_prop,
        table: this.bodyCells[rowIndex].table,
      };
    }
    return {};
  }

  updateProperty(propertyName: string, value: any, rowIndex?: number, colIndex?: number): void {
    if (propertyName === 'var_scope') {
      this.headerCell.var_scope = value;
    } else if (rowIndex !== undefined && this.bodyCells[rowIndex]) {
      if (propertyName === 'input_prop') {
        this.bodyCells[rowIndex].input_prop = value;
      } else if (propertyName === 'output_prop') {
        this.bodyCells[rowIndex].output_prop = value;
      } else if (propertyName === 'table') {
        this.bodyCells[rowIndex].table = Array.isArray(value) ? value : [];
      }
    }
  }
}

