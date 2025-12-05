// lib/blocks/modules/Division/instance.ts
// B 인스턴스: Division 블록의 데이터 관리

import { BlockInstance, BlockInstanceData } from '../../BlockInstance';
import { BLOCK_TYPE } from '@/types/block-types';
import { FlowBlockType } from '@/types/block-structure';
import { HierarchicalCell } from '@/utils/divisionRenderer';
import { getBlockType } from '@/types/block-structure';

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

  static fromDbFormat(blockId: number, data: BlockInstanceData): DivisionBlockInstance {
    return new DivisionBlockInstance(blockId, data);
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
  }

  removeRow(rowIndex: number): void {
    if (rowIndex >= 0 && rowIndex < this.bodyCells.length) {
      this.bodyCells.splice(rowIndex, 1);
    }
  }

  removeColumn(colIndex: number): void {
    if (colIndex >= 0 && colIndex < this.headerCells.length) {
      this.headerCells.splice(colIndex, 1);
    }
  }

  getStructure(): FlowBlockType {
    // BlockInstance 내에서 직접 구조 생성 (structure.ts 제거)
    return {
      name: 'Division',
      color: 'green',
      col_editable: true, // 열 추가 가능
      cols: [{
        header: { elements: [] },
        rows: [{ elements: [] }]
      }]
    };
  }

  // 렌더링용 헬퍼 메서드
  getHeaderCellValues(colIndex: number): any[] {
    if (this.headerCells[colIndex]) {
      return [this.headerCells[colIndex].division_criteria];
    }
    return [];
  }

  getBodyCellValues(rowIndex: number, colIndex: number): any[] {
    // Division 블록은 계층 구조이므로 rowIndex로만 접근
    if (this.bodyCells[rowIndex]) {
      const cell = this.bodyCells[rowIndex];
      // colIndex는 무시하고 해당 행의 elements 반환
      return cell.elements.map((el: any) => {
        if ('value' in el) return el.value;
        return null;
      }).filter((v: any) => v !== null && v !== undefined);
    }
    return [];
  }

  toDbFormat(): { header_cells: any; body_cells: any } {
    // 계층 구조를 DB 형식으로 변환
    const bodyCells = this.bodyCells.map(cell => ({
      values: cell.elements.map(el => {
        if ('value' in el) return el.value;
        return null;
      }).filter(v => v !== null && v !== undefined),
      children: cell.children.map(child => ({
        values: child.elements.map(el => {
          if ('value' in el) return el.value;
          return null;
        }).filter(v => v !== null && v !== undefined),
        children: child.children.map(grandchild => ({
          values: grandchild.elements.map(el => {
            if ('value' in el) return el.value;
            return null;
          }).filter(v => v !== null && v !== undefined),
          children: [],
        })),
      })),
    }));
    
    return {
      header_cells: this.headerCells.map(cell => cell.division_criteria),
      body_cells: bodyCells
    };
  }
}

