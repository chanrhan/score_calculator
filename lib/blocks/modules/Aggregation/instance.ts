// lib/blocks/modules/Aggregation/instance.ts
// B 인스턴스: Aggregation 블록의 데이터 관리

import { BlockInstance, BlockInstanceData } from '../../BlockInstance';
import { BLOCK_TYPE } from '@/types/block-types';
import { FlowBlockType } from '@/types/block-structure';

export class AggregationBlockInstance extends BlockInstance {
  private headerCell: {
    variable_scope: string;
  };
  
  private bodyCells: Array<{
    input_score_type: string;
    aggregation_function: string;
    output_score_type: string;
  }>;

  constructor(blockId: number, data: BlockInstanceData) {
    super(blockId, BLOCK_TYPE.AGGREGATION, data);
    
    const defaults = getBlockDefaults(BLOCK_TYPE.AGGREGATION);
    
    // header_cells 처리
    if (data.header_cells && Array.isArray(data.header_cells) && data.header_cells.length > 0) {
      const headerObj = data.header_cells[0];
      if (typeof headerObj === 'object' && headerObj !== null && !Array.isArray(headerObj)) {
        this.headerCell = {
          variable_scope: headerObj.variable_scope || defaults.variable_scope || '0',
        };
      } else {
        this.headerCell = { variable_scope: defaults.variable_scope || '0' };
      }
    } else {
      this.headerCell = { variable_scope: defaults.variable_scope || '0' };
    }
    
    // body_cells 처리
    if (data.body_cells && Array.isArray(data.body_cells) && data.body_cells.length > 0) {
      this.bodyCells = data.body_cells.map((row: any) => {
        if (typeof row === 'object' && row !== null && !Array.isArray(row)) {
          return {
            input_score_type: row.input_type || row.input_score_type || defaults.input_score_type || 'finalScore',
            aggregation_function: row.func || row.aggregation_function || defaults.aggregation_function || '0',
            output_score_type: row.output_type || row.output_score_type || defaults.output_score_type || 'finalScore',
          };
        }
        return {
          input_score_type: defaults.input_score_type || 'finalScore',
          aggregation_function: defaults.aggregation_function || '0',
          output_score_type: defaults.output_score_type || 'finalScore',
        };
      });
    } else {
      this.bodyCells = [{
        input_score_type: defaults.input_score_type || 'finalScore',
        aggregation_function: defaults.aggregation_function || '0',
        output_score_type: defaults.output_score_type || 'finalScore',
      }];
    }
  }

  static fromDbFormat(blockId: number, data: BlockInstanceData): AggregationBlockInstance {
    return new AggregationBlockInstance(blockId, data);
  }

  updateCellValue(rowIndex: number, colIndex: number, elementIndex: number, value: any): void {
    if (rowIndex === -1) {
      if (elementIndex === 1) {
        this.headerCell.variable_scope = value;
      }
    } else {
      if (this.bodyCells[rowIndex]) {
        if (elementIndex === 0) {
          this.bodyCells[rowIndex].input_score_type = value;
        } else if (elementIndex === 1) {
          this.bodyCells[rowIndex].aggregation_function = value;
        } else if (elementIndex === 3) {
          this.bodyCells[rowIndex].output_score_type = value;
        }
      }
    }
  }

  addRow(rowIndex?: number): void {
    const defaults = getBlockDefaults(BLOCK_TYPE.AGGREGATION);
    const newRow = {
      input_score_type: defaults.input_score_type || 'finalScore',
      aggregation_function: defaults.aggregation_function || '0',
      output_score_type: defaults.output_score_type || 'finalScore',
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
      header_cells: [this.headerCell],
      body_cells: this.bodyCells.map(row => ({
        input_type: row.input_score_type,
        func: row.aggregation_function,
        output_type: row.output_score_type,
      }))
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
      return [
        this.bodyCells[rowIndex].input_score_type,
        this.bodyCells[rowIndex].aggregation_function,
        null,
        this.bodyCells[rowIndex].output_score_type
      ];
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
        input_score_type: this.bodyCells[rowIndex].input_score_type,
        aggregation_function: this.bodyCells[rowIndex].aggregation_function,
        output_score_type: this.bodyCells[rowIndex].output_score_type,
      };
    }
    return {};
  }

  updateProperty(propertyName: string, value: any, rowIndex?: number, colIndex?: number): void {
    if (propertyName === 'variable_scope') {
      this.headerCell.variable_scope = value;
    } else if (rowIndex !== undefined && this.bodyCells[rowIndex]) {
      if (propertyName === 'input_score_type') {
        this.bodyCells[rowIndex].input_score_type = value;
      } else if (propertyName === 'aggregation_function') {
        this.bodyCells[rowIndex].aggregation_function = value;
      } else if (propertyName === 'output_score_type') {
        this.bodyCells[rowIndex].output_score_type = value;
      }
    }
  }
}
