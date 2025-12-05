// lib/blocks/modules/Condition/instance.ts
// B 인스턴스: Condition 블록의 데이터 관리

import { BlockInstance, BlockInstanceData } from '../../BlockInstance';
import { BLOCK_TYPE } from '@/types/block-types';
import { FlowBlockType } from '@/types/block-structure';
import { ConditionStructure } from './structure';
import { toFlowBlockType } from '../common/types';
import { getBlockDefaults } from '../common/defaults';

export class ConditionBlockInstance extends BlockInstance {
  private headerCell: {
    variable_scope: string;
  };
  
  private bodyCells: Array<{
    conditions: any[];
  }>;

  constructor(blockId: number, data: BlockInstanceData) {
    super(blockId, BLOCK_TYPE.CONDITION, data);
    
    const defaults = getBlockDefaults(BLOCK_TYPE.CONDITION);
    
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
            conditions: Array.isArray(row.conditions) ? row.conditions : (defaults.conditions || []),
          };
        }
        return { conditions: defaults.conditions || [] };
      });
    } else {
      this.bodyCells = [{ conditions: defaults.conditions || [] }];
    }
  }

  static fromDbFormat(blockId: number, data: BlockInstanceData): ConditionBlockInstance {
    return new ConditionBlockInstance(blockId, data);
  }

  updateCellValue(rowIndex: number, colIndex: number, elementIndex: number, value: any): void {
    if (rowIndex === -1) {
      if (elementIndex === 1) {
        this.headerCell.variable_scope = value;
      }
    } else {
      if (this.bodyCells[rowIndex] && elementIndex === 0) {
        this.bodyCells[rowIndex].conditions = Array.isArray(value) ? value : [];
      }
    }
  }

  addRow(rowIndex?: number): void {
    const defaults = getBlockDefaults(BLOCK_TYPE.CONDITION);
    const newRow = { conditions: defaults.conditions || [] };
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
    return toFlowBlockType(ConditionStructure);
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
      return [this.bodyCells[rowIndex].conditions];
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
        conditions: this.bodyCells[rowIndex].conditions,
      };
    }
    return {};
  }

  updateProperty(propertyName: string, value: any, rowIndex?: number, colIndex?: number): void {
    if (propertyName === 'variable_scope') {
      this.headerCell.variable_scope = value;
    } else if (propertyName === 'conditions' && rowIndex !== undefined && this.bodyCells[rowIndex]) {
      this.bodyCells[rowIndex].conditions = Array.isArray(value) ? value : [];
    }
  }
}
