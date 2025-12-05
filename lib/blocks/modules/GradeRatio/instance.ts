// lib/blocks/modules/GradeRatio/instance.ts
// B 인스턴스: GradeRatio 블록의 데이터 관리

import { BlockInstance, BlockInstanceData } from '../../BlockInstance';
import { BLOCK_TYPE } from '@/types/block-types';
import { FlowBlockType } from '@/types/block-structure';
import { GradeRatioStructure } from './structure';
import { toFlowBlockType } from '../common/types';
import { getBlockDefaults } from '../common/defaults';

export class GradeRatioBlockInstance extends BlockInstance {
  private headerCells: Array<{
    grade1_ratio: string;
  }>;
  
  private bodyCells: Array<{
    grade2_ratio: string;
    grade3_ratio: string;
  }>;

  constructor(blockId: number, data: BlockInstanceData) {
    super(blockId, BLOCK_TYPE.GRADE_RATIO, data);
    
    const defaults = getBlockDefaults(BLOCK_TYPE.GRADE_RATIO);
    
    // header_cells 처리 (3개 열)
    if (data.header_cells && Array.isArray(data.header_cells) && data.header_cells.length >= 3) {
      this.headerCells = [
        { grade1_ratio: data.header_cells[0]?.grade1_ratio || defaults.grade1_ratio || '100' },
        { grade1_ratio: data.header_cells[1]?.grade1_ratio || defaults.grade1_ratio || '100' },
        { grade1_ratio: data.header_cells[2]?.grade1_ratio || defaults.grade1_ratio || '100' },
      ];
    } else {
      this.headerCells = [
        { grade1_ratio: defaults.grade1_ratio || '100' },
        { grade1_ratio: defaults.grade1_ratio || '100' },
        { grade1_ratio: defaults.grade1_ratio || '100' },
      ];
    }
    
    // body_cells 처리 (3개 열)
    if (data.body_cells && Array.isArray(data.body_cells) && data.body_cells.length > 0) {
      const row = data.body_cells[0];
      if (Array.isArray(row) && row.length >= 3) {
        this.bodyCells = [
          { grade2_ratio: row[0]?.grade2_ratio || defaults.grade2_ratio || '100', grade3_ratio: row[0]?.grade3_ratio || defaults.grade3_ratio || '100' },
          { grade2_ratio: row[1]?.grade2_ratio || defaults.grade2_ratio || '100', grade3_ratio: row[1]?.grade3_ratio || defaults.grade3_ratio || '100' },
          { grade2_ratio: row[2]?.grade2_ratio || defaults.grade2_ratio || '100', grade3_ratio: row[2]?.grade3_ratio || defaults.grade3_ratio || '100' },
        ];
      } else {
        this.bodyCells = [
          { grade2_ratio: defaults.grade2_ratio || '100', grade3_ratio: defaults.grade3_ratio || '100' },
          { grade2_ratio: defaults.grade2_ratio || '100', grade3_ratio: defaults.grade3_ratio || '100' },
          { grade2_ratio: defaults.grade2_ratio || '100', grade3_ratio: defaults.grade3_ratio || '100' },
        ];
      }
    } else {
      this.bodyCells = [
        { grade2_ratio: defaults.grade2_ratio || '100', grade3_ratio: defaults.grade3_ratio || '100' },
        { grade2_ratio: defaults.grade2_ratio || '100', grade3_ratio: defaults.grade3_ratio || '100' },
        { grade2_ratio: defaults.grade2_ratio || '100', grade3_ratio: defaults.grade3_ratio || '100' },
      ];
    }
  }

  static fromDbFormat(blockId: number, data: BlockInstanceData): GradeRatioBlockInstance {
    return new GradeRatioBlockInstance(blockId, data);
  }

  updateCellValue(rowIndex: number, colIndex: number, elementIndex: number, value: any): void {
    if (rowIndex === -1) {
      if (this.headerCells[colIndex]) {
        this.headerCells[colIndex].grade1_ratio = value?.toString() || '100';
      }
    } else {
      if (this.bodyCells[colIndex]) {
        if (elementIndex === 0) {
          this.bodyCells[colIndex].grade2_ratio = value?.toString() || '100';
        } else if (elementIndex === 1) {
          this.bodyCells[colIndex].grade3_ratio = value?.toString() || '100';
        }
      }
    }
  }

  addRow(rowIndex?: number): void {
    throw new Error('GradeRatio does not support row addition');
  }

  addColumn(colIndex?: number): void {
    throw new Error('GradeRatio does not support column addition');
  }

  removeRow(rowIndex: number): void {
    throw new Error('GradeRatio does not support row removal');
  }

  removeColumn(colIndex: number): void {
    throw new Error('GradeRatio does not support column removal');
  }

  getStructure(): FlowBlockType {
    return toFlowBlockType(GradeRatioStructure);
  }

  toDbFormat(): { header_cells: any; body_cells: any } {
    return {
      header_cells: this.headerCells,
      body_cells: [this.bodyCells]
    };
  }

  getHeaderCellValues(colIndex: number): any[] {
    if (this.headerCells[colIndex]) {
      return [this.headerCells[colIndex].grade1_ratio];
    }
    return [];
  }

  getBodyCellValues(rowIndex: number, colIndex: number): any[] {
    if (rowIndex === 0 && this.bodyCells[colIndex]) {
      return [
        this.bodyCells[colIndex].grade2_ratio,
        this.bodyCells[colIndex].grade3_ratio
      ];
    }
    return [];
  }

  getHeaderProperties(colIndex: number): Record<string, any> {
    if (this.headerCells[colIndex]) {
      return {
        grade1_ratio: this.headerCells[colIndex].grade1_ratio,
      };
    }
    return {};
  }

  getBodyProperties(rowIndex: number, colIndex: number): Record<string, any> {
    if (rowIndex === 0 && this.bodyCells[colIndex]) {
      return {
        grade2_ratio: this.bodyCells[colIndex].grade2_ratio,
        grade3_ratio: this.bodyCells[colIndex].grade3_ratio,
      };
    }
    return {};
  }

  updateProperty(propertyName: string, value: any, rowIndex?: number, colIndex?: number): void {
    if (propertyName === 'grade1_ratio' && colIndex !== undefined && this.headerCells[colIndex]) {
      this.headerCells[colIndex].grade1_ratio = value?.toString() || '100';
    } else if (rowIndex === 0 && colIndex !== undefined && this.bodyCells[colIndex]) {
      if (propertyName === 'grade2_ratio') {
        this.bodyCells[colIndex].grade2_ratio = value?.toString() || '100';
      } else if (propertyName === 'grade3_ratio') {
        this.bodyCells[colIndex].grade3_ratio = value?.toString() || '100';
      }
    }
  }
}
