// /lib/utils/blockColumnUtils.ts
// 블록의 열 추가/삭제 관련 유틸리티

import { FlowBlock, FlowCell, CellElement, HierarchicalCell, FlowBlockType } from '@/types/block-structure'

// 기본 셀 생성 함수 (블록 타입별로 다르게 처리)
function createDefaultCell(blockName: string): FlowCell {
  switch (blockName) {
    case 'SubjectGroupRatio':
      return {
        elements: [
          {
            type: 'Token',
            optional: false,
            visible: true,
            menu_key: 'subject_groups',
            value: null,
          },
        ],
      }
    case 'Division':
      return {
        elements: [
          {
            type: 'Token',
            optional: false,
            visible: true,
            menu_key: 'division_criteria',
            value: 'gender',
          },
        ],
      }
    default:
      return {
        elements: [
          {
            type: 'Text',
            optional: false,
            visible: true,
            content: '새로운 열',
          },
        ],
      }
  }
}

// 구분 블록용 기본 헤더 요소 생성
function createDefaultDivisionHeaderElement(): CellElement {
  return {
    type: 'Token',
    optional: false,
    visible: true,
    menu_key: 'division_criteria',
    value: '',
  }
}

// 구분 블록용 기본 자식 셀 생성
function createDefaultDivisionChild(): HierarchicalCell {
  return {
    elements: [
      {
        type: 'Token',
        optional: false,
        visible: true,
        menu_key: 'division_criteria',
        value: '',
      }
    ],
    children: []
  }
}

// 기본 바디 셀 생성 함수
function createDefaultBodyCell(blockName: string): FlowCell {
  switch (blockName) {
    case 'SubjectGroupRatio':
      return {
        elements: [
          {
            type: 'Token',
            optional: false,
            visible: true,
            menu_key: 'ratio_values',
            value: '100',
          },
        ],
      }
    case 'Division':
      return {
        elements: [
          {
            type: 'Token',
            optional: false,
            visible: true,
            menu_key: 'division_values',
            value: 'male',
          },
        ],
      }
    default:
      return {
        elements: [
          {
            type: 'Text',
            optional: false,
            visible: true,
            content: '새로운 데이터 값',
          },
        ],
      }
  }
}

// 블록에 열 추가 (FlowBlockType용)
export function addColumnToBlockType(blockType: FlowBlockType): FlowBlockType {
  if (!blockType.col_editable) {
    console.warn(`Block ${blockType.name} is not col_editable`)
    return blockType
  }

  const newBlockType = JSON.parse(JSON.stringify(blockType)) // Deep copy

  // 구분 블록 (header/children 구조)
  if (newBlockType.header && newBlockType.children) {
    // 헤더에 새로운 요소 추가
    const newHeaderElement = createDefaultDivisionHeaderElement()
    newBlockType.header = [...(newBlockType.header || []), newHeaderElement]
    
    // 자식에 새로운 루트 레벨 셀 추가
    const newChild = createDefaultDivisionChild()
    newBlockType.children = [...(newBlockType.children || []), newChild]
  }
  // 일반 블록 (cols 구조)
  else if (newBlockType.cols) {
    const newCol = {
      header: createDefaultCell(blockType.name),
      rows: [createDefaultBodyCell(blockType.name)]
    }
    newBlockType.cols.push(newCol)
  }

  return newBlockType
}

// 블록에서 열 제거 (FlowBlockType용)
export function removeColumnFromBlockType(blockType: FlowBlockType, columnIndex: number): FlowBlockType {
  if (!blockType.col_editable) {
    console.warn(`Block ${blockType.name} is not col_editable`)
    return blockType
  }

  const newBlockType = JSON.parse(JSON.stringify(blockType)) // Deep copy

  // 구분 블록 (header/children 구조)
  if (newBlockType.header && newBlockType.children) {
    const headerArray = Array.isArray(newBlockType.header) ? newBlockType.header : []
    const childrenArray = Array.isArray(newBlockType.children) ? newBlockType.children : []
    
    if (headerArray.length > 1 && columnIndex < headerArray.length) {
      // 헤더에서 해당 인덱스 제거
      headerArray.splice(columnIndex, 1)
      newBlockType.header = headerArray
    }
    
    if (childrenArray.length > 1 && columnIndex < childrenArray.length) {
      // 자식에서 해당 인덱스 제거 (루트 레벨만)
      childrenArray.splice(columnIndex, 1)
      newBlockType.children = childrenArray
    }
  }
  // 일반 블록 (cols 구조)
  else if (newBlockType.cols && newBlockType.cols.length > 1 && columnIndex < newBlockType.cols.length) {
    newBlockType.cols.splice(columnIndex, 1)
  }

  return newBlockType
}

// 현재 블록의 열 수 계산 (FlowBlockType용)
export function getBlockTypeColumnCount(blockType: FlowBlockType): number {
  // 구분 블록 (header/children 구조)
  if (blockType.header && blockType.children) {
    // 헤더 배열의 길이 또는 자식 배열의 루트 레벨 셀 개수 중 최대값
    const headerCount = Array.isArray(blockType.header) ? blockType.header.length : 1
    const childrenCount = Array.isArray(blockType.children) ? blockType.children.length : 1
    return Math.max(headerCount, childrenCount)
  }
  
  // 일반 블록 (cols 구조)
  if (blockType.cols) {
    return blockType.cols.length
  }
  
  return 1
}

// 블록 타입별 최대 열 수 제한
export function getMaxColumns(blockName: string): number {
  switch (blockName) {
    case 'SubjectGroupRatio':
      return 10 // 교과군별 반영비율은 최대 10열
    case 'Division':
      return 8  // 구분 블록은 최대 8열
    default:
      return 5
  }
}

// 열 추가 가능 여부 확인 (FlowBlockType용)
export function canAddColumnToBlockType(blockType: FlowBlockType): boolean {
  if (!blockType.col_editable) {
    return false
  }
  
  const currentCols = getBlockTypeColumnCount(blockType)
  const maxCols = getMaxColumns(blockType.name)
  
  return currentCols < maxCols
}

// 호환성을 위한 기존 함수들 (deprecated)
// 이 함수들은 테스트 호환성을 위해 유지되지만, 실제로는 작동하지 않습니다.
export function addColumnToBlock(block: FlowBlock): FlowBlock {
  console.warn('addColumnToBlock is deprecated. Use addColumnToBlockType instead.')
  // FlowBlock에는 type 속성이 없으므로 실제로는 작동하지 않습니다.
  return block
}

export function removeColumnFromBlock(block: FlowBlock, columnIndex: number): FlowBlock {
  console.warn('removeColumnFromBlock is deprecated. Use removeColumnFromBlockType instead.')
  // FlowBlock에는 type 속성이 없으므로 실제로는 작동하지 않습니다.
  return block
}

export function getBlockColumnCount(block: FlowBlock): number {
  console.warn('getBlockColumnCount is deprecated. Use getBlockTypeColumnCount instead.')
  // FlowBlock에는 type 속성이 없으므로 기본값 1을 반환합니다.
  return 1
}

export function canAddColumn(block: FlowBlock): boolean {
  console.warn('canAddColumn is deprecated. Use canAddColumnToBlockType instead.')
  // FlowBlock에는 type 속성이 없으므로 false를 반환합니다.
  return false
}