// lib/blocks/modules/Decimal/instance.ts
// B 인스턴스: Decimal 블록의 데이터 관리

import { BlockInstance, BlockInstanceData } from '../../BlockInstance';
import { BLOCK_TYPE } from '@/types/block-types';
import { FlowBlockType } from '@/types/block-structure';

export class DecimalBlockInstance extends BlockInstance {
  private bodyCells: Array<{
    input_prop: string;
    decimal_place: number;
    decimal_func: string;
  }>;

  constructor(blockId: number, data: BlockInstanceData) {
    super(blockId, BLOCK_TYPE.DECIMAL, data);
    
    // 기본값 정의
    const defaultInputProp = 'finalScore';
    const defaultDecimalPlace = 2;
    const defaultDecimalFunc = '0';
    
    // body_cells 처리
    if (data.body_cells && Array.isArray(data.body_cells) && data.body_cells.length > 0) {
      this.bodyCells = data.body_cells.map((row: any) => {
        if (typeof row === 'object' && row !== null && !Array.isArray(row)) {
          const decimalPlace = row.decimal_place !== undefined ? Number(row.decimal_place) : defaultDecimalPlace;
          return {
            input_prop: row.input_prop || defaultInputProp,
            decimal_place: isNaN(decimalPlace) ? defaultDecimalPlace : decimalPlace,
            decimal_func: row.decimal_func || defaultDecimalFunc,
          };
        }
        return {
          input_prop: defaultInputProp,
          decimal_place: defaultDecimalPlace,
          decimal_func: defaultDecimalFunc,
        };
      });
    } else {
      this.bodyCells = [{
        input_prop: defaultInputProp,
        decimal_place: defaultDecimalPlace,
        decimal_func: defaultDecimalFunc,
      }];
    }
  }

  static fromDbFormat(blockId: number, data: BlockInstanceData): DecimalBlockInstance {
    return new DecimalBlockInstance(blockId, data);
  }

  updateCellValue(rowIndex: number, colIndex: number, elementIndex: number, value: any): void {
    if (this.bodyCells[rowIndex]) {
      if (elementIndex === 0) {
        this.bodyCells[rowIndex].input_prop = value;
      } else if (elementIndex === 1) {
        this.bodyCells[rowIndex].decimal_place = Number(value) || 2;
      } else if (elementIndex === 2) {
        this.bodyCells[rowIndex].decimal_func = value;
      }
    }
  }

  addRow(rowIndex?: number): void {
    const newRow = {
      input_prop: 'finalScore',
      decimal_place: 2,
      decimal_func: '0',
    };
    if (rowIndex !== undefined && rowIndex >= 0) {
      this.bodyCells.splice(rowIndex + 1, 0, newRow);
    } else {
      this.bodyCells.push(newRow);
    }
  }

  addColumn(colIndex?: number): void {
    throw new Error('Decimal does not support column addition');
  }

  removeRow(rowIndex: number): void {
    if (rowIndex >= 0 && rowIndex < this.bodyCells.length) {
      this.bodyCells.splice(rowIndex, 1);
    }
  }

  removeColumn(colIndex: number): void {
    throw new Error('Decimal does not support column removal');
  }

  getStructure(): FlowBlockType {
    // BlockInstance 내에서 직접 구조 생성 (structure.ts 제거)
    return {
      name: 'Decimal',
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
        this.bodyCells[rowIndex].decimal_place,
        this.bodyCells[rowIndex].decimal_func
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
        decimal_place: this.bodyCells[rowIndex].decimal_place,
        decimal_func: this.bodyCells[rowIndex].decimal_func,
      };
    }
    return {};
  }

  updateProperty(propertyName: string, value: any, rowIndex?: number, colIndex?: number): void {
    if (rowIndex !== undefined && this.bodyCells[rowIndex]) {
      if (propertyName === 'input_prop') {
        this.bodyCells[rowIndex].input_prop = value;
      } else if (propertyName === 'decimal_place') {
        this.bodyCells[rowIndex].decimal_place = Number(value) || 2;
      } else if (propertyName === 'decimal_func') {
        this.bodyCells[rowIndex].decimal_func = value;
      }
    }
  }
}
