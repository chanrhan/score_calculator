// DivisionBlock의 계층적 구조 업데이트를 위한 유틸리티 함수들
import { FlowBlock } from '@/types/block-structure'
import { BLOCK_TYPE } from '@/types/block-types'

// 계층적 셀 구조 (DivisionBlock의 body_cells 구조)
export interface HierarchicalCell {
  values: any[]
  children: HierarchicalCell[]  // 필수 속성으로 변경 (division_rules.md 규칙 준수)
}

/**
 * DivisionBlock의 특정 셀 값을 업데이트
 * @param block - DivisionBlock
 * @param rowIndex - 행 인덱스 (리프 셀 기준)
 * @param colIndex - 열 인덱스 (깊이 기준)
 * @param elementIndex - values 배열 내 요소 인덱스
 * @param value - 새로운 값
 */
export function updateDivisionCellValue(
  block: FlowBlock,
  rowIndex: number,
  colIndex: number,
  elementIndex: number,
  value: any
): FlowBlock {
  // DivisionBlock의 body_cells는 계층적 구조: [{ values: [], children: [] }]
  const bodyCells = block.body_cells as unknown as HierarchicalCell[]
  
  // 해당 위치의 셀을 찾아서 업데이트
  const updatedBodyCells = updateCellInHierarchy(
    bodyCells,
    rowIndex,
    colIndex,
    elementIndex,
    value
  )
  
  return {
    ...block,
    body_cells: updatedBodyCells as unknown as any[][][]
  }
}

/**
 * 계층적 구조에서 특정 셀 업데이트 (재귀적)
 * 구분 블록의 구조: 루트 셀들이 행을 나타내고, 각 루트 셀의 자식들이 열을 나타냄
 */
function updateCellInHierarchy(
  cells: HierarchicalCell[],
  targetRowIndex: number,
  targetColIndex: number,
  elementIndex: number,
  value: any,
  currentRowIndex: number = 0,
  currentColIndex: number = 0
): HierarchicalCell[] {
  const result: HierarchicalCell[] = []
  
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]
    const updatedCell = { ...cell }
    
    // 현재 행이 타겟 행인 경우
    if (currentRowIndex === targetRowIndex) {
      // 자식이 있는 경우 (루트 셀)
      if (cell.children.length > 0) {
        // 자식들 중에서 타겟 열 인덱스에 해당하는 자식을 찾아 업데이트
        const updatedChildren = [...cell.children]
        if (targetColIndex < updatedChildren.length) {
          const targetChild = updatedChildren[targetColIndex]
          const newValues = [...targetChild.values]
          if (elementIndex < newValues.length) {
            newValues[elementIndex] = value
          } else {
            // 배열이 충분히 크지 않은 경우 확장
            while (newValues.length <= elementIndex) {
              newValues.push(null)
            }
            newValues[elementIndex] = value
          }
          updatedChildren[targetColIndex] = {
            ...targetChild,
            values: newValues
          }
          updatedCell.children = updatedChildren
        }
      } else {
        // 자식이 없는 경우 (리프 셀) - 직접 값 업데이트
        const newValues = [...cell.values]
        if (elementIndex < newValues.length) {
          newValues[elementIndex] = value
        } else {
          // 배열이 충분히 크지 않은 경우 확장
          while (newValues.length <= elementIndex) {
            newValues.push(null)
          }
          newValues[elementIndex] = value
        }
        updatedCell.values = newValues
      }
    }
    
    result.push(updatedCell)
  }
  
  return result
}

/**
 * DivisionBlock에 형제 셀 추가 (행 추가)
 * division_rules.md 규칙에 따라 특정 위치의 형제 셀을 추가합니다.
 * @param blocks - DivisionBlock
 * @param targetRowIndex - 추가할 위치의 행 인덱스
 * @param targetColIndex - 추가할 위치의 열 인덱스
 */
export function addRowToAllBlocks(
  blocks: FlowBlock[],
  targetRowIndex: number,
  targetColIndex: number,
  totalRowCount: number,
  totalColCount: number
): FlowBlock[] {
  const copyBlocks = JSON.parse(JSON.stringify(blocks));
  copyBlocks.forEach((block: FlowBlock) => {
    console.log(JSON.parse(JSON.stringify(block.body_cells)));
    const colCount = block.header_cells?.length || 0;
    let newRow = new Array();
    if(block.block_type === BLOCK_TYPE.DIVISION) {
      for(let i=0;i<colCount;i++) {
        newRow.push({
          values: [null],
          rowspan : (i >= targetColIndex ? 1 : 0)
          // rowspan : 99
        })
      }
    }else{
      // newRow = Array.from({ length: colCount }, () => [null]); // fill 금지!
    }
    console.log(JSON.parse(JSON.stringify(newRow)));

    if(targetRowIndex+1 < totalRowCount) {
      block.body_cells.splice(targetRowIndex+1, 0, newRow);
    }else{
      block.body_cells.push(newRow);
    }
    console.log(JSON.parse(JSON.stringify(block.body_cells)));
  });

  return copyBlocks;
}

/**
 * Deprecated
 * 계층적 구조에서 형제 셀 추가 (재귀적)
 * division_rules.md 규칙에 따라 특정 위치의 형제 셀을 추가합니다.
 */
function addSiblingInHierarchy(
  cells: HierarchicalCell[],
  targetRowIndex: number,
  targetColIndex: number,
  currentRowIndex: number = 0,
  currentColIndex: number = 0
): HierarchicalCell[] {
  const result: HierarchicalCell[] = []
  let rowCounter = currentRowIndex
  
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]
    const updatedCell = { ...cell }
    
    if (currentColIndex === targetColIndex) {
      // 현재 열이 타겟 열인 경우
      if (rowCounter === targetRowIndex) {
        // 현재 행이 타겟 행인 경우 - 형제 셀 추가
        const newSibling: HierarchicalCell = {
          values: [...cell.values], // 형제 셀은 같은 values를 가져야 함
          children: []
        }
        
        // 현재 셀 다음에 형제 셀 삽입
        result.push(updatedCell)
        result.push(newSibling)
        
        // 나머지 셀들도 추가
        for (let j = i + 1; j < cells.length; j++) {
          result.push(cells[j])
        }
        
        return result
      }
      
      // 리프 셀인 경우에만 행 카운터 증가
      if (cell.children.length === 0) {
        rowCounter++
      }
    }
    
    // 자식 셀들 재귀적으로 처리
    if (cell.children.length > 0) {
      updatedCell.children = addSiblingInHierarchy(
        cell.children,
        targetRowIndex,
        targetColIndex,
        rowCounter,
        currentColIndex + 1
      )
      
      // 자식들의 행 카운터 업데이트
      rowCounter = getLeafCellsCount(updatedCell.children)
    }
    
    result.push(updatedCell)
  }
  
  return result
}

/**
 * DivisionBlock에 열 추가 (깊이 추가)
 * division_rules.md 규칙에 따라 각 리프 셀에 새로운 자식 셀을 추가합니다.
 * @param block - DivisionBlock
 */
export function addColumnToDivisionBlock(block: FlowBlock): FlowBlock {
  // DivisionBlock의 body_cells는 계층적 구조: [{ values: [], children: [] }]
  const bodyCells = block.body_cells as unknown as HierarchicalCell[]
  
  // division_rules.md 규칙에 따른 열 추가: 각 리프 셀에 새로운 자식 셀 추가
  const updatedBodyCells = addColumnInHierarchy(bodyCells)
  
  // header_cells에도 새로운 열 추가 (기본값으로 빈 문자열 추가)
  const updatedHeaderCells = [...(block.header_cells || []), ['element_types']]
  
  return {
    ...block,
    header_cells: updatedHeaderCells,
    body_cells: updatedBodyCells as unknown as any[][][]
  }
}

/**
 * 계층적 구조에서 열 추가 (재귀적)
 * division_rules.md 규칙에 따라 각 리프 셀에 새로운 자식 셀을 추가합니다.
 */
function addColumnInHierarchy(cells: HierarchicalCell[]): HierarchicalCell[] {
  return cells.map(cell => {
    const updatedCell = { ...cell }
    
    // 자식이 있는 경우 재귀적으로 처리
    if (cell.children.length > 0) {
      updatedCell.children = addColumnInHierarchy(cell.children)
    } else {
      // 리프 셀인 경우 새로운 자식 셀 추가 (division_rules.md 예시 5번 참조)
      updatedCell.children = [
        ...cell.children,
        {
          values: [], // 새로운 자식 셀의 values는 빈 배열
          children: []
        }
      ]
    }
    
    return updatedCell
  })
}

/**
 * DivisionBlock에서 셀 삭제
 * @param block - DivisionBlock
 * @param targetRowIndex - 삭제할 행 인덱스
 * @param targetColIndex - 삭제할 열 인덱스
 */
export function deleteDivisionCell(
  block: FlowBlock,
  targetRowIndex: number,
  targetColIndex: number
): FlowBlock {
  const bodyCells = block.body_cells as unknown as HierarchicalCell[]
  
  // 해당 위치의 셀 삭제
  const updatedBodyCells = deleteCellInHierarchy(
    bodyCells,
    targetRowIndex,
    targetColIndex
  )
  
  return {
    ...block,
    body_cells: updatedBodyCells as unknown as any[][][]
  }
}

/**
 * 계층적 구조에서 셀 삭제 (재귀적)
 */
function deleteCellInHierarchy(
  cells: HierarchicalCell[],
  targetRowIndex: number,
  targetColIndex: number,
  currentRowIndex: number = 0,
  currentColIndex: number = 0
): HierarchicalCell[] {
  const result: HierarchicalCell[] = []
  let rowCounter = currentRowIndex
  
  for (const cell of cells) {
    if (currentColIndex === targetColIndex && rowCounter === targetRowIndex) {
      // 타겟 셀인 경우 건너뛰기 (삭제)
      if (cell.children.length === 0) {
        rowCounter++
      }
      continue
    }
    
    const updatedCell = { ...cell }
    
    if (currentColIndex === targetColIndex && cell.children.length === 0) {
      rowCounter++
    }
    
    // 자식 셀들 재귀적으로 처리
    if (cell.children.length > 0) {
      updatedCell.children = deleteCellInHierarchy(
        cell.children,
        targetRowIndex,
        targetColIndex,
        rowCounter,
        currentColIndex + 1
      )
      
      rowCounter = getLeafCellsCount(updatedCell.children)
    }
    
    result.push(updatedCell)
  }
  
  return result
}

/**
 * 리프 셀 개수 계산 (유틸리티 함수)
 */
function getLeafCellsCount(cells: HierarchicalCell[]): number {
  let count = 0
  
  for (const cell of cells) {
    // children이 빈 배열인 경우 리프 셀
    if (cell.children.length === 0) {
      count += 1
    } else {
      count += getLeafCellsCount(cell.children)
    }
  }
  
  return count
}
