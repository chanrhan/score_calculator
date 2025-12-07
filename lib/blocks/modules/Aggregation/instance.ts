// lib/blocks/modules/Aggregation/instance.ts
// B 인스턴스: Aggregation 블록의 데이터 관리

import { BlockInstance, BlockInstanceData } from '../../BlockInstance';
import { BLOCK_TYPE } from '@/types/block-types';
import { FlowBlockType } from '@/types/block-structure';

export class AggregationBlockInstance extends BlockInstance {
  private bodyCells: Array<{
    input_prop: string;
    func: string;
    output_prop: string;
  }>;

  constructor(blockId: number, data: BlockInstanceData) {
    super(blockId, BLOCK_TYPE.AGGREGATION, data);
    
    // 기본값 정의
    const defaultInputProp = 'finalScore';
    const defaultFunc = '0';
    const defaultOutputProp = 'finalScore';
    
    // body_cells 처리
    if (data.body_cells && Array.isArray(data.body_cells) && data.body_cells.length > 0) {
      this.bodyCells = data.body_cells.map((row: any) => {
        if (typeof row === 'object' && row !== null && !Array.isArray(row)) {
          return {
            input_prop: row.input_prop || defaultInputProp,
            func: row.func || defaultFunc,
            output_prop: row.output_prop || defaultOutputProp,
          };
        }
        return {
          input_prop: defaultInputProp,
          func: defaultFunc,
          output_prop: defaultOutputProp,
        };
      });
    } else {
      this.bodyCells = [{
        input_prop: defaultInputProp,
        func: defaultFunc,
        output_prop: defaultOutputProp,
      }];
    }
  }

  static fromDbFormat(blockId: number, data: BlockInstanceData): AggregationBlockInstance {
    return new AggregationBlockInstance(blockId, data);
  }

  updateCellValue(rowIndex: number, colIndex: number, elementIndex: number, value: any): void {
    if (this.bodyCells[rowIndex]) {
      if (elementIndex === 0) {
        this.bodyCells[rowIndex].input_prop = value;
      } else if (elementIndex === 1) {
        this.bodyCells[rowIndex].func = value;
      } else if (elementIndex === 2) {
        this.bodyCells[rowIndex].output_prop = value;
      }
    }
  }

  addRow(rowIndex?: number): void {
    const newRow = {
      input_prop: 'finalScore',
      func: '0',
      output_prop: 'finalScore',
    };
    if (rowIndex !== undefined && rowIndex >= 0) {
      this.bodyCells.splice(rowIndex + 1, 0, newRow);
    } else {
      this.bodyCells.push(newRow);
    }
  }

  addColumn(colIndex?: number): void {
    throw new Error('Aggregation does not support column addition');
  }

  removeRow(rowIndex: number): void {
    if (rowIndex >= 0 && rowIndex < this.bodyCells.length) {
      this.bodyCells.splice(rowIndex, 1);
    }
  }

  removeColumn(colIndex: number): void {
    throw new Error('Aggregation does not support column removal');
  }

  getStructure(): FlowBlockType {
    // BlockInstance 내에서 직접 구조 생성 (structure.ts 제거)
    return {
      name: 'Aggregation',
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
        this.bodyCells[rowIndex].input_prop,
        this.bodyCells[rowIndex].func,
        this.bodyCells[rowIndex].output_prop
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
        input_prop: this.bodyCells[rowIndex].input_prop,
        func: this.bodyCells[rowIndex].func,
        output_prop: this.bodyCells[rowIndex].output_prop,
      };
    }
    return {};
  }

  updateProperty(propertyName: string, value: any, rowIndex?: number, colIndex?: number): void {
    if (rowIndex !== undefined && this.bodyCells[rowIndex]) {
      if (propertyName === 'input_prop') {
        this.bodyCells[rowIndex].input_prop = value;
      } else if (propertyName === 'func') {
        this.bodyCells[rowIndex].func = value;
      } else if (propertyName === 'output_prop') {
        this.bodyCells[rowIndex].output_prop = value;
      }
    }
  }
}
