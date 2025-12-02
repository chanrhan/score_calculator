// 계층적 셀 구조를 CSS Grid 포지션으로 변환하는 알고리즘
import { HierarchicalCell, GridPosition, CellRenderInfo } from '@/types/hierarchicalCell'

export class GridPositionCalculator {
  
  // 계층적 구조를 그리드 렌더링 정보로 변환 (열 추가 대응)
  static calculatePositions(hierarchicalData: HierarchicalCell[]): CellRenderInfo[] {
    if (!hierarchicalData || hierarchicalData.length === 0) {
      return []
    }

    const renderInfo: CellRenderInfo[] = []
    let maxRowUsed = 0

    // 각 루트 셀을 순회하면서 위치 계산
    // 구분 블록에서 열 추가 시: 각 루트 셀이 별도의 열(1,2,3,...)에 독립적으로 배치
    for (let rootIndex = 0; rootIndex < hierarchicalData.length; rootIndex++) {
      const rootCell = hierarchicalData[rootIndex]
      const startCol = rootIndex + 1 // 루트 셀별로 다른 열에서 시작 (1, 2, 3, ...)
      
      // 각 열은 독립적으로 1행부터 시작
      const { cells, nextRow } = this.processCell(rootCell, startCol, 1)
      renderInfo.push(...cells)
      maxRowUsed = Math.max(maxRowUsed, nextRow - 1) // 실제 사용된 최대 행 수
    }

    return renderInfo
  }

  // 개별 셀과 그 자식들의 위치를 재귀적으로 계산
  private static processCell(
    cell: HierarchicalCell, 
    col: number, 
    startRow: number
  ): { cells: CellRenderInfo[]; nextRow: number } {
    
    // 먼저 자식들을 처리하여 필요한 행 수를 계산
    let childrenResults: CellRenderInfo[] = []
    let totalChildRows = 0
    let currentRow = startRow

    if (cell.children.length > 0) {
      // Division 블록의 경우 자식들은 같은 열의 아래쪽 행에 배치
      // 부모 셀이 먼저 1행을 차지하고, 자식들이 그 아래에 순차적으로 배치
      let childStartRow = startRow + 1 // 부모 다음 행부터 시작
      
      for (const child of cell.children) {
        // 자식은 같은 열(col)에 배치 (col + 1이 아니라 col)
        const { cells, nextRow } = this.processCell(child, col, childStartRow)
        childrenResults.push(...cells)
        childStartRow = nextRow // 다음 자식은 현재 자식 다음 행에서 시작
      }
      totalChildRows = childStartRow - startRow // 부모 + 모든 자식이 차지하는 총 행 수
    } else {
      // 말단 셀은 최소 1행 차지
      totalChildRows = 1
    }

    // Division 블록의 경우: 부모 셀은 1행만 차지하고, 자식들과는 독립적
    const cellInfo: CellRenderInfo = {
      ...cell,
      position: {
        rowStart: startRow,
        rowEnd: startRow + 1, // 부모 셀은 1행만 차지
        colStart: col,
        colEnd: col + 1
      },
      isLeaf: cell.children.length === 0,
      hasParent: !!cell.parent,
      rowspan: 1 // 부모 셀은 항상 1행만 차지
    }

    const result: CellRenderInfo[] = [cellInfo, ...childrenResults]

    return {
      cells: result,
      nextRow: startRow + totalChildRows
    }
  }

  // 그리드의 총 크기 계산
  static calculateGridDimensions(renderInfo: CellRenderInfo[]): { rows: number; cols: number } {
    if (renderInfo.length === 0) {
      return { rows: 1, cols: 1 }
    }

    // CSS Grid에서 rowEnd/colEnd는 exclusive이므로 -1 하지 않음
    const maxRow = Math.max(...renderInfo.map(cell => cell.position.rowEnd))
    
    // Division 블록의 경우: 실제 사용되는 열 수를 계산
    // 고유한 colStart 값의 개수 = 실제 사용되는 열 수
    const usedColumns = new Set(renderInfo.map(cell => cell.position.colStart))
    const maxCol = usedColumns.size // 고유한 열의 개수


    return {
      rows: maxRow,
      cols: maxCol
    }
  }

  // CSS Grid Template 생성 (구분 블록 열 추가 대응)
  static generateGridTemplate(renderInfo: CellRenderInfo[]): {
    gridTemplateRows: string
    gridTemplateColumns: string
  } {
    const dimensions = this.calculateGridDimensions(renderInfo)
    
    // 구분 블록의 경우 모든 열이 동일한 너비를 가져야 함 (헤더와 정렬)
    const columnWidths: string[] = []
    for (let col = 1; col <= dimensions.cols; col++) {
      // 모든 열을 동일한 최소 너비로 설정 (헤더와 일치)
      columnWidths.push('minmax(200px, 1fr)')
    }

    // 각 행의 높이는 자동으로 조절
    const rowHeights = new Array(dimensions.rows).fill('auto')

    return {
      gridTemplateRows: rowHeights.join(' '),
      gridTemplateColumns: columnWidths.join(' ')
    }
  }

  // 특정 셀이 오버레이를 표시할 수 있는지 확인
  static canShowOverlays(cell: CellRenderInfo, renderInfo: CellRenderInfo[]): {
    canAddChild: boolean    // 오른쪽 오버레이
    canAddSibling: boolean  // 하단 오버레이
  } {
    // 오른쪽에 자식을 추가할 수 있는지 (현재 셀이 말단이거나 자식이 있어도 추가 가능)
    const canAddChild = true // 항상 가능

    // 하단에 형제를 추가할 수 있는지
    // 부모가 있는 경우에만 형제 추가 가능 (루트 레벨도 형제 추가 가능)
    const canAddSibling = true // 항상 가능

    return {
      canAddChild,
      canAddSibling
    }
  }

  // 셀의 실제 DOM 크기를 기반으로 오버레이 위치 계산
  static calculateOverlayPositions(cellElement: HTMLElement): {
    rightOverlay: { top: string; right: string }
    bottomOverlay: { bottom: string; left: string }
  } {
    const rect = cellElement.getBoundingClientRect()
    
    return {
      rightOverlay: {
        top: '50%',
        right: '4px'
      },
      bottomOverlay: {
        bottom: '4px',
        left: '50%'
      }
    }
  }

  // 디버깅을 위한 그리드 구조 시각화
  static debugGrid(renderInfo: CellRenderInfo[]): string {
    const dimensions = this.calculateGridDimensions(renderInfo)
    let debug = `Grid: ${dimensions.rows}×${dimensions.cols}\n`
    
    for (const cell of renderInfo) {
      const pos = cell.position
      debug += `Cell ${cell.id.slice(-4)}: (${pos.rowStart},${pos.colStart}) → (${pos.rowEnd},${pos.colEnd}) | Level ${cell.level} | Type: ${cell.type}\n`
    }
    
    return debug
  }

  // 특정 위치의 셀 찾기
  static findCellAtPosition(renderInfo: CellRenderInfo[], row: number, col: number): CellRenderInfo | null {
    return renderInfo.find(cell => {
      const pos = cell.position
      return row >= pos.rowStart && row < pos.rowEnd && 
             col >= pos.colStart && col < pos.colEnd
    }) || null
  }

  // 셀 간의 관계 확인
  static getCellRelationships(cell: CellRenderInfo, renderInfo: CellRenderInfo[]): {
    parent: CellRenderInfo | null
    children: CellRenderInfo[]
    siblings: CellRenderInfo[]
  } {
    const parent = cell.parent ? 
      renderInfo.find(c => c.id === cell.parent) || null : null

    const children = renderInfo.filter(c => c.parent === cell.id)

    const siblings = parent ? 
      renderInfo.filter(c => c.parent === parent.id && c.id !== cell.id) :
      renderInfo.filter(c => c.level === cell.level && c.id !== cell.id)

    return { parent, children, siblings }
  }
}

export default GridPositionCalculator