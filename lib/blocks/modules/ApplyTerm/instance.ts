// lib/blocks/modules/ApplyTerm/instance.ts
// B 인스턴스: ApplyTerm 블록의 데이터 관리

import { BlockInstance, BlockInstanceData } from '../../BlockInstance';
import { BLOCK_TYPE } from '@/types/block-types';
import { FlowBlockType } from '@/types/block-structure';

export class ApplyTermBlockInstance extends BlockInstance {
  private headerCell: {
    include_option: string;
  };
  
  private bodyCells: Array<{
    terms: string;
    top_count: number;
  }>;

  constructor(blockId: number, data: BlockInstanceData) {
    super(blockId, BLOCK_TYPE.APPLY_TERM, data);
    
    // 기본값 정의
    const defaultIncludeOption = '0';
    const defaultTerms = '';
    const defaultTopCount = 0;
    
    // header_cells 처리
    if (data.header_cells && Array.isArray(data.header_cells) && data.header_cells.length > 0) {
      const headerObj = data.header_cells[0];
      if (typeof headerObj === 'object' && headerObj !== null && !Array.isArray(headerObj)) {
        this.headerCell = {
          include_option: headerObj.include_option || defaultIncludeOption,
        };
      } else {
        this.headerCell = { include_option: defaultIncludeOption };
      }
    } else {
      this.headerCell = { include_option: defaultIncludeOption };
    }
    
    // body_cells 처리: 기본 1*1
    if (data.body_cells && Array.isArray(data.body_cells) && data.body_cells.length > 0) {
      this.bodyCells = data.body_cells.map((row: any) => {
        if (typeof row === 'object' && row !== null && !Array.isArray(row)) {
          return {
            terms: row.terms !== undefined ? String(row.terms) : defaultTerms,
            top_count: row.top_count !== undefined ? Number(row.top_count) : defaultTopCount,
          };
        }
        return {
          terms: defaultTerms,
          top_count: defaultTopCount,
        };
      });
    } else {
      // 기본 1*1 구조
      this.bodyCells = [{
        terms: defaultTerms,
        top_count: defaultTopCount,
      }];
    }
  }

  static fromDbFormat(blockId: number, data: BlockInstanceData): ApplyTermBlockInstance {
    return new ApplyTermBlockInstance(blockId, data);
  }

  updateCellValue(rowIndex: number, colIndex: number, elementIndex: number, value: any): void {
    if (rowIndex === -1) {
      if (elementIndex === 0) {
        this.headerCell.include_option = value;
      }
    } else {
      if (this.bodyCells[rowIndex]) {
        if (elementIndex === 0) {
          this.bodyCells[rowIndex].terms = String(value);
        } else if (elementIndex === 1) {
          this.bodyCells[rowIndex].top_count = Number(value) || 0;
        }
      }
    }
  }

  addRow(rowIndex?: number): void {
    const newRow = {
      terms: '',
      top_count: 0,
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
    // BlockInstance 내에서 직접 구조 생성 (structure.ts 제거)
    return {
      name: 'ApplyTerm',
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

  getHeaderCellValues(colIndex: number): any[] {
    if (colIndex === 0) {
      return [this.headerCell.include_option];
    }
    return [];
  }

  getBodyCellValues(rowIndex: number, colIndex: number): any[] {
    if (colIndex === 0 && this.bodyCells[rowIndex]) {
      return [
        this.bodyCells[rowIndex].terms,
        this.bodyCells[rowIndex].top_count,
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
        terms: this.bodyCells[rowIndex].terms,
        top_count: this.bodyCells[rowIndex].top_count,
      };
    }
    return {};
  }

  updateProperty(propertyName: string, value: any, rowIndex?: number, colIndex?: number): void {
    if (propertyName === 'include_option') {
      this.headerCell.include_option = value;
    } else if (rowIndex !== undefined && this.bodyCells[rowIndex]) {
      if (propertyName === 'terms') {
        this.bodyCells[rowIndex].terms = String(value);
      } else if (propertyName === 'top_count') {
        this.bodyCells[rowIndex].top_count = Number(value) || 0;
      }
    }
  }
}
