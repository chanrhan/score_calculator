// lib/blocks/modules/TopSubject/instance.ts
// B 인스턴스: TopSubject 블록의 데이터 관리

import { BlockInstance, BlockInstanceData } from '../../BlockInstance';
import { BLOCK_TYPE } from '@/types/block-types';
import { FlowBlockType } from '@/types/block-structure';

export class TopSubjectBlockInstance extends BlockInstance {
  private bodyCells: Array<{
    top_subject_scope: string | null;
    top_subject_count: string;
  }>;

  constructor(blockId: number, data: BlockInstanceData) {
    super(blockId, BLOCK_TYPE.TOP_SUBJECT, data);
    
    // 기본값 정의 (structure.ts 제거)
    const defaultTopSubjectScope: string | null = null;
    const defaultTopSubjectCount = '3';
    
    // body_cells 처리: 기본 1*1
    if (data.body_cells && Array.isArray(data.body_cells) && data.body_cells.length > 0) {
      this.bodyCells = data.body_cells.map((row: any) => {
        if (typeof row === 'object' && row !== null && !Array.isArray(row)) {
          return {
            top_subject_scope: row.top_subject_scope !== undefined ? row.top_subject_scope : defaultTopSubjectScope,
            top_subject_count: row.top_subject_count || defaultTopSubjectCount,
          };
        }
        return {
          top_subject_scope: defaultTopSubjectScope,
          top_subject_count: defaultTopSubjectCount,
        };
      });
    } else {
      // 기본 1*1 구조
      this.bodyCells = [{
        top_subject_scope: defaultTopSubjectScope,
        top_subject_count: defaultTopSubjectCount,
      }];
    }
  }

  static fromDbFormat(blockId: number, data: BlockInstanceData): TopSubjectBlockInstance {
    return new TopSubjectBlockInstance(blockId, data);
  }

  updateCellValue(rowIndex: number, colIndex: number, elementIndex: number, value: any): void {
    if (this.bodyCells[rowIndex]) {
      if (elementIndex === 0) {
        this.bodyCells[rowIndex].top_subject_scope = value;
      } else if (elementIndex === 1) {
        this.bodyCells[rowIndex].top_subject_count = value?.toString() || '3';
      }
    }
  }

  addRow(rowIndex?: number): void {
    const defaultTopSubjectScope: string | null = null;
    const defaultTopSubjectCount = '3';
    const newRow = {
      top_subject_scope: defaultTopSubjectScope,
      top_subject_count: defaultTopSubjectCount,
    };
    if (rowIndex !== undefined && rowIndex >= 0) {
      this.bodyCells.splice(rowIndex + 1, 0, newRow);
    } else {
      this.bodyCells.push(newRow);
    }
  }

  addColumn(colIndex?: number): void {
    throw new Error('TopSubject does not support column addition');
  }

  removeRow(rowIndex: number): void {
    if (rowIndex >= 0 && rowIndex < this.bodyCells.length) {
      this.bodyCells.splice(rowIndex, 1);
    }
  }

  removeColumn(colIndex: number): void {
    throw new Error('TopSubject does not support column removal');
  }

  getStructure(): FlowBlockType {
    // BlockInstance 내에서 직접 구조 생성 (structure.ts 제거)
    return {
      name: 'TopSubject',
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
        this.bodyCells[rowIndex].top_subject_scope,
        this.bodyCells[rowIndex].top_subject_count
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
        top_subject_scope: this.bodyCells[rowIndex].top_subject_scope,
        top_subject_count: this.bodyCells[rowIndex].top_subject_count,
      };
    }
    return {};
  }

  updateProperty(propertyName: string, value: any, rowIndex?: number, colIndex?: number): void {
    if (rowIndex !== undefined && this.bodyCells[rowIndex]) {
      if (propertyName === 'top_subject_scope') {
        this.bodyCells[rowIndex].top_subject_scope = value;
      } else if (propertyName === 'top_subject_count') {
        this.bodyCells[rowIndex].top_subject_count = value?.toString() || '3';
      }
    }
  }
}
