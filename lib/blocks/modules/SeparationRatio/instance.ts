// lib/blocks/modules/SeparationRatio/instance.ts
// B 인스턴스: SeparationRatio 블록의 데이터 관리

import { BlockInstance, BlockInstanceData } from '../../BlockInstance';
import { BLOCK_TYPE } from '@/types/block-types';
import { FlowBlockType } from '@/types/block-structure';
import { SeparationRatioStructure } from './structure';
import { toFlowBlockType } from '../common/types';
import { getBlockDefaults } from '../common/defaults';

export class SeparationRatioBlockInstance extends BlockInstance {
  private headerCells: Array<{
    general_ratio: string;
  }>;
  
  private bodyCells: Array<{
    career_ratio: string;
    arts_ratio: string;
  }>;

  constructor(blockId: number, data: BlockInstanceData) {
    super(blockId, BLOCK_TYPE.SEPARATION_RATIO, data);
    
    const defaults = getBlockDefaults(BLOCK_TYPE.SEPARATION_RATIO);
    
    // header_cells 처리 (3개 열)
    if (data.header_cells && Array.isArray(data.header_cells) && data.header_cells.length >= 3) {
      this.headerCells = [
        { general_ratio: data.header_cells[0]?.general_ratio || defaults.general_ratio || '100' },
        { general_ratio: data.header_cells[1]?.general_ratio || defaults.general_ratio || '100' },
        { general_ratio: data.header_cells[2]?.general_ratio || defaults.general_ratio || '100' },
      ];
    } else {
      this.headerCells = [
        { general_ratio: defaults.general_ratio || '100' },
        { general_ratio: defaults.general_ratio || '100' },
        { general_ratio: defaults.general_ratio || '100' },
      ];
    }
    
    // body_cells 처리 (3개 열)
    if (data.body_cells && Array.isArray(data.body_cells) && data.body_cells.length > 0) {
      const row = data.body_cells[0];
      if (Array.isArray(row) && row.length >= 3) {
        this.bodyCells = [
          { career_ratio: row[0]?.career_ratio || defaults.career_ratio || '100', arts_ratio: row[0]?.arts_ratio || defaults.arts_ratio || '100' },
          { career_ratio: row[1]?.career_ratio || defaults.career_ratio || '100', arts_ratio: row[1]?.arts_ratio || defaults.arts_ratio || '100' },
          { career_ratio: row[2]?.career_ratio || defaults.career_ratio || '100', arts_ratio: row[2]?.arts_ratio || defaults.arts_ratio || '100' },
        ];
      } else {
        this.bodyCells = [
          { career_ratio: defaults.career_ratio || '100', arts_ratio: defaults.arts_ratio || '100' },
          { career_ratio: defaults.career_ratio || '100', arts_ratio: defaults.arts_ratio || '100' },
          { career_ratio: defaults.career_ratio || '100', arts_ratio: defaults.arts_ratio || '100' },
        ];
      }
    } else {
      this.bodyCells = [
        { career_ratio: defaults.career_ratio || '100', arts_ratio: defaults.arts_ratio || '100' },
        { career_ratio: defaults.career_ratio || '100', arts_ratio: defaults.arts_ratio || '100' },
        { career_ratio: defaults.career_ratio || '100', arts_ratio: defaults.arts_ratio || '100' },
      ];
    }
  }

  static fromDbFormat(blockId: number, data: BlockInstanceData): SeparationRatioBlockInstance {
    return new SeparationRatioBlockInstance(blockId, data);
  }

  updateCellValue(rowIndex: number, colIndex: number, elementIndex: number, value: any): void {
    if (rowIndex === -1) {
      if (this.headerCells[colIndex]) {
        this.headerCells[colIndex].general_ratio = value?.toString() || '100';
      }
    } else {
      if (this.bodyCells[colIndex]) {
        if (elementIndex === 0) {
          this.bodyCells[colIndex].career_ratio = value?.toString() || '100';
        } else if (elementIndex === 1) {
          this.bodyCells[colIndex].arts_ratio = value?.toString() || '100';
        }
      }
    }
  }

  addRow(rowIndex?: number): void {
    throw new Error('SeparationRatio does not support row addition');
  }

  addColumn(colIndex?: number): void {
    throw new Error('SeparationRatio does not support column addition');
  }

  removeRow(rowIndex: number): void {
    throw new Error('SeparationRatio does not support row removal');
  }

  removeColumn(colIndex: number): void {
    throw new Error('SeparationRatio does not support column removal');
  }

  getStructure(): FlowBlockType {
    return toFlowBlockType(SeparationRatioStructure);
  }

  toDbFormat(): { header_cells: any; body_cells: any } {
    return {
      header_cells: this.headerCells,
      body_cells: [this.bodyCells]
    };
  }

  getHeaderCellValues(colIndex: number): any[] {
    if (this.headerCells[colIndex]) {
      return [this.headerCells[colIndex].general_ratio];
    }
    return [];
  }

  getBodyCellValues(rowIndex: number, colIndex: number): any[] {
    if (rowIndex === 0 && this.bodyCells[colIndex]) {
      return [
        this.bodyCells[colIndex].career_ratio,
        this.bodyCells[colIndex].arts_ratio
      ];
    }
    return [];
  }

  getHeaderProperties(colIndex: number): Record<string, any> {
    if (this.headerCells[colIndex]) {
      return {
        general_ratio: this.headerCells[colIndex].general_ratio,
      };
    }
    return {};
  }

  getBodyProperties(rowIndex: number, colIndex: number): Record<string, any> {
    if (rowIndex === 0 && this.bodyCells[colIndex]) {
      return {
        career_ratio: this.bodyCells[colIndex].career_ratio,
        arts_ratio: this.bodyCells[colIndex].arts_ratio,
      };
    }
    return {};
  }

  updateProperty(propertyName: string, value: any, rowIndex?: number, colIndex?: number): void {
    if (propertyName === 'general_ratio' && colIndex !== undefined && this.headerCells[colIndex]) {
      this.headerCells[colIndex].general_ratio = value?.toString() || '100';
    } else if (rowIndex === 0 && colIndex !== undefined && this.bodyCells[colIndex]) {
      if (propertyName === 'career_ratio') {
        this.bodyCells[colIndex].career_ratio = value?.toString() || '100';
      } else if (propertyName === 'arts_ratio') {
        this.bodyCells[colIndex].arts_ratio = value?.toString() || '100';
      }
    }
  }
}
