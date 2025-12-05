// lib/blocks/modules/ApplyTerm/instance.ts
// B 인스턴스: ApplyTerm 블록의 데이터 관리

import { BlockInstance, BlockInstanceData } from '../../BlockInstance';
import { BLOCK_TYPE } from '@/types/block-types';
import { FlowBlockType } from '@/types/block-structure';
import { ApplyTermStructure } from './structure';
import { toFlowBlockType } from '../common/types';
import { getBlockDefaults } from '../common/defaults';

export class ApplyTermBlockInstance extends BlockInstance {
  private headerCell: {
    include_option: string;
  };
  
  private bodyCells: Array<{
    term_1_1: string;
    term_1_2: string;
    term_2_1: string;
    term_2_2: string;
    term_3_1: string;
    term_3_2: string;
    top_terms: string | null;
  }>;

  constructor(blockId: number, data: BlockInstanceData) {
    super(blockId, BLOCK_TYPE.APPLY_TERM, data);
    
    const defaults = getBlockDefaults(BLOCK_TYPE.APPLY_TERM);
    
    // header_cells 처리
    if (data.header_cells && Array.isArray(data.header_cells) && data.header_cells.length > 0) {
      const headerObj = data.header_cells[0];
      if (typeof headerObj === 'object' && headerObj !== null && !Array.isArray(headerObj)) {
        this.headerCell = {
          include_option: headerObj.include_option || defaults.include_option || 'include',
        };
      } else {
        this.headerCell = { include_option: defaults.include_option || 'include' };
      }
    } else {
      this.headerCell = { include_option: defaults.include_option || 'include' };
    }
    
    // body_cells 처리
    if (data.body_cells && Array.isArray(data.body_cells) && data.body_cells.length > 0) {
      this.bodyCells = data.body_cells.map((row: any) => {
        if (typeof row === 'object' && row !== null && !Array.isArray(row)) {
          return {
            term_1_1: row.term_1_1 || defaults.term_1_1 || '1-1:on',
            term_1_2: row.term_1_2 || defaults.term_1_2 || '1-2:on',
            term_2_1: row.term_2_1 || defaults.term_2_1 || '2-1:on',
            term_2_2: row.term_2_2 || defaults.term_2_2 || '2-2:on',
            term_3_1: row.term_3_1 || defaults.term_3_1 || '3-1:on',
            term_3_2: row.term_3_2 || defaults.term_3_2 || '3-2:on',
            top_terms: row.top_terms !== undefined ? row.top_terms : (defaults.top_terms ?? null),
          };
        }
        return {
          term_1_1: defaults.term_1_1 || '1-1:on',
          term_1_2: defaults.term_1_2 || '1-2:on',
          term_2_1: defaults.term_2_1 || '2-1:on',
          term_2_2: defaults.term_2_2 || '2-2:on',
          term_3_1: defaults.term_3_1 || '3-1:on',
          term_3_2: defaults.term_3_2 || '3-2:on',
          top_terms: defaults.top_terms ?? null,
        };
      });
    } else {
      this.bodyCells = [{
        term_1_1: defaults.term_1_1 || '1-1:on',
        term_1_2: defaults.term_1_2 || '1-2:on',
        term_2_1: defaults.term_2_1 || '2-1:on',
        term_2_2: defaults.term_2_2 || '2-2:on',
        term_3_1: defaults.term_3_1 || '3-1:on',
        term_3_2: defaults.term_3_2 || '3-2:on',
        top_terms: defaults.top_terms ?? null,
      }];
    }
  }

  static fromDbFormat(blockId: number, data: BlockInstanceData): ApplyTermBlockInstance {
    return new ApplyTermBlockInstance(blockId, data);
  }

  updateCellValue(rowIndex: number, colIndex: number, elementIndex: number, value: any): void {
    if (rowIndex === -1) {
      if (elementIndex === 1) {
        this.headerCell.include_option = value;
      }
    } else {
      if (this.bodyCells[rowIndex]) {
        const termMap: Record<number, keyof typeof this.bodyCells[0]> = {
          1: 'term_1_1',
          2: 'term_1_2',
          3: 'term_2_1',
          4: 'term_2_2',
          5: 'term_3_1',
          6: 'term_3_2',
          7: 'top_terms',
        };
        const propName = termMap[elementIndex];
        if (propName) {
          (this.bodyCells[rowIndex] as any)[propName] = value;
        }
      }
    }
  }

  addRow(rowIndex?: number): void {
    const defaults = getBlockDefaults(BLOCK_TYPE.APPLY_TERM);
    const newRow = {
      term_1_1: defaults.term_1_1 || '1-1:on',
      term_1_2: defaults.term_1_2 || '1-2:on',
      term_2_1: defaults.term_2_1 || '2-1:on',
      term_2_2: defaults.term_2_2 || '2-2:on',
      term_3_1: defaults.term_3_1 || '3-1:on',
      term_3_2: defaults.term_3_2 || '3-2:on',
      top_terms: defaults.top_terms ?? null,
    };
    if (rowIndex !== undefined && rowIndex >= 0) {
      this.bodyCells.splice(rowIndex + 1, 0, newRow);
    } else {
      this.bodyCells.push(newRow);
    }
  }

  addColumn(colIndex?: number): void {
    throw new Error('ApplyTerm does not support column addition');
  }

  removeRow(rowIndex: number): void {
    if (rowIndex >= 0 && rowIndex < this.bodyCells.length) {
      this.bodyCells.splice(rowIndex, 1);
    }
  }

  removeColumn(colIndex: number): void {
    throw new Error('ApplyTerm does not support column removal');
  }

  getStructure(): FlowBlockType {
    return toFlowBlockType(ApplyTermStructure);
  }

  toDbFormat(): { header_cells: any; body_cells: any } {
    return {
      header_cells: [this.headerCell],
      body_cells: this.bodyCells
    };
  }

  getHeaderCellValues(colIndex: number): any[] {
    if (colIndex === 0) {
      return [null, this.headerCell.include_option];
    }
    return [];
  }

  getBodyCellValues(rowIndex: number, colIndex: number): any[] {
    if (colIndex === 0 && this.bodyCells[rowIndex]) {
      return [
        null,
        this.bodyCells[rowIndex].term_1_1,
        this.bodyCells[rowIndex].term_1_2,
        this.bodyCells[rowIndex].term_2_1,
        this.bodyCells[rowIndex].term_2_2,
        this.bodyCells[rowIndex].term_3_1,
        this.bodyCells[rowIndex].term_3_2,
        this.bodyCells[rowIndex].top_terms,
      ];
    }
    return [];
  }

  getHeaderProperties(colIndex: number): Record<string, any> {
    if (colIndex === 0) {
      return {
        include_option: this.headerCell.include_option,
      };
    }
    return {};
  }

  getBodyProperties(rowIndex: number, colIndex: number): Record<string, any> {
    if (colIndex === 0 && this.bodyCells[rowIndex]) {
      return {
        term_1_1: this.bodyCells[rowIndex].term_1_1,
        term_1_2: this.bodyCells[rowIndex].term_1_2,
        term_2_1: this.bodyCells[rowIndex].term_2_1,
        term_2_2: this.bodyCells[rowIndex].term_2_2,
        term_3_1: this.bodyCells[rowIndex].term_3_1,
        term_3_2: this.bodyCells[rowIndex].term_3_2,
        top_terms: this.bodyCells[rowIndex].top_terms,
      };
    }
    return {};
  }

  updateProperty(propertyName: string, value: any, rowIndex?: number, colIndex?: number): void {
    if (propertyName === 'include_option') {
      this.headerCell.include_option = value;
    } else if (rowIndex !== undefined && this.bodyCells[rowIndex]) {
      if (propertyName in this.bodyCells[rowIndex]) {
        (this.bodyCells[rowIndex] as any)[propertyName] = value;
      }
    }
  }
}
