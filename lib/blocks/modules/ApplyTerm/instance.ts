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
    term_1_1: boolean;
    term_1_2: boolean;
    term_2_1: boolean;
    term_2_2: boolean;
    term_3_1: boolean;
    term_3_2: boolean;
    top_count: number;
    use_top_count?: boolean;
  }>;

  constructor(blockId: number, data: BlockInstanceData) {
    super(blockId, BLOCK_TYPE.APPLY_TERM, data);
    
    // 기본값 정의
    const defaultIncludeOption = '0';
    const defaultTermValue = false;
    const defaultTopCount = 0;
    const defaultUseTopCount = false;
    
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
          // 기존 terms 문자열이 있으면 파싱하여 마이그레이션
          let term_1_1 = defaultTermValue;
          let term_1_2 = defaultTermValue;
          let term_2_1 = defaultTermValue;
          let term_2_2 = defaultTermValue;
          let term_3_1 = defaultTermValue;
          let term_3_2 = defaultTermValue;

          if (row.terms !== undefined && typeof row.terms === 'string' && row.terms.trim() !== '') {
            // 기존 문자열 형식 파싱 (예: "1-1|1-2|2-1")
            const terms = row.terms.split('|').map((t: string) => t.trim());
            term_1_1 = terms.includes('1-1');
            term_1_2 = terms.includes('1-2');
            term_2_1 = terms.includes('2-1');
            term_2_2 = terms.includes('2-2');
            term_3_1 = terms.includes('3-1');
            term_3_2 = terms.includes('3-2');
          } else {
            // 새로운 boolean 속성 사용
            term_1_1 = row.term_1_1 !== undefined ? Boolean(row.term_1_1) : defaultTermValue;
            term_1_2 = row.term_1_2 !== undefined ? Boolean(row.term_1_2) : defaultTermValue;
            term_2_1 = row.term_2_1 !== undefined ? Boolean(row.term_2_1) : defaultTermValue;
            term_2_2 = row.term_2_2 !== undefined ? Boolean(row.term_2_2) : defaultTermValue;
            term_3_1 = row.term_3_1 !== undefined ? Boolean(row.term_3_1) : defaultTermValue;
            term_3_2 = row.term_3_2 !== undefined ? Boolean(row.term_3_2) : defaultTermValue;
          }

          return {
            term_1_1,
            term_1_2,
            term_2_1,
            term_2_2,
            term_3_1,
            term_3_2,
            top_count: row.top_count !== undefined ? Number(row.top_count) : defaultTopCount,
            use_top_count: row.use_top_count !== undefined ? Boolean(row.use_top_count) : defaultUseTopCount,
          };
        }
        return {
          term_1_1: defaultTermValue,
          term_1_2: defaultTermValue,
          term_2_1: defaultTermValue,
          term_2_2: defaultTermValue,
          term_3_1: defaultTermValue,
          term_3_2: defaultTermValue,
          top_count: defaultTopCount,
          use_top_count: defaultUseTopCount,
        };
      });
    } else {
      // 기본 1*1 구조
      this.bodyCells = [{
        term_1_1: defaultTermValue,
        term_1_2: defaultTermValue,
        term_2_1: defaultTermValue,
        term_2_2: defaultTermValue,
        term_3_1: defaultTermValue,
        term_3_2: defaultTermValue,
        top_count: defaultTopCount,
        use_top_count: defaultUseTopCount,
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
        // 체크박스 속성 업데이트 (elementIndex: 0=term_1_1, 1=term_1_2, 2=term_2_1, 3=term_2_2, 4=term_3_1, 5=term_3_2)
        const termMap: { [key: number]: keyof typeof this.bodyCells[0] } = {
          0: 'term_1_1',
          1: 'term_1_2',
          2: 'term_2_1',
          3: 'term_2_2',
          4: 'term_3_1',
          5: 'term_3_2',
        };
        if (termMap[elementIndex]) {
          (this.bodyCells[rowIndex] as any)[termMap[elementIndex]] = Boolean(value);
        }
      }
    }
  }

  addRow(rowIndex?: number): void {
    const newRow = {
      term_1_1: false,
      term_1_2: false,
      term_2_1: false,
      term_2_2: false,
      term_3_1: false,
      term_3_2: false,
      top_count: 0,
      use_top_count: false,
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
        this.bodyCells[rowIndex].term_1_1,
        this.bodyCells[rowIndex].term_1_2,
        this.bodyCells[rowIndex].term_2_1,
        this.bodyCells[rowIndex].term_2_2,
        this.bodyCells[rowIndex].term_3_1,
        this.bodyCells[rowIndex].term_3_2,
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
        term_1_1: this.bodyCells[rowIndex].term_1_1,
        term_1_2: this.bodyCells[rowIndex].term_1_2,
        term_2_1: this.bodyCells[rowIndex].term_2_1,
        term_2_2: this.bodyCells[rowIndex].term_2_2,
        term_3_1: this.bodyCells[rowIndex].term_3_1,
        term_3_2: this.bodyCells[rowIndex].term_3_2,
        top_count: this.bodyCells[rowIndex].top_count,
        use_top_count: this.bodyCells[rowIndex].use_top_count || false,
      };
    }
    return {};
  }

  updateProperty(propertyName: string, value: any, rowIndex?: number, colIndex?: number): void {
    if (propertyName === 'include_option') {
      this.headerCell.include_option = value;
    } else if (rowIndex !== undefined && this.bodyCells[rowIndex]) {
      if (propertyName === 'term_1_1' || propertyName === 'term_1_2' || 
          propertyName === 'term_2_1' || propertyName === 'term_2_2' || 
          propertyName === 'term_3_1' || propertyName === 'term_3_2') {
        (this.bodyCells[rowIndex] as any)[propertyName] = Boolean(value);
      } else if (propertyName === 'top_count') {
        this.bodyCells[rowIndex].top_count = Number(value) || 0;
      } else if (propertyName === 'use_top_count') {
        this.bodyCells[rowIndex].use_top_count = Boolean(value);
      }
    }
  }
}
