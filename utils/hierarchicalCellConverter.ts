// utils/hierarchicalCellConverter.ts
// HierarchicalCell과 도메인 모델 간 변환

import { HierarchicalCell, HierarchicalCellUtils } from '@/types/hierarchicalCell';
import type { AnyBlock } from '@/types/blocks';

/**
 * HierarchicalCell[]을 도메인 모델에서 사용할 수 있는 평면 구조로 변환
 */
export function convertHierarchicalToFlatRows(cells: HierarchicalCell[]): any[] {
  const flatRows: any[] = [];
  
  function traverse(cell: HierarchicalCell, path: string[] = []) {
    const currentPath = [...path, cell.type];
    
    // 말단 셀인 경우 (자식이 없는 경우)
    if (cell.children.length === 0) {
      flatRows.push({
        id: cell.id,
        path: currentPath,
        value: cell.values,
        level: cell.level,
        criteria: buildCriteriaFromPath(currentPath, cell.values)
      });
    } else {
      // 자식들을 재귀적으로 처리
      cell.children.forEach(child => traverse(child, currentPath));
    }
  }
  
  cells.forEach(cell => traverse(cell));
  return flatRows;
}

/**
 * 경로와 값으로부터 Division 조건문 생성
 */
function buildCriteriaFromPath(path: string[], finalValue: Record<string, any>): string {
  const conditions: string[] = [];
  
  // 경로의 각 레벨에서 조건 생성
  Object.entries(finalValue).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      conditions.push(`${key} = '${value}'`);
    }
  });
  
  return conditions.length > 0 ? conditions.join(' AND ') : 'true';
}

/**
 * 평면 구조를 HierarchicalCell 구조로 재구성 (DB → ComponentGrid 로드시)
 */
export function convertFlatRowsToHierarchical(flatRows: any[]): HierarchicalCell[] {
  const rootCells: HierarchicalCell[] = [];
  const cellMap = new Map<string, HierarchicalCell>();
  
  // 모든 셀을 먼저 생성
  flatRows.forEach(row => {
    const cell: HierarchicalCell = {
      id: row.id,
      type: row.path[row.path.length - 1] || '', // 마지막 경로 요소를 타입으로
      values: row.value || {},
      level: row.level || 0,
      children: [],
      rowspan: 1 // 기본값, 나중에 계산됨
    };
    
    cellMap.set(cell.id, cell);
  });
  
  // 계층 구조 구성 (레벨 기반)
  flatRows.forEach(row => {
    const cell = cellMap.get(row.id);
    if (!cell) return;
    
    if (cell.level === 0) {
      // 루트 레벨
      rootCells.push(cell);
    } else {
      // 부모 찾아서 연결 (같은 path prefix를 가진 상위 레벨)
      const parentPath = row.path.slice(0, -1);
      const potentialParent = flatRows.find(r => 
        r.level === cell.level - 1 && 
        r.path.join(',').startsWith(parentPath.join(','))
      );
      
      if (potentialParent) {
        const parentCell = cellMap.get(potentialParent.id);
        if (parentCell) {
          parentCell.children.push(cell);
          cell.parent = parentCell.id;
        }
      }
    }
  });
  
  // rowspan 재계산
  return calculateRowspans(rootCells);
}

/**
 * HierarchicalCell 구조에서 rowspan을 재계산
 */
function calculateRowspans(cells: HierarchicalCell[]): HierarchicalCell[] {
  function calculateCellRowspan(cell: HierarchicalCell): number {
    if (cell.children.length === 0) {
      cell.rowspan = 1;
      return 1;
    }
    
    const childRowspans = cell.children.map(child => calculateCellRowspan(child));
    const totalRowspan = childRowspans.reduce((sum, span) => sum + span, 0);
    cell.rowspan = totalRowspan;
    return totalRowspan;
  }
  
  cells.forEach(cell => calculateCellRowspan(cell));
  return cells;
}

/**
 * ComponentGrid의 Division 블록에서 HierarchicalCell 데이터 추출
 */
export function extractHierarchicalFromDivisionBlock(block: any): HierarchicalCell[] {
  // block.data나 특별한 hierarchical 필드에서 데이터 추출
  if (block.hierarchicalData) {
    return block.hierarchicalData as HierarchicalCell[];
  }
  
  // body에서 계층 구조 데이터 추출 (새로운 형태)
  if (block.type?.body && block.type.body.length > 0) {
    const bodyRow = block.type.body[0];
    
    // 새로운 계층 구조 형태인지 확인
    if (bodyRow && bodyRow.isHierarchical && bodyRow.hierarchicalData) {
      return bodyRow.hierarchicalData as HierarchicalCell[];
    }
    
    // 기존 형태에서 기본 구조 생성
    const cells: HierarchicalCell[] = [];
    
    if (Array.isArray(bodyRow)) {
      bodyRow.forEach((cell: any, index: number) => {
        const tokenElement = cell.elements?.find((e: any) => e.element_type === 'Token');
        if (tokenElement) {
          const hierarchicalCell: HierarchicalCell = {
            id: `cell_${Date.now()}_${index}`,
            type: 'division', // 기본 타입
            values: {
              [block.type.name || 'division']: tokenElement.value || ''
            },
            level: 0,
            children: [],
            rowspan: 1
          };
          cells.push(hierarchicalCell);
        }
      });
    }
    
    return cells;
  }
  
  // 기본 샘플 데이터 반환
  return [HierarchicalCellUtils.createEmptyCell(0)];
}

/**
 * Division 블록의 도메인 모델 변환
 */
export function convertDivisionToAnyBlock(
  blockId: number,
  hierarchicalCells: HierarchicalCell[]
): AnyBlock {
  const flatRows = convertHierarchicalToFlatRows(hierarchicalCells);
  
  return {
    id: blockId,
    kind: 'division',
    position: 0, // 실제 위치는 상위에서 설정
    spec: {
      rows: flatRows.map(row => ({
        criteria: row.criteria,
        caseKey: `case_${row.id}`,
        caseName: Object.values(row.value).join('_') || 'default'
      }))
    }
  } as any; // AnyBlock 타입은 실제 구현에 따라 조정
}