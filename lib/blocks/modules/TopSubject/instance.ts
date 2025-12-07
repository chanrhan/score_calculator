// lib/blocks/modules/TopSubject/instance.ts
// B 인스턴스: TopSubject 블록의 데이터 관리

import { BlockInstance, BlockInstanceData } from '../../BlockInstance';
import { BLOCK_TYPE } from '@/types/block-types';
import { FlowBlockType } from '@/types/block-structure';

export class TopSubjectBlockInstance extends BlockInstance {
  private bodyCells: Array<{
    topsubject_option: string;
    target: string;
    top_count: number;
    topsubject_order: Array<string>;
  }>;

  constructor(blockId: number, data: BlockInstanceData) {
    super(blockId, BLOCK_TYPE.TOP_SUBJECT, data);
    
    // 기본값 정의
    const defaultTopsubjectOption = '1'; // 모든 과목 중
    const defaultTarget = 'finalScore';
    const defaultTopCount = 3;
    const defaultTopsubjectOrder: string[] = [];
    
    // body_cells 처리: 기본 1*1
    if (data.body_cells && Array.isArray(data.body_cells) && data.body_cells.length > 0) {
      this.bodyCells = data.body_cells.map((row: any) => {
        if (typeof row === 'object' && row !== null && !Array.isArray(row)) {
          return {
            topsubject_option: row.topsubject_option || defaultTopsubjectOption,
            target: row.target || defaultTarget,
            top_count: row.top_count !== undefined ? Number(row.top_count) : defaultTopCount,
            topsubject_order: Array.isArray(row.topsubject_order) ? row.topsubject_order : defaultTopsubjectOrder,
          };
        }
        return {
          topsubject_option: defaultTopsubjectOption,
          target: defaultTarget,
          top_count: defaultTopCount,
          topsubject_order: defaultTopsubjectOrder,
        };
      });
    } else {
      // 기본 1*1 구조
      this.bodyCells = [{
        topsubject_option: defaultTopsubjectOption,
        target: defaultTarget,
        top_count: defaultTopCount,
        topsubject_order: defaultTopsubjectOrder,
      }];
    }
  }

  static fromDbFormat(blockId: number, data: BlockInstanceData): TopSubjectBlockInstance {
    return new TopSubjectBlockInstance(blockId, data);
  }

  updateCellValue(rowIndex: number, colIndex: number, elementIndex: number, value: any): void {
    if (this.bodyCells[rowIndex]) {
      if (elementIndex === 0) {
        this.bodyCells[rowIndex].topsubject_option = value;
      } else if (elementIndex === 1) {
        this.bodyCells[rowIndex].target = value;
      } else if (elementIndex === 2) {
        this.bodyCells[rowIndex].top_count = Number(value) || 3;
      } else if (elementIndex === 3) {
        this.bodyCells[rowIndex].topsubject_order = Array.isArray(value) ? value : [];
      }
    }
  }

  addRow(rowIndex?: number): void {
    const newRow = {
      topsubject_option: '1',
      target: 'finalScore',
      top_count: 3,
      topsubject_order: [] as string[],
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
        this.bodyCells[rowIndex].topsubject_option,
        this.bodyCells[rowIndex].target,
        this.bodyCells[rowIndex].top_count,
        this.bodyCells[rowIndex].topsubject_order
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
        topsubject_option: this.bodyCells[rowIndex].topsubject_option,
        target: this.bodyCells[rowIndex].target,
        top_count: this.bodyCells[rowIndex].top_count,
        topsubject_order: this.bodyCells[rowIndex].topsubject_order,
      };
    }
    return {};
  }

  updateProperty(propertyName: string, value: any, rowIndex?: number, colIndex?: number): void {
    if (rowIndex !== undefined && this.bodyCells[rowIndex]) {
      if (propertyName === 'topsubject_option') {
        this.bodyCells[rowIndex].topsubject_option = value;
      } else if (propertyName === 'target') {
        this.bodyCells[rowIndex].target = value;
      } else if (propertyName === 'top_count') {
        this.bodyCells[rowIndex].top_count = Number(value) || 3;
      } else if (propertyName === 'topsubject_order') {
        this.bodyCells[rowIndex].topsubject_order = Array.isArray(value) ? value : [];
      }
    }
  }
}
