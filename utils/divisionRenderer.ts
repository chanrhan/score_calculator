// DivisionBlock 렌더링을 위한 유틸리티 함수들
import { FlowBlock } from '@/types/block-structure'

// 계층적 셀 구조 (DivisionBlock의 body_cells 구조)
export interface HierarchicalCell {
  values: any[]
  children?: HierarchicalCell[]  // 선택적 속성으로 변경
}

// 렌더링용 셀 정보
export interface RenderCell {
  content: any[]
  rowspan: number
  colspan: number
  rowIndex: number
  colIndex: number
  isLeaf: boolean
  level: number
}

// DivisionBlock 렌더링 데이터
export interface DivisionRenderData {
  cells: RenderCell[]
  totalRows: number
  totalCols: number
  grid: (RenderCell | null)[][]
}

/**
 * DivisionBlock의 body_cells를 렌더링용 데이터로 변환
 */
export function parseDivisionBlock(block: FlowBlock): DivisionRenderData {
  const bodyCells = block.body_cells as unknown as HierarchicalCell[]
  const headerCells = block.header_cells || []
  
  // 1. 리프 셀 개수 계산
  const leafCount = getLeafCellsCount(bodyCells)
  
  // 2. 최대 깊이 계산 (열 개수)
  const maxDepth = getMaxDepth(bodyCells)
  
  // 3. rowspan 계산
  const cellsWithRowspan = calculateRowspans(bodyCells)
  
  // 4. 렌더링 순서 결정
  const renderCells = getRenderingOrder(cellsWithRowspan, maxDepth)
  
  // 5. 그리드 매핑
  const grid = mapToGrid(renderCells, leafCount, maxDepth)
  // console.table(grid);
  
  return {
    cells: renderCells,
    totalRows: leafCount,
    totalCols: maxDepth,
    grid
  }
}

/**
 * 리프 셀 개수 계산 (재귀적)
 */
export function getLeafCellsCount(cells: HierarchicalCell[]): number {
  let count = 0
  
  for (const cell of cells) {
    // cell.children이 undefined이거나 null인 경우를 방어적으로 처리
    if (!cell.children || cell.children.length === 0) {
      count += 1
    } else {
      count += getLeafCellsCount(cell.children)
    }
  }
  
  return count
}

/**
 * 최대 깊이 계산 (열 개수)
 */
export function getMaxDepth(cells: HierarchicalCell[]): number {
  let maxDepth = 0
  
  function traverse(cells: HierarchicalCell[], currentDepth: number) {
    for (const cell of cells) {
      maxDepth = Math.max(maxDepth, currentDepth + 1)
      if (cell.children && cell.children.length > 0) {
        traverse(cell.children, currentDepth + 1)
      }
    }
  }
  
  traverse(cells, 0)
  return Math.max(maxDepth, 1) // 최소 1열
}

/**
 * rowspan 계산 (자식 셀들의 rowspan 합계)
 */
function calculateRowspans(cells: HierarchicalCell[]): (HierarchicalCell & { rowspan: number })[] {
  return cells.map(cell => {
    const updatedCell = { ...cell } as HierarchicalCell & { rowspan: number }
    
    // cell.children이 undefined이거나 null인 경우를 방어적으로 처리
    if (!cell.children || cell.children.length === 0) {
      // 리프 셀은 rowspan = 1
      updatedCell.rowspan = 1
    } else {
      // 자식 셀들의 rowspan 합계
      const childrenWithRowspan = calculateRowspans(cell.children)
      const totalRowspan = childrenWithRowspan.reduce((sum: number, child) => {
        return sum + child.rowspan
      }, 0)
      
      updatedCell.rowspan = totalRowspan
      updatedCell.children = childrenWithRowspan
    }
    
    return updatedCell
  })
}

/**
 * 렌더링 순서 결정 (리프 셀부터, 오른쪽 열부터 왼쪽 열 순서)
 */
function getRenderingOrder(cells: HierarchicalCell[], maxDepth: number): RenderCell[] {
  const renderCells: RenderCell[] = []
  
  // 각 레벨별로 셀들을 수집
  const cellsByLevel: HierarchicalCell[][] = []
  
  function collectByLevel(cells: HierarchicalCell[], level: number) {
    if (!cellsByLevel[level]) {
      cellsByLevel[level] = []
    }
    
    for (const cell of cells) {
      cellsByLevel[level].push(cell)
      if (cell.children && cell.children.length > 0) {
        collectByLevel(cell.children, level + 1)
      }
    }
  }
  
  collectByLevel(cells, 0)
  
  // 각 레벨의 셀들을 렌더링 순서로 변환
  let currentRow = 0
  
  // 리프 레벨부터 시작 (가장 깊은 레벨)
  for (let level = maxDepth - 1; level >= 0; level--) {
    const levelCells = cellsByLevel[level] || []
    
    for (const cell of levelCells) {
      const isLeaf = !cell.children || cell.children.length === 0
      const rowspan = (cell as any).rowspan || 1
      
      renderCells.push({
        content: cell.values,
        rowspan,
        colspan: 1,
        rowIndex: currentRow,
        colIndex: level,
        isLeaf,
        level
      })
      
      // 리프 셀인 경우에만 행 인덱스 증가
      if (isLeaf) {
        currentRow += 1
      }
    }
  }
  
  return renderCells
}

/**
 * 그리드 매핑 (rowspan을 고려한 위치 계산)
 */
function mapToGrid(renderCells: RenderCell[], totalRows: number, totalCols: number): (RenderCell | null)[][] {
  // 빈 그리드 초기화
  const grid: (RenderCell | null)[][] = Array(totalRows).fill(null).map(() => 
    Array(totalCols).fill(null)
  )
  
  // 각 셀을 그리드에 배치
  for (const cell of renderCells) {
    const { rowIndex, colIndex, rowspan } = cell
    
    // rowspan만큼의 행에 걸쳐 배치
    for (let r = 0; r < rowspan; r++) {
      if (rowIndex + r < totalRows) {
        grid[rowIndex + r][colIndex] = cell
      }
    }
  }
  
  return grid
}

/**
 * DivisionBlock의 특정 위치 셀 렌더링
 */
export function renderDivisionCell(
  block: FlowBlock, 
  rowIndex: number, 
  colIndex: number, 
  totalRows: number
): RenderCell | null {
  const renderData = parseDivisionBlock(block)
  
  if (rowIndex < 0 || rowIndex >= renderData.totalRows || 
      colIndex < 0 || colIndex >= renderData.totalCols) {
    return null
  }
  
  return renderData.grid[rowIndex][colIndex]
}

/**
 * DivisionBlock의 총 행 수 계산
 */
export function getDivisionBlockRows(block: FlowBlock): number {
  const bodyCells = block.body_cells as unknown as HierarchicalCell[]
  // DivisionBlock의 body_cells는 계층적 구조이므로 리프 셀 개수를 계산
  const count = getLeafCellsCount(bodyCells)
  // console.log('getDivisionBlockRows - bodyCells:', bodyCells, 'count:', count)
  return count
}

/**
 * DivisionBlock의 총 열 수 계산
 */
export function getDivisionBlockCols(block: FlowBlock): number {
  const bodyCells = block.body_cells as unknown as HierarchicalCell[]
  return getMaxDepth(bodyCells)
}
