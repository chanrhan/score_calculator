// lib/blocks/modules/ApplySubject/instance.ts
// B 인스턴스: ApplySubject 블록의 데이터 관리

import { BlockInstance, BlockInstanceData } from '../../BlockInstance';
import { BLOCK_TYPE } from '@/types/block-types';
import { FlowBlockType } from '@/types/block-structure';
import { ApplySubjectStructure } from './structure';
import { toFlowBlockType } from '../common/types';

export class ApplySubjectBlockInstance extends BlockInstance {
  private headerCell: {
    text_content: string;
    include_option: 'include' | 'exclude';
  };
  
  private bodyCells: Array<{
    subject_groups: string[];
  }>;

  constructor(blockId: number, data: BlockInstanceData) {
    super(blockId, BLOCK_TYPE.APPLY_SUBJECT, data);
    
    // 기존 데이터 구조에서 변환 (하위 호환성)
    if (data.header_cells && Array.isArray(data.header_cells) && data.header_cells.length > 0) {
      const headerValues = data.header_cells[0];
      if (Array.isArray(headerValues)) {
        // 기존 형식: [['반영교과', 'include']]
        this.headerCell = {
          text_content: headerValues[0] || '반영교과',
          include_option: (headerValues[1] === 'exclude' ? 'exclude' : 'include') as 'include' | 'exclude',
        };
      } else if (typeof headerValues === 'object' && headerValues !== null) {
        // 새로운 형식: { text_content: '반영교과', include_option: 'include' }
        this.headerCell = {
          text_content: headerValues.text_content || '반영교과',
          include_option: (headerValues.include_option === 'exclude' ? 'exclude' : 'include') as 'include' | 'exclude',
        };
      } else {
        this.headerCell = { text_content: '반영교과', include_option: 'include' };
      }
    } else {
      this.headerCell = { text_content: '반영교과', include_option: 'include' };
    }
    
    // body_cells 변환
    if (data.body_cells && Array.isArray(data.body_cells)) {
      this.bodyCells = data.body_cells.map((row: any) => {
        // 새로운 DB 형식: [{ subject_groups: [['수학', '사회']] }] 또는 [{ subject_groups: ['수학', '사회'] }]
        if (typeof row === 'object' && row !== null && 'subject_groups' in row) {
          if (Array.isArray(row.subject_groups)) {
            // subject_groups가 배열인 경우
            if (row.subject_groups.length > 0 && Array.isArray(row.subject_groups[0])) {
              // 중첩 배열: [['수학', '사회']] -> ['수학', '사회']
              return { subject_groups: row.subject_groups[0].filter((v: any) => v !== null && v !== undefined) };
            } else {
              // 평면 배열: ['수학', '사회']
              return { subject_groups: row.subject_groups.filter((v: any) => v !== null && v !== undefined) };
            }
          }
        }
        // 기존 형식: [['수학', '사회']]
        if (Array.isArray(row) && row.length > 0 && Array.isArray(row[0])) {
          return { subject_groups: row[0].filter((v: any) => v !== null && v !== undefined) };
        }
        return { subject_groups: [] };
      });
    } else {
      this.bodyCells = [{ subject_groups: [] }];
    }
  }

  static fromDbFormat(blockId: number, data: BlockInstanceData): ApplySubjectBlockInstance {
    return new ApplySubjectBlockInstance(blockId, data);
  }

  updateCellValue(rowIndex: number, colIndex: number, elementIndex: number, value: any): void {
    if (rowIndex === -1) {
      // Header 셀 수정
      if (elementIndex === 0) {
        this.headerCell.text_content = value;
      } else if (elementIndex === 1) {
        this.headerCell.include_option = value as 'include' | 'exclude';
      }
    } else {
      // Body 셀 수정
      if (this.bodyCells[rowIndex] && elementIndex === 0) {
        this.bodyCells[rowIndex].subject_groups = Array.isArray(value) ? value : [value];
      }
    }
  }

  addRow(rowIndex?: number): void {
    const newRow = { subject_groups: [] };
    if (rowIndex !== undefined && rowIndex >= 0) {
      this.bodyCells.splice(rowIndex + 1, 0, newRow);
    } else {
      this.bodyCells.push(newRow);
    }
  }

  addColumn(colIndex?: number): void {
    throw new Error('ApplySubject does not support column addition');
  }

  removeRow(rowIndex: number): void {
    if (rowIndex >= 0 && rowIndex < this.bodyCells.length) {
      this.bodyCells.splice(rowIndex, 1);
    }
  }

  removeColumn(colIndex: number): void {
    throw new Error('ApplySubject does not support column removal');
  }

  getStructure(): FlowBlockType {
    // 새로운 구조를 기존 FlowBlockType으로 변환
    return toFlowBlockType(ApplySubjectStructure);
  }

  toDbFormat(): { header_cells: any; body_cells: any } {
    return {
      header_cells: [this.headerCell],
      body_cells: this.bodyCells
    };
  }

  // 렌더링용 헬퍼 메서드
  getHeaderCellValues(colIndex: number): any[] {
    if (colIndex === 0) {
      return [this.headerCell.text_content, this.headerCell.include_option];
    }
    return [];
  }

  getBodyCellValues(rowIndex: number, colIndex: number): any[] {
    if (colIndex === 0 && this.bodyCells[rowIndex]) {
      return [this.bodyCells[rowIndex].subject_groups];
    }
    return [];
  }
}

