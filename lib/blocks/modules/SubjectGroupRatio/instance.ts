// lib/blocks/modules/SubjectGroupRatio/instance.ts
// B 인스턴스: SubjectGroupRatio 블록의 데이터 관리

import { BlockInstance, BlockInstanceData } from '../../BlockInstance';
import { BLOCK_TYPE } from '@/types/block-types';
import { FlowBlockType } from '@/types/block-structure';
import { SubjectGroupRatioStructure } from './structure';
import { toFlowBlockType } from '../common/types';
import { getBlockDefaults } from '../common/defaults';

export class SubjectGroupRatioBlockInstance extends BlockInstance {
  // 동적 열 구조: 각 열마다 header와 body 셀
  private headerCells: Array<{
    subject_group: string | null;
  }>;
  
  private bodyCells: Array<{
    ratio: string;
  }>;

  constructor(blockId: number, data: BlockInstanceData) {
    super(blockId, BLOCK_TYPE.SUBJECT_GROUP_RATIO, data);
    
    const defaults = getBlockDefaults(BLOCK_TYPE.SUBJECT_GROUP_RATIO);
    const defaultColumns = Array.isArray(defaults.columns) ? defaults.columns : [];
    
    // header_cells 처리 (동적 열)
    if (data.header_cells && Array.isArray(data.header_cells) && data.header_cells.length > 0) {
      this.headerCells = data.header_cells.map((cell: any) => {
        if (typeof cell === 'object' && cell !== null && !Array.isArray(cell)) {
          return {
            subject_group: cell.subject_group !== undefined ? cell.subject_group : null,
          };
        }
        return { subject_group: null };
      });
    } else {
      // 기본값으로 최소 1개 열 생성
      this.headerCells = defaultColumns.length > 0 
        ? defaultColumns.map((col: any) => ({ subject_group: col.subject_group || null }))
        : [{ subject_group: null }];
    }
    
    // body_cells 처리 (동적 열)
    if (data.body_cells && Array.isArray(data.body_cells) && data.body_cells.length > 0) {
      const row = data.body_cells[0];
      if (Array.isArray(row)) {
        this.bodyCells = row.map((cell: any) => {
          if (typeof cell === 'object' && cell !== null && !Array.isArray(cell)) {
            return {
              ratio: cell.ratio?.toString() || '100',
            };
          }
          return { ratio: '100' };
        });
      } else {
        this.bodyCells = [{ ratio: '100' }];
      }
    } else {
      // header_cells 개수에 맞춰 body_cells 생성
      this.bodyCells = this.headerCells.map(() => ({ ratio: '100' }));
    }
    
    // header와 body 열 개수 맞추기
    while (this.bodyCells.length < this.headerCells.length) {
      this.bodyCells.push({ ratio: '100' });
    }
    while (this.headerCells.length < this.bodyCells.length) {
      this.headerCells.push({ subject_group: null });
    }
  }

  static fromDbFormat(blockId: number, data: BlockInstanceData): SubjectGroupRatioBlockInstance {
    return new SubjectGroupRatioBlockInstance(blockId, data);
  }

  updateCellValue(rowIndex: number, colIndex: number, elementIndex: number, value: any): void {
    if (rowIndex === -1) {
      if (this.headerCells[colIndex]) {
        this.headerCells[colIndex].subject_group = value;
      }
    } else {
      if (this.bodyCells[colIndex]) {
        this.bodyCells[colIndex].ratio = value?.toString() || '100';
      }
    }
  }

  addRow(rowIndex?: number): void {
    throw new Error('SubjectGroupRatio does not support row addition');
  }

  addColumn(colIndex?: number): void {
    const newHeaderCell = { subject_group: null };
    const newBodyCell = { ratio: '100' };
    
    if (colIndex !== undefined && colIndex >= 0) {
      this.headerCells.splice(colIndex + 1, 0, newHeaderCell);
      this.bodyCells.splice(colIndex + 1, 0, newBodyCell);
    } else {
      this.headerCells.push(newHeaderCell);
      this.bodyCells.push(newBodyCell);
    }
  }

  removeRow(rowIndex: number): void {
    throw new Error('SubjectGroupRatio does not support row removal');
  }

  removeColumn(colIndex: number): void {
    if (colIndex >= 0 && colIndex < this.headerCells.length) {
      this.headerCells.splice(colIndex, 1);
      this.bodyCells.splice(colIndex, 1);
    }
  }

  getStructure(): FlowBlockType {
    return toFlowBlockType(SubjectGroupRatioStructure);
  }

  toDbFormat(): { header_cells: any; body_cells: any } {
    return {
      header_cells: this.headerCells,
      body_cells: [this.bodyCells]
    };
  }

  getHeaderCellValues(colIndex: number): any[] {
    if (this.headerCells[colIndex]) {
      return [this.headerCells[colIndex].subject_group];
    }
    return [];
  }

  getBodyCellValues(rowIndex: number, colIndex: number): any[] {
    if (rowIndex === 0 && this.bodyCells[colIndex]) {
      return [this.bodyCells[colIndex].ratio];
    }
    return [];
  }

  getHeaderProperties(colIndex: number): Record<string, any> {
    if (this.headerCells[colIndex]) {
      return {
        subject_group: this.headerCells[colIndex].subject_group,
      };
    }
    return {};
  }

  getBodyProperties(rowIndex: number, colIndex: number): Record<string, any> {
    if (rowIndex === 0 && this.bodyCells[colIndex]) {
      return {
        ratio: this.bodyCells[colIndex].ratio,
      };
    }
    return {};
  }

  updateProperty(propertyName: string, value: any, rowIndex?: number, colIndex?: number): void {
    if (propertyName === 'subject_group' && colIndex !== undefined && this.headerCells[colIndex]) {
      this.headerCells[colIndex].subject_group = value;
    } else if (propertyName === 'ratio' && rowIndex === 0 && colIndex !== undefined && this.bodyCells[colIndex]) {
      this.bodyCells[colIndex].ratio = value?.toString() || '100';
    }
  }
}
