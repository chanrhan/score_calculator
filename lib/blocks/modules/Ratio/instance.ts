// lib/blocks/modules/Ratio/instance.ts
// B 인스턴스: Ratio 블록의 데이터 관리

import { BlockInstance, BlockInstanceData } from '../../BlockInstance';
import { BLOCK_TYPE } from '@/types/block-types';
import { FlowBlockType } from '@/types/block-structure';

export class RatioBlockInstance extends BlockInstance {
  private bodyCells: Array<{
    ratio: number;
    input_prop?: string;
  }>;

  constructor(blockId: number, data: BlockInstanceData) {
    super(blockId, BLOCK_TYPE.RATIO, data);
    
    // 기본값 정의
    const defaultRatio = 100;
    const defaultInputProp = 'finalScore';
    
    // body_cells 처리: 기본 1*1
    if (data.body_cells && Array.isArray(data.body_cells) && data.body_cells.length > 0) {
      this.bodyCells = data.body_cells.map((row: any) => {
        if (typeof row === 'object' && row !== null && !Array.isArray(row)) {
          const ratio = row.ratio !== undefined ? Number(row.ratio) : defaultRatio;
          return {
            ratio: isNaN(ratio) ? defaultRatio : ratio,
            input_prop: row.input_prop || defaultInputProp,
          };
        }
        return {
          ratio: defaultRatio,
          input_prop: defaultInputProp,
        };
      });
    } else {
      // 기본 1*1 구조
      this.bodyCells = [{
        ratio: defaultRatio,
        input_prop: defaultInputProp,
      }];
    }
  }

  static fromDbFormat(blockId: number, data: BlockInstanceData): RatioBlockInstance {
    return new RatioBlockInstance(blockId, data);
  }

  updateCellValue(rowIndex: number, colIndex: number, elementIndex: number, value: any): void {
    if (this.bodyCells[rowIndex]) {
      if (elementIndex === 0) {
        this.bodyCells[rowIndex].input_prop = value || 'finalScore';
      } else if (elementIndex === 1) {
        this.bodyCells[rowIndex].ratio = Number(value) || 100;
      }
    }
  }

  addRow(rowIndex?: number): void {
    const newRow = {
      ratio: 100,
      input_prop: 'finalScore',
    };
    if (rowIndex !== undefined && rowIndex >= 0) {
      this.bodyCells.splice(rowIndex + 1, 0, newRow);
    } else {
      this.bodyCells.push(newRow);
    }
  }

  addColumn(colIndex?: number): void {
    throw new Error('Ratio does not support column addition');
  }

  removeRow(rowIndex: number): void {
    if (rowIndex >= 0 && rowIndex < this.bodyCells.length) {
      this.bodyCells.splice(rowIndex, 1);
    }
  }

  removeColumn(colIndex: number): void {
    throw new Error('Ratio does not support column removal');
  }

  getStructure(): FlowBlockType {
    // BlockInstance 내에서 직접 구조 생성 (structure.ts 제거)
    return {
      name: 'Ratio',
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
        this.bodyCells[rowIndex].input_prop || 'finalScore',
        this.bodyCells[rowIndex].ratio
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
        ratio: this.bodyCells[rowIndex].ratio,
        input_prop: this.bodyCells[rowIndex].input_prop || 'finalScore',
      };
    }
    return {};
  }

  updateProperty(propertyName: string, value: any, rowIndex?: number, colIndex?: number): void {
    if (rowIndex !== undefined && this.bodyCells[rowIndex]) {
      if (propertyName === 'ratio') {
        this.bodyCells[rowIndex].ratio = Number(value) || 100;
      } else if (propertyName === 'input_prop') {
        this.bodyCells[rowIndex].input_prop = value || 'finalScore';
      }
    }
  }
}
