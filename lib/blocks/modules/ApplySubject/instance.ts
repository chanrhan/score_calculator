// lib/blocks/modules/ApplySubject/instance.ts
// B 인스턴스: ApplySubject 블록의 데이터 관리

import { BlockInstance, BlockInstanceData } from '../../BlockInstance';
import { BLOCK_TYPE } from '@/types/block-types';
import { FlowBlockType } from '@/types/block-structure';

export class ApplySubjectBlockInstance extends BlockInstance {
  private headerCell: {
    include_option: 'include' | 'exclude';
  };
  
  private bodyCells: Array<{
    subject_groups: string[];
  }>;

  constructor(blockId: number, data: BlockInstanceData) {
    super(blockId, BLOCK_TYPE.APPLY_SUBJECT, data);
    
    // 기본값 정의 (structure.ts 제거)
    const defaultIncludeOption = 'include';
    const defaultSubjectGroups: string[] = [];
    
    // header_cells 처리: 새로운 형식만 지원
    if (data.header_cells && Array.isArray(data.header_cells) && data.header_cells.length > 0) {
      const headerObj = data.header_cells[0];
      if (typeof headerObj === 'object' && headerObj !== null && !Array.isArray(headerObj)) {
        // 객체 형식: { include_option } (text_content는 제거됨)
        this.headerCell = {
          include_option: (headerObj.include_option || defaultIncludeOption) as 'include' | 'exclude',
        };
      } else {
        // 데이터가 없거나 형식이 맞지 않으면 기본값 사용
        this.headerCell = {
          include_option: defaultIncludeOption as 'include' | 'exclude',
        };
      }
    } else {
      // 데이터가 없으면 기본값 사용
      this.headerCell = {
        include_option: defaultIncludeOption as 'include' | 'exclude',
      };
    }
    
    // body_cells 처리: 새로운 형식만 지원
    if (data.body_cells && Array.isArray(data.body_cells) && data.body_cells.length > 0) {
      this.bodyCells = data.body_cells.map((row: any) => {
        if (typeof row === 'object' && row !== null && 'subject_groups' in row) {
          // 객체 형식: { subject_groups: [...] }
          const subjectGroups = Array.isArray(row.subject_groups) 
            ? row.subject_groups.filter((v: any) => v !== null && v !== undefined)
            : defaultSubjectGroups;
          return { subject_groups: subjectGroups };
        }
        // 형식이 맞지 않으면 기본값 사용
        return { subject_groups: Array.isArray(defaultSubjectGroups) ? [...defaultSubjectGroups] : [] };
      });
    } else {
      // 데이터가 없으면 기본값 사용
      this.bodyCells = [{
        subject_groups: Array.isArray(defaultSubjectGroups) ? [...defaultSubjectGroups] : []
      }];
    }
  }

  static fromDbFormat(blockId: number, data: BlockInstanceData): ApplySubjectBlockInstance {
    return new ApplySubjectBlockInstance(blockId, data);
  }

  updateCellValue(rowIndex: number, colIndex: number, elementIndex: number, value: any): void {
    if (rowIndex === -1) {
      // Header 셀 수정 (text_content는 제거됨)
      if (elementIndex === 0) {
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
    // 기본값 사용
    const defaultSubjectGroups: string[] = [];
    const newRow = { subject_groups: defaultSubjectGroups };
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
    // BlockInstance 내에서 직접 구조 생성 (structure.ts 제거)
    return {
      name: 'ApplySubject',
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
      body_cells: this.bodyCells
    };
  }

  // 렌더링용 헬퍼 메서드
  getHeaderCellValues(colIndex: number): any[] {
    if (colIndex === 0) {
      return [null, this.headerCell.include_option]; // text_content는 제거됨
    }
    return [];
  }

  getBodyCellValues(rowIndex: number, colIndex: number): any[] {
    if (colIndex === 0 && this.bodyCells[rowIndex]) {
      return [this.bodyCells[rowIndex].subject_groups];
    }
    return [];
  }

  // 속성 기반 접근 메서드
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
        subject_groups: this.bodyCells[rowIndex].subject_groups,
      };
    }
    return {};
  }

  updateProperty(propertyName: string, value: any, rowIndex?: number, colIndex?: number): void {
    if (propertyName === 'include_option') {
      this.headerCell.include_option = value as 'include' | 'exclude';
    } else if (propertyName === 'subject_groups' && rowIndex !== undefined && this.bodyCells[rowIndex]) {
      this.bodyCells[rowIndex].subject_groups = Array.isArray(value) ? value : [value];
    }
  }
}

