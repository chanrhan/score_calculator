// /lib/grid/GridCalculator.ts
// Grid 레이아웃 계산 유틸리티

import { FlowBlock, FlowCell } from '@/types/block-structure'
import { HierarchicalCell, CellRenderInfo } from '@/types/hierarchicalCell'
import { GridPositionCalculator } from '@/utils/gridPositionCalculator'
import { BlockGridCalculator } from '@/lib/blockManager'

// 블록의 Grid 정보
export interface BlockGridInfo {
  blockId: number
  startCol: number  // 시작 열
  colSpan: number   // 열 너비
  blockName: string
}

// Component Grid 정보
export interface ComponentGridInfo {
  totalCols: number
  blocks: BlockGridInfo[]
  headerRows: number
  bodyRows: number
}

// 블록의 열 너비 계산
export function calculateBlockWidth(block: FlowBlock, divisionGridState?: { cols: number }): number {
  // BlockGridCalculator를 사용하여 정확한 크기 계산
  const gridSize = BlockGridCalculator.calculateGridSize(block)
  return gridSize.cols
}

// 블록들의 Grid 배치 계산
export function calculateBlocksLayout(blocks: FlowBlock[], divisionGridStateMap?: Record<number, { cols: number }>): ComponentGridInfo {
  const blockInfos: BlockGridInfo[] = []
  let currentCol = 1
  
  // 각 블록의 위치 계산
  blocks.forEach((block) => {
    const divisionState = divisionGridStateMap?.[block.id]
    const colSpan = calculateBlockWidth(block, divisionState)
    
    blockInfos.push({
      blockId: block.id,
      startCol: currentCol,
      colSpan: colSpan,
      blockName: block.type.name
    })
    
    currentCol += colSpan
  })
  
  // 전체 헤더와 바디의 최대 행 수 계산
  let maxHeaderRows = 1 // 기본 헤더 행 수
  let maxBodyRows = 1 // 모든 블록이 최소 1개 Body 행을 가지도록 초기값을 1로 설정
  
  blocks.forEach(block => {
    // BlockGridCalculator를 사용하여 정확한 행 수 계산
    const gridSize = BlockGridCalculator.calculateGridSize(block)
    const bodyRows = Math.max(1, gridSize.rows)
    
    if (bodyRows > maxBodyRows) {
      maxBodyRows = bodyRows
    }
  })
  
  return {
    totalCols: currentCol - 1,
    blocks: blockInfos,
    headerRows: maxHeaderRows + 1, // +1 for block name row
    bodyRows: maxBodyRows
  }
}

// 특정 블록의 셀이 Grid의 어느 위치에 배치되는지 계산
export function getCellPosition(
  blockInfo: BlockGridInfo, 
  cellRowIndex: number, 
  cellColIndex: number
): { row: number; col: number } {
  return {
    row: cellRowIndex + 1, // +1 because first row is for block names
    col: blockInfo.startCol + cellColIndex
  }
}

// Grid CSS 스타일 생성
export function generateGridStyle(gridInfo: ComponentGridInfo): React.CSSProperties {
  const { totalCols, headerRows, bodyRows } = gridInfo
  
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${totalCols}, 1fr)`,
    gridTemplateRows: `repeat(${headerRows}, auto) repeat(${bodyRows}, auto)`,
    gap: '1px',
    border: '1px solid #e5e7eb',
  }
}

// 블록명 셀의 Grid 영역 계산
export function getBlockNameGridArea(blockInfo: BlockGridInfo): string {
  // 첫 번째 행(row 1)에서 해당 블록의 열 범위를 차지
  const { startCol, colSpan } = blockInfo
  return `1 / ${startCol} / 2 / ${startCol + colSpan}`
}

// Cell의 Grid 영역 계산
export function getCellGridArea(
  blockInfo: BlockGridInfo,
  cellRowIndex: number,
  cellColIndex: number,
  headerRows: number
): string {
  const { startCol } = blockInfo
  const gridRow = cellRowIndex + 2 // +2 because first row is block names, second row starts cells
  const gridCol = startCol + cellColIndex
  
  return `${gridRow} / ${gridCol} / ${gridRow + 1} / ${gridCol + 1}`
}

// 헤더와 바디를 구분하는 유틸리티
export function getHeaderGridArea(
  blockInfo: BlockGridInfo,
  cellRowIndex: number,
  cellColIndex: number
): string {
  const { startCol } = blockInfo
  const gridRow = cellRowIndex + 2 // +2 because first row is block names
  const gridCol = startCol + cellColIndex
  
  return `${gridRow} / ${gridCol} / ${gridRow + 1} / ${gridCol + 1}`
}

export function getBodyGridArea(
  blockInfo: BlockGridInfo,
  cellRowIndex: number,
  cellColIndex: number,
  headerRows: number
): string {
  const { startCol } = blockInfo
  const gridRow = headerRows + cellRowIndex + 1
  const gridCol = startCol + cellColIndex
  
  return `${gridRow} / ${gridCol} / ${gridRow + 1} / ${gridCol + 1}`
}

// 구분 블록용 계층 구조 계산
export function calculateHierarchicalLayout(
  block: FlowBlock, 
  hierarchicalData: HierarchicalCell[]
): {
  renderInfo: CellRenderInfo[]
  gridDimensions: { rows: number; cols: number }
  gridTemplate: { gridTemplateRows: string; gridTemplateColumns: string }
} {
  const renderInfo = GridPositionCalculator.calculatePositions(hierarchicalData)
  const gridDimensions = GridPositionCalculator.calculateGridDimensions(renderInfo)
  const gridTemplate = GridPositionCalculator.generateGridTemplate(renderInfo)
  
  return {
    renderInfo,
    gridDimensions,
    gridTemplate
  }
}

// 구분 블록의 계층 구조용 Grid 영역 계산 (rowspan 지원)
export function getHierarchicalCellGridArea(
  cell: CellRenderInfo,
  blockInfo: BlockGridInfo,
  headerRows: number
): string {
  const { startCol } = blockInfo
  const gridRowStart = headerRows + cell.position.rowStart
  const gridRowEnd = headerRows + cell.position.rowEnd
  const gridCol = startCol + cell.position.colStart - 1 // 0-based에서 1-based로 변환
  
  return `${gridRowStart} / ${gridCol} / ${gridRowEnd} / ${gridCol + 1}`
}

// 구분 블록용 통합된 그리드 스타일 생성 (계층 구조 포함)
export function generateHierarchicalGridStyle(
  gridInfo: ComponentGridInfo,
  hierarchicalDataMap: Record<number, HierarchicalCell[]>
): React.CSSProperties {
  let maxBodyRows = Math.max(gridInfo.bodyRows, 1) // 최소 1개 Body 행 보장
  
  // 각 구분 블록의 계층 구조에서 필요한 행 수 계산
  Object.keys(hierarchicalDataMap).forEach(blockIdStr => {
    const blockId = parseInt(blockIdStr)
    const hierarchicalData = hierarchicalDataMap[blockId]
    
    if (hierarchicalData && hierarchicalData.length > 0) {
      const renderInfo = GridPositionCalculator.calculatePositions(hierarchicalData)
      const dimensions = GridPositionCalculator.calculateGridDimensions(renderInfo)
      
      if (dimensions.rows > maxBodyRows) {
        maxBodyRows = dimensions.rows
      }
    }
  })
  
  const { totalCols, headerRows } = gridInfo
  
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${totalCols}, 1fr)`,
    gridTemplateRows: `repeat(${headerRows}, auto) repeat(${maxBodyRows}, auto)`,
    gap: '1px',
    border: '1px solid #e5e7eb',
  }
}

// 구분 블록인지 확인하는 유틸리티 함수
export function isDivisionBlock(block: FlowBlock): boolean {
  return block.type.name === 'Division'
}