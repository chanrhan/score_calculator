// lib/blocks/BlockInstance.ts
// 블록 인스턴스 객체지향 설계 (리팩토링 명세서 기반)

import { FlowBlockType, FlowBlock, HierarchicalCell } from '@/types/block-structure';
import { BLOCK_TYPE } from '@/types/block-types';
import { getBlockType } from '@/types/block-structure';

// 블록 인스턴스 데이터 타입
export interface BlockInstanceData {
  header_cells: any;
  body_cells: any;
}

// 기본 블록 인스턴스 추상 클래스
export abstract class BlockInstance {
  protected constructor(
    public readonly block_id: number,
    public readonly block_type: number,
    protected data: BlockInstanceData
  ) {}

  // 공통 메서드
  abstract updateCellValue(rowIndex: number, colIndex: number, elementIndex: number, value: any): void;
  abstract addRow(rowIndex?: number): void;
  abstract addColumn(colIndex?: number): void;
  abstract removeRow(rowIndex: number): void;
  abstract removeColumn(colIndex: number): void;
  
  // 데이터 직렬화 (DB 저장용)
  abstract toDbFormat(): { header_cells: any; body_cells: any };
  
  // 구조 정의 참조
  abstract getStructure(): FlowBlockType;
  
  // FlowBlock 형식으로 변환 (기존 호환성)
  toFlowBlock(): FlowBlock {
    const dbFormat = this.toDbFormat();
    return {
      block_id: this.block_id,
      block_type: this.block_type,
      header_cells: Array.isArray(dbFormat.header_cells) ? dbFormat.header_cells : [dbFormat.header_cells],
      body_cells: dbFormat.body_cells,
    };
  }
}

// ApplySubject 블록 인스턴스
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
      } else if (typeof headerValues === 'object') {
        // 새로운 형식: { text_content: '반영교과', include_option: 'include' }
        this.headerCell = {
          text_content: headerValues.text_content || '반영교과',
          include_option: headerValues.include_option || 'include',
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
        if (Array.isArray(row) && row.length > 0) {
          const cellValues = row[0];
          if (Array.isArray(cellValues)) {
            // 기존 형식: [[['국어', '수학']]]
            return { subject_groups: cellValues.filter((v: any) => v !== null && v !== undefined) };
          } else if (typeof cellValues === 'object' && cellValues.subject_groups) {
            // 새로운 형식: [{ subject_groups: ['국어', '수학'] }]
            return { subject_groups: cellValues.subject_groups };
          }
        }
        return { subject_groups: [] };
      });
    } else {
      this.bodyCells = [];
    }
  }

  updateCellValue(rowIndex: number, colIndex: number, elementIndex: number, value: any): void {
    if (rowIndex === -1) {
      // 헤더 셀 업데이트
      if (elementIndex === 0) {
        this.headerCell.text_content = value;
      } else if (elementIndex === 1) {
        this.headerCell.include_option = value;
      }
    } else {
      // 바디 셀 업데이트
      if (!this.bodyCells[rowIndex]) {
        this.bodyCells[rowIndex] = { subject_groups: [] };
      }
      this.bodyCells[rowIndex].subject_groups = Array.isArray(value) ? value : [value];
    }
  }

  addRow(rowIndex?: number): void {
    const newRow = { subject_groups: [] };
    if (rowIndex !== undefined) {
      this.bodyCells.splice(rowIndex, 0, newRow);
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
    return getBlockType('ApplySubject');
  }

  toDbFormat(): { header_cells: any; body_cells: any } {
    return {
      header_cells: [this.headerCell],
      body_cells: this.bodyCells
    };
  }

  // 타입 안전한 접근자
  getIncludeOption(): 'include' | 'exclude' {
    return this.headerCell.include_option;
  }

  getSubjectGroups(rowIndex: number): string[] {
    return this.bodyCells[rowIndex]?.subject_groups || [];
  }

  // DB 데이터로부터 생성
  static fromDbFormat(blockId: number, dbData: any): ApplySubjectBlockInstance {
    return new ApplySubjectBlockInstance(blockId, {
      header_cells: dbData.header_cells || [],
      body_cells: dbData.body_cells || []
    });
  }
}

// Division 블록 인스턴스
export class DivisionBlockInstance extends BlockInstance {
  private headerCells: Array<{
    division_criteria: string;
  }>;
  
  private bodyCells: HierarchicalCell[];

  constructor(blockId: number, data: BlockInstanceData) {
    super(blockId, BLOCK_TYPE.DIVISION, data);
    
    // header_cells 변환
    if (data.header_cells && Array.isArray(data.header_cells)) {
      this.headerCells = data.header_cells.map((cell: any) => {
        if (typeof cell === 'string') {
          // 기존 형식: ['gender', 'grade']
          return { division_criteria: cell };
        } else if (typeof cell === 'object' && cell.division_criteria) {
          // 새로운 형식: [{ division_criteria: 'gender' }]
          return { division_criteria: cell.division_criteria };
        }
        return { division_criteria: '' };
      });
    } else {
      this.headerCells = [{ division_criteria: 'gender' }];
    }
    
    // body_cells 변환
    if (data.body_cells && Array.isArray(data.body_cells)) {
      // 계층 구조로 변환
      this.bodyCells = data.body_cells.map((cell: any) => {
        if (cell.values && Array.isArray(cell.values)) {
          // 기존 형식: { values: [...], children: [...] }
          return {
            elements: cell.values.map((v: any) => ({
              type: 'Token' as const,
              optional: false,
              visible: true,
              menu_key: 'division_values',
              value: v,
            })),
            children: (cell.children || []).map((child: any) => ({
              elements: child.values?.map((v: any) => ({
                type: 'Token' as const,
                optional: false,
                visible: true,
                menu_key: 'division_values',
                value: v,
              })) || [],
              children: child.children || [],
            })),
          } as HierarchicalCell;
        }
        return {
          elements: [],
          children: [],
        } as HierarchicalCell;
      });
    } else {
      this.bodyCells = [{
        elements: [],
        children: [],
      }];
    }
  }

  updateCellValue(rowIndex: number, colIndex: number, elementIndex: number, value: any): void {
    // Division 블록의 셀 값 업데이트 로직
    // 계층 구조를 직접 수정하는 것은 복잡하므로, 
    // 필요시 더 구체적인 메서드를 추가할 수 있습니다.
  }

  addRow(rowIndex?: number): void {
    const newCell: HierarchicalCell = {
      elements: [],
      children: [],
    };
    if (rowIndex !== undefined) {
      this.bodyCells.splice(rowIndex, 0, newCell);
    } else {
      this.bodyCells.push(newCell);
    }
  }

  addColumn(colIndex?: number): void {
    const newHeaderCell = { division_criteria: '' };
    if (colIndex !== undefined) {
      this.headerCells.splice(colIndex, 0, newHeaderCell);
    } else {
      this.headerCells.push(newHeaderCell);
    }
    // bodyCells의 각 행에도 새 열 추가 로직은 복잡하므로
    // 필요시 구현
  }

  removeRow(rowIndex: number): void {
    if (rowIndex >= 0 && rowIndex < this.bodyCells.length) {
      this.bodyCells.splice(rowIndex, 1);
    }
  }

  removeColumn(colIndex: number): void {
    if (colIndex >= 0 && colIndex < this.headerCells.length) {
      this.headerCells.splice(colIndex, 1);
      // bodyCells의 각 행에서도 해당 열 제거
    }
  }

  getStructure(): FlowBlockType {
    return getBlockType('Division');
  }

  toDbFormat(): { header_cells: any; body_cells: any } {
    // 계층 구조를 DB 형식으로 변환
    const bodyCells = this.bodyCells.map(cell => ({
      values: cell.elements.map(el => el.value).filter(v => v !== null && v !== undefined),
      children: cell.children.map(child => ({
        values: child.elements.map(el => el.value).filter(v => v !== null && v !== undefined),
        children: child.children.map(grandchild => ({
          values: grandchild.elements.map(el => el.value).filter(v => v !== null && v !== undefined),
          children: [],
        })),
      })),
    }));
    
    return {
      header_cells: this.headerCells.map(cell => cell.division_criteria),
      body_cells: bodyCells
    };
  }

  // DB 데이터로부터 생성
  static fromDbFormat(blockId: number, dbData: any): DivisionBlockInstance {
    return new DivisionBlockInstance(blockId, {
      header_cells: dbData.header_cells || [],
      body_cells: dbData.body_cells || []
    });
  }
}

// 블록 인스턴스 팩토리
export class BlockInstanceFactory {
  static create(blockType: number, blockId: number, data: any): BlockInstance {
    switch (blockType) {
      case BLOCK_TYPE.APPLY_SUBJECT:
        return ApplySubjectBlockInstance.fromDbFormat(blockId, data);
      case BLOCK_TYPE.DIVISION:
        return DivisionBlockInstance.fromDbFormat(blockId, data);
      // TODO: 다른 블록 타입들도 추가
      default:
        // 기본적으로 FlowBlock을 그대로 사용하는 래퍼 생성
        return new GenericBlockInstance(blockId, blockType, {
          header_cells: data.header_cells || [],
          body_cells: data.body_cells || []
        });
    }
  }
}

// 일반 블록 인스턴스 (아직 특화되지 않은 블록용)
class GenericBlockInstance extends BlockInstance {
  constructor(blockId: number, blockType: number, data: BlockInstanceData) {
    super(blockId, blockType, data);
  }

  updateCellValue(rowIndex: number, colIndex: number, elementIndex: number, value: any): void {
    // 기본 구현: 기존 FlowBlock 구조 유지
    if (rowIndex === -1) {
      // 헤더 셀 업데이트
      if (!this.data.header_cells) {
        this.data.header_cells = [];
      }
      if (!this.data.header_cells[colIndex]) {
        this.data.header_cells[colIndex] = [];
      }
      if (!this.data.header_cells[colIndex][elementIndex]) {
        this.data.header_cells[colIndex][elementIndex] = [];
      }
      this.data.header_cells[colIndex][elementIndex] = value;
    } else {
      // 바디 셀 업데이트
      if (!this.data.body_cells) {
        this.data.body_cells = [];
      }
      if (!this.data.body_cells[rowIndex]) {
        this.data.body_cells[rowIndex] = [];
      }
      if (!this.data.body_cells[rowIndex][colIndex]) {
        this.data.body_cells[rowIndex][colIndex] = [];
      }
      if (!this.data.body_cells[rowIndex][colIndex][elementIndex]) {
        this.data.body_cells[rowIndex][colIndex][elementIndex] = [];
      }
      this.data.body_cells[rowIndex][colIndex][elementIndex] = value;
    }
  }

  addRow(rowIndex?: number): void {
    if (!this.data.body_cells) {
      this.data.body_cells = [];
    }
    const newRow: any[] = [];
    if (rowIndex !== undefined) {
      this.data.body_cells.splice(rowIndex, 0, newRow);
    } else {
      this.data.body_cells.push(newRow);
    }
  }

  addColumn(colIndex?: number): void {
    // 기본 구현은 열 추가를 지원하지 않음
    throw new Error(`Block type ${this.block_type} does not support column addition`);
  }

  removeRow(rowIndex: number): void {
    if (this.data.body_cells && rowIndex >= 0 && rowIndex < this.data.body_cells.length) {
      this.data.body_cells.splice(rowIndex, 1);
    }
  }

  removeColumn(colIndex: number): void {
    throw new Error(`Block type ${this.block_type} does not support column removal`);
  }

  getStructure(): FlowBlockType {
    // 블록 타입 이름 가져오기
    const blockTypeMap: Record<number, keyof typeof import('@/types/block-structure').BLOCK_TYPES> = {
      [BLOCK_TYPE.DIVISION]: 'Division',
      [BLOCK_TYPE.APPLY_SUBJECT]: 'ApplySubject',
      [BLOCK_TYPE.GRADE_RATIO]: 'GradeRatio',
      [BLOCK_TYPE.APPLY_TERM]: 'ApplyTerm',
      [BLOCK_TYPE.TOP_SUBJECT]: 'TopSubject',
      [BLOCK_TYPE.SUBJECT_GROUP_RATIO]: 'SubjectGroupRatio',
      [BLOCK_TYPE.SEPARATION_RATIO]: 'SeparationRatio',
      [BLOCK_TYPE.SCORE_MAP]: 'ScoreMap',
      [BLOCK_TYPE.FORMULA]: 'Formula',
      [BLOCK_TYPE.VARIABLE]: 'Variable',
      [BLOCK_TYPE.CONDITION]: 'Condition',
      [BLOCK_TYPE.AGGREGATION]: 'Aggregation',
      [BLOCK_TYPE.RATIO]: 'Ratio',
      [BLOCK_TYPE.DECIMAL]: 'Decimal',
    };
    
    const typeName = blockTypeMap[this.block_type];
    if (typeName) {
      return getBlockType(typeName);
    }
    
    // 기본 구조 반환
    return {
      name: 'Unknown',
      color: 'gray',
      col_editable: false,
      cols: [{
        header: { elements: [] },
        rows: []
      }]
    };
  }

  toDbFormat(): { header_cells: any; body_cells: any } {
    return {
      header_cells: this.data.header_cells || [],
      body_cells: this.data.body_cells || []
    };
  }
}

