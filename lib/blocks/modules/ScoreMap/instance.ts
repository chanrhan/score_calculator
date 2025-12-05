// lib/blocks/modules/ScoreMap/instance.ts
// B 인스턴스: ScoreMap 블록의 데이터 관리

import { BlockInstance, BlockInstanceData } from '../../BlockInstance';
import { BLOCK_TYPE } from '@/types/block-types';
import { FlowBlockType } from '@/types/block-structure';
import { ScoreMapStructure } from './structure';
import { toFlowBlockType } from '../common/types';
import { getBlockDefaults } from '../common/defaults';

export class ScoreMapBlockInstance extends BlockInstance {
  private headerCell: {
    variable_scope: string;
    filter_option: string;
  };
  
  private bodyCells: Array<{
    input_type: string;
    input_range: number;
    output_type: string;
    table: any[];
  }>;

  constructor(blockId: number, data: BlockInstanceData) {
    super(blockId, BLOCK_TYPE.SCORE_MAP, data);
    
    // BlockStructure에서 기본값 가져오기
    const defaults = getBlockDefaults(BLOCK_TYPE.SCORE_MAP);
    
    // header_cells 처리
    if (data.header_cells && Array.isArray(data.header_cells) && data.header_cells.length > 0) {
      const headerObj = data.header_cells[0];
      if (typeof headerObj === 'object' && headerObj !== null && !Array.isArray(headerObj)) {
        this.headerCell = {
          variable_scope: headerObj.variable_scope || defaults.variable_scope || '0',
          filter_option: headerObj.filter_option || defaults.filter_option || '0',
        };
      } else {
        this.headerCell = {
          variable_scope: defaults.variable_scope || '0',
          filter_option: defaults.filter_option || '0',
        };
      }
    } else {
      this.headerCell = {
        variable_scope: defaults.variable_scope || '0',
        filter_option: defaults.filter_option || '0',
      };
    }
    
    // body_cells 처리
    if (data.body_cells && Array.isArray(data.body_cells) && data.body_cells.length > 0) {
      this.bodyCells = data.body_cells.map((row: any) => {
        if (typeof row === 'object' && row !== null && !Array.isArray(row)) {
          return {
            input_type: row.input_type || defaults.input_type || 'originalScore',
            input_range: row.input_range !== undefined ? row.input_range : (defaults.input_range ?? 1),
            output_type: row.output_type || defaults.output_type || 'score',
            table: Array.isArray(row.table) ? row.table : (defaults.table || []),
          };
        }
        return {
          input_type: defaults.input_type || 'originalScore',
          input_range: defaults.input_range ?? 1,
          output_type: defaults.output_type || 'score',
          table: defaults.table || [],
        };
      });
    } else {
      this.bodyCells = [{
        input_type: defaults.input_type || 'originalScore',
        input_range: defaults.input_range ?? 1,
        output_type: defaults.output_type || 'score',
        table: defaults.table || [],
      }];
    }
  }

  static fromDbFormat(blockId: number, data: BlockInstanceData): ScoreMapBlockInstance {
    return new ScoreMapBlockInstance(blockId, data);
  }

  updateCellValue(rowIndex: number, colIndex: number, elementIndex: number, value: any): void {
    if (rowIndex === -1) {
      if (elementIndex === 1) {
        this.headerCell.variable_scope = value;
      } else if (elementIndex === 2) {
        this.headerCell.filter_option = value;
      }
    } else {
      if (this.bodyCells[rowIndex]) {
        if (elementIndex === 0) {
          this.bodyCells[rowIndex].input_type = value;
        } else if (elementIndex === 1) {
          this.bodyCells[rowIndex].input_range = value === 'range' ? 1 : 0;
        } else if (elementIndex === 3) {
          this.bodyCells[rowIndex].output_type = value;
        } else if (elementIndex === 5) {
          this.bodyCells[rowIndex].table = value;
        }
      }
    }
  }

  addRow(rowIndex?: number): void {
    const defaults = getBlockDefaults(BLOCK_TYPE.SCORE_MAP);
    const newRow = {
      input_type: defaults.input_type || 'originalScore',
      input_range: defaults.input_range ?? 1,
      output_type: defaults.output_type || 'score',
      table: defaults.table || [],
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
    return toFlowBlockType(ScoreMapStructure);
  }

  toDbFormat(): { header_cells: any; body_cells: any } {
    return {
      header_cells: [this.headerCell],
      body_cells: this.bodyCells
    };
  }

  getHeaderCellValues(colIndex: number): any[] {
    if (colIndex === 0) {
      return [null, this.headerCell.variable_scope, this.headerCell.filter_option];
    }
    return [];
  }

  getBodyCellValues(rowIndex: number, colIndex: number): any[] {
    if (colIndex === 0 && this.bodyCells[rowIndex]) {
      const inputRange = this.bodyCells[rowIndex].input_range === 1 ? 'range' : 'exact';
      return [
        this.bodyCells[rowIndex].input_type,
        inputRange,
        '→',
        this.bodyCells[rowIndex].output_type,
        'exact',
        this.bodyCells[rowIndex].table
      ];
    }
    return [];
  }

  getHeaderProperties(colIndex: number): Record<string, any> {
    if (colIndex === 0) {
      return {
        variable_scope: this.headerCell.variable_scope,
        filter_option: this.headerCell.filter_option,
      };
    }
    return {};
  }

  getBodyProperties(rowIndex: number, colIndex: number): Record<string, any> {
    if (colIndex === 0 && this.bodyCells[rowIndex]) {
      return {
        input_type: this.bodyCells[rowIndex].input_type,
        input_range: this.bodyCells[rowIndex].input_range,
        output_type: this.bodyCells[rowIndex].output_type,
        table: this.bodyCells[rowIndex].table,
      };
    }
    return {};
  }

  updateProperty(propertyName: string, value: any, rowIndex?: number, colIndex?: number): void {
    if (propertyName === 'variable_scope') {
      this.headerCell.variable_scope = value;
    } else if (propertyName === 'filter_option') {
      this.headerCell.filter_option = value;
    } else if (rowIndex !== undefined && this.bodyCells[rowIndex]) {
      if (propertyName === 'input_type') {
        this.bodyCells[rowIndex].input_type = value;
      } else if (propertyName === 'input_range') {
        this.bodyCells[rowIndex].input_range = value === 'range' ? 1 : 0;
      } else if (propertyName === 'output_type') {
        this.bodyCells[rowIndex].output_type = value;
      } else if (propertyName === 'table') {
        this.bodyCells[rowIndex].table = value;
      }
    }
  }
}

