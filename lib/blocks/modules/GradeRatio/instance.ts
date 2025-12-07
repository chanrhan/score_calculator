// lib/blocks/modules/GradeRatio/instance.ts
// B 인스턴스: GradeRatio 블록의 데이터 관리

import { BlockInstance, BlockInstanceData } from '../../BlockInstance';
import { BLOCK_TYPE } from '@/types/block-types';
import { FlowBlockType } from '@/types/block-structure';

export class GradeRatioBlockInstance extends BlockInstance {
  // 각 열마다 header에 grade, body에 ratio
  private headerCells: Array<{
    grade: string;
  }>;
  
  private bodyCells: Array<{
    ratio: number;
  }>;

  constructor(blockId: number, data: BlockInstanceData) {
    super(blockId, BLOCK_TYPE.GRADE_RATIO, data);
    
    const defaultGrade = '1';
    const defaultRatio = 100;
    
    // header_cells 처리: 기본 1*1, 데이터가 있으면 그대로 사용
    if (data.header_cells && Array.isArray(data.header_cells) && data.header_cells.length > 0) {
      this.headerCells = data.header_cells.map((cell: any) => {
        return { grade: cell?.grade || defaultGrade };
      });
    } else {
      // 기본 1*1 구조
      this.headerCells = [{ grade: defaultGrade }];
    }
    
    // body_cells 처리: 기본 1*1, 데이터가 있으면 그대로 사용
    if (data.body_cells && Array.isArray(data.body_cells) && data.body_cells.length > 0) {
      const row = data.body_cells[0];
      if (Array.isArray(row) && row.length > 0) {
        this.bodyCells = row.map((cell: any) => {
          const ratio = cell?.ratio !== undefined ? Number(cell.ratio) : defaultRatio;
          return { ratio: isNaN(ratio) ? defaultRatio : ratio };
        });
      } else {
        // 기본 1*1 구조
        this.bodyCells = [{ ratio: defaultRatio }];
      }
    } else {
      // 기본 1*1 구조
      this.bodyCells = [{ ratio: defaultRatio }];
    }
    
    // header와 body의 열 개수가 일치하도록 보정
    const maxCols = Math.max(this.headerCells.length, this.bodyCells.length);
    while (this.headerCells.length < maxCols) {
      this.headerCells.push({ grade: String(this.headerCells.length + 1) });
    }
    while (this.bodyCells.length < maxCols) {
      this.bodyCells.push({ ratio: defaultRatio });
    }
  }

  static fromDbFormat(blockId: number, data: BlockInstanceData): GradeRatioBlockInstance {
    return new GradeRatioBlockInstance(blockId, data);
  }

  updateCellValue(rowIndex: number, colIndex: number, elementIndex: number, value: any): void {
    if (rowIndex === -1) {
      // Header 셀 업데이트
      if (this.headerCells[colIndex] && elementIndex === 0) {
        this.headerCells[colIndex].grade = value?.toString() || '1';
      }
    } else {
      // Body 셀 업데이트
      if (this.bodyCells[colIndex] && elementIndex === 0) {
        this.bodyCells[colIndex].ratio = Number(value) || 100;
      }
    }
  }

  addRow(rowIndex?: number): void {
    // GradeRatio는 행 추가 불가 (body는 항상 1개 행)
    throw new Error('GradeRatio does not support row addition');
  }

  addColumn(colIndex?: number): void {
    const newGrade = String(this.headerCells.length + 1);
    const newRatio = 100;
    
    if (colIndex === undefined || colIndex >= this.headerCells.length) {
      // 끝에 추가
      this.headerCells.push({ grade: newGrade });
      this.bodyCells.push({ ratio: newRatio });
    } else {
      // 지정된 위치에 추가
      this.headerCells.splice(colIndex, 0, { grade: newGrade });
      this.bodyCells.splice(colIndex, 0, { ratio: newRatio });
    }
  }

  removeRow(rowIndex: number): void {
    // GradeRatio는 행 삭제 불가 (body는 항상 1개 행)
    throw new Error('GradeRatio does not support row removal');
  }

  removeColumn(colIndex: number): void {
    if (this.headerCells.length <= 1) {
      throw new Error('Cannot remove the last column');
    }
    if (colIndex >= 0 && colIndex < this.headerCells.length) {
      this.headerCells.splice(colIndex, 1);
      this.bodyCells.splice(colIndex, 1);
    }
  }

  getStructure(): FlowBlockType {
    // BlockInstance 내에서 직접 구조 생성 (structure.ts 제거)
    return {
      name: 'GradeRatio',
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
      return [this.headerCells[colIndex].grade];
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
        grade: this.headerCells[colIndex].grade,
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
    if (colIndex !== undefined) {
      if (propertyName === 'grade' && (rowIndex === undefined || rowIndex === -1)) {
        // Header 셀 업데이트
        if (this.headerCells[colIndex]) {
          this.headerCells[colIndex].grade = value?.toString() || '1';
        }
      } else if (propertyName === 'ratio' && rowIndex === 0) {
        // Body 셀 업데이트
        if (this.bodyCells[colIndex]) {
          this.bodyCells[colIndex].ratio = Number(value) || 100;
        }
      }
    }
  }
}
