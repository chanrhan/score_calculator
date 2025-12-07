// lib/blocks/modules/SubjectGroupRatio/instance.ts
// B 인스턴스: SubjectGroupRatio 블록의 데이터 관리

import { BlockInstance, BlockInstanceData } from '../../BlockInstance';
import { BLOCK_TYPE } from '@/types/block-types';
import { FlowBlockType } from '@/types/block-structure';

export class SubjectGroupRatioBlockInstance extends BlockInstance {
  // 동적 열 구조: 각 열마다 header와 body 셀
  private headerCells: Array<{
    subject_groups: string[];
  }>;
  
  private bodyCells: Array<{
    ratio: number;
  }>;

  constructor(blockId: number, data: BlockInstanceData) {
    super(blockId, BLOCK_TYPE.SUBJECT_GROUP_RATIO, data);
    
    // 기본값 정의
    const defaultSubjectGroups: string[] = [];
    const defaultRatio = 100;
    
    // header_cells 처리: 기본 1*1
    if (data.header_cells && Array.isArray(data.header_cells) && data.header_cells.length > 0) {
      this.headerCells = data.header_cells.map((cell: any) => {
        if (typeof cell === 'object' && cell !== null && !Array.isArray(cell)) {
          return {
            subject_groups: Array.isArray(cell.subject_groups) ? cell.subject_groups : defaultSubjectGroups,
          };
        }
        return { subject_groups: defaultSubjectGroups };
      });
    } else {
      // 기본 1*1 구조
      this.headerCells = [{ subject_groups: defaultSubjectGroups }];
    }
    
    // body_cells 처리 (동적 열)
    if (data.body_cells && Array.isArray(data.body_cells) && data.body_cells.length > 0) {
      const row = data.body_cells[0];
      if (Array.isArray(row)) {
        this.bodyCells = row.map((cell: any) => {
          if (typeof cell === 'object' && cell !== null && !Array.isArray(cell)) {
            const ratio = cell.ratio !== undefined ? Number(cell.ratio) : defaultRatio;
            return {
              ratio: isNaN(ratio) ? defaultRatio : ratio,
            };
          }
          return { ratio: defaultRatio };
        });
      } else {
        this.bodyCells = [{ ratio: defaultRatio }];
      }
    } else {
      // header_cells 개수에 맞춰 body_cells 생성
      this.bodyCells = this.headerCells.map(() => ({ ratio: defaultRatio }));
    }
    
    // header와 body 열 개수 맞추기
    while (this.bodyCells.length < this.headerCells.length) {
      this.bodyCells.push({ ratio: defaultRatio });
    }
    while (this.headerCells.length < this.bodyCells.length) {
      this.headerCells.push({ subject_groups: defaultSubjectGroups });
    }
  }

  static fromDbFormat(blockId: number, data: BlockInstanceData): SubjectGroupRatioBlockInstance {
    return new SubjectGroupRatioBlockInstance(blockId, data);
  }

  updateCellValue(rowIndex: number, colIndex: number, elementIndex: number, value: any): void {
    if (rowIndex === -1) {
      if (this.headerCells[colIndex] && elementIndex === 0) {
        this.headerCells[colIndex].subject_groups = Array.isArray(value) ? value : [];
      }
    } else {
      if (this.bodyCells[colIndex] && elementIndex === 0) {
        this.bodyCells[colIndex].ratio = Number(value) || 100;
      }
    }
  }

  addRow(rowIndex?: number): void {
    throw new Error('SubjectGroupRatio does not support row addition');
  }

  addColumn(colIndex?: number): void {
    const newHeaderCell = { subject_groups: [] as string[] };
    const newBodyCell = { ratio: 100 };
    
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
    // BlockInstance 내에서 직접 구조 생성 (structure.ts 제거)
    return {
      name: 'SubjectGroupRatio',
      color: 'blue',
      col_editable: true, // 열 추가 가능
      cols: [{
        header: { elements: [] },
        rows: [{ elements: [] }]
      }]
    };
  }

  toDbFormat(): { header_cells: any; body_cells: any } {
    return {
      header_cells: this.headerCells,
      body_cells: [this.bodyCells]
    };
  }

  getHeaderCellValues(colIndex: number): any[] {
    if (this.headerCells[colIndex]) {
      return [this.headerCells[colIndex].subject_groups];
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
        subject_groups: this.headerCells[colIndex].subject_groups,
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
    if (propertyName === 'subject_groups' && colIndex !== undefined && this.headerCells[colIndex]) {
      this.headerCells[colIndex].subject_groups = Array.isArray(value) ? value : [];
    } else if (propertyName === 'ratio' && rowIndex === 0 && colIndex !== undefined && this.bodyCells[colIndex]) {
      this.bodyCells[colIndex].ratio = Number(value) || 100;
    }
  }
}
