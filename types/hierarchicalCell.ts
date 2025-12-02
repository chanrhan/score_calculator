// 계층적 셀 구조를 위한 타입 정의
export interface HierarchicalCell {
  id: string                    // 고유 식별자
  type: string                 // 구분 유형 (graduateYear, admission, major 등)
  values: Record<string, any>   // CompositeToken 값들
  level: number                // 계층 깊이 (0=최상위)
  children: HierarchicalCell[] // 자식 셀들
  rowspan?: number            // 계산된 세로 병합 크기
  parent?: string             // 부모 셀 ID (루트는 undefined)
  rowIndex: number            // 행 인덱스
  colIndex: number            // 열 인덱스
}

// 그리드 포지션 정보
export interface GridPosition {
  rowStart: number
  rowEnd: number
  colStart: number
  colEnd: number
}

// 셀 렌더링 정보
export interface CellRenderInfo extends HierarchicalCell {
  position: GridPosition
  isLeaf: boolean      // 자식이 없는 말단 셀인지
  hasParent: boolean   // 부모가 있는지
}

// 유틸리티 함수들
export class HierarchicalCellUtils {
  
  // 고유 ID 생성
  static generateId(): string {
    return `cell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 새로운 빈 셀 생성
  static createEmptyCell(level: number, type: string = '', parent?: string): HierarchicalCell {
    return {
      id: this.generateId(),
      type,
      values: {},
      level,
      children: [],
      parent,
      rowIndex: 0,
      colIndex: 0
    }
  }

  // 트리에서 특정 셀 찾기 (DFS)
  static findCell(root: HierarchicalCell[], cellId: string): HierarchicalCell | null {
    for (const cell of root) {
      if (cell.id === cellId) return cell
      
      const found = this.findCell(cell.children, cellId)
      if (found) return found
    }
    return null
  }

  // 특정 셀의 모든 조상들 반환
  static getAncestors(root: HierarchicalCell[], cellId: string): HierarchicalCell[] {
    const ancestors: HierarchicalCell[] = []
    
    function findPath(cells: HierarchicalCell[], targetId: string, path: HierarchicalCell[]): boolean {
      for (const cell of cells) {
        const newPath = [...path, cell]
        
        if (cell.id === targetId) {
          ancestors.push(...path)
          return true
        }
        
        if (findPath(cell.children, targetId, newPath)) {
          return true
        }
      }
      return false
    }
    
    findPath(root, cellId, [])
    return ancestors
  }

  // 형제 셀 추가 (하단 오버레이 클릭)
  static addSibling(root: HierarchicalCell[], cellId: string): HierarchicalCell[] {
    const targetCell = this.findCell(root, cellId)
    if (!targetCell) return root

    // 타겟 셀의 타입을 상속받은 새 형제 셀 생성
    const newSibling = this.createEmptyCell(targetCell.level, targetCell.type, targetCell.parent)

    // 루트 레벨인 경우
    if (targetCell.level === 0) {
      return [...root, newSibling]
    }

    // 부모를 찾아서 자식 배열에 추가
    function addToParent(cells: HierarchicalCell[]): HierarchicalCell[] {
      return cells.map(cell => {
        if (cell.id === targetCell?.parent) {
          return {
            ...cell,
            children: [...cell.children, newSibling]
          }
        }
        return {
          ...cell,
          children: addToParent(cell.children)
        }
      })
    }

    return addToParent(root)
  }

  // 자식 레벨 추가 (오른쪽 오버레이 클릭)
  static addChild(root: HierarchicalCell[], cellId: string): HierarchicalCell[] {
    const targetCell = this.findCell(root, cellId)
    if (!targetCell) return root

    // 다음 레벨에 적합한 타입 추론
    const childType = this.inferNextLevelType(targetCell.type, targetCell.level)
    const newChild = this.createEmptyCell(targetCell.level + 1, childType, cellId)

    function updateCell(cells: HierarchicalCell[]): HierarchicalCell[] {
      return cells.map(cell => {
        if (cell.id === cellId) {
          return {
            ...cell,
            children: [...cell.children, newChild]
          }
        }
        return {
          ...cell,
          children: updateCell(cell.children)
        }
      })
    }

    return updateCell(root)
  }

  // 다음 레벨에 적합한 타입 추론
  static inferNextLevelType(parentType: string, parentLevel: number): string {
    // 일반적인 계층 구조: 졸업년도 → 전형 → 단위
    const commonHierarchy = [
      'graduateYear',    // 레벨 0
      'admission',       // 레벨 1
      'major',          // 레벨 2
      'subjectGroup',   // 레벨 3
      'unit'           // 레벨 4+
    ]

    // 부모 타입에 따른 다음 타입 추론
    const typeTransitions: Record<string, string> = {
      'graduateYear': 'admission',
      'admission': 'major', 
      'major': 'subjectGroup',
      'subjectGroup': 'unit',
      'unit': 'subjectSeparation'
    }

    // 부모 타입 기반 추론이 가능한 경우
    if (typeTransitions[parentType]) {
      return typeTransitions[parentType]
    }

    // 레벨 기반 추론
    if (parentLevel + 1 < commonHierarchy.length) {
      return commonHierarchy[parentLevel + 1]
    }

    // 기본값
    return ''
  }

  // rowspan 자동 계산
  static calculateRowspan(cell: HierarchicalCell): number {
    if (cell.children.length === 0) {
      return 1 // 말단 셀은 1행
    }

    // 모든 자식들의 rowspan 합계
    const childrenRowspan = cell.children.reduce((sum, child) => {
      return sum + this.calculateRowspan(child)
    }, 0)

    return childrenRowspan
  }

  // 전체 트리의 rowspan 계산 및 업데이트 (빈 공간 방지)
  static updateRowspans(root: HierarchicalCell[]): HierarchicalCell[] {
    function updateCell(cell: HierarchicalCell): HierarchicalCell {
      // 먼저 모든 자식들을 재귀적으로 업데이트
      const updatedChildren = cell.children.map(updateCell)
      
      let rowspan: number
      if (updatedChildren.length > 0) {
        // 자식이 있는 경우: 모든 자식의 rowspan 합계
        rowspan = updatedChildren.reduce((sum, child) => sum + (child.rowspan || 1), 0)
      } else {
        // 말단 셀인 경우: 정확히 1행만 차지
        rowspan = 1
      }

      return {
        ...cell,
        children: updatedChildren,
        rowspan
      }
    }

    return root.map(updateCell)
  }

  // 리프 셀 개수 계산
  static getLeafCells(root: HierarchicalCell[]): HierarchicalCell[] {
    const leafCells: HierarchicalCell[] = []
    
    function traverse(cells: HierarchicalCell[]) {
      for (const cell of cells) {
        if (cell.children.length === 0) {
          leafCells.push(cell)
        } else {
          traverse(cell.children)
        }
      }
    }
    
    traverse(root)
    return leafCells
  }

  // 최대 깊이 계산
  static getMaxDepth(root: HierarchicalCell[]): number {
    let maxDepth = 0
    
    function traverse(cells: HierarchicalCell[]) {
      for (const cell of cells) {
        maxDepth = Math.max(maxDepth, cell.level + 1)
        traverse(cell.children)
      }
    }
    
    traverse(root)
    return maxDepth
  }

  // 셀 삭제
  static deleteCell(root: HierarchicalCell[], cellId: string): HierarchicalCell[] {
    // 루트 레벨에서 삭제
    const filteredRoot = root.filter(cell => cell.id !== cellId)
    
    // 자식들에서도 재귀적으로 삭제
    function removeFromChildren(cells: HierarchicalCell[]): HierarchicalCell[] {
      return cells.map(cell => ({
        ...cell,
        children: removeFromChildren(cell.children.filter(child => child.id !== cellId))
      }))
    }

    return removeFromChildren(filteredRoot)
  }
}

export default HierarchicalCellUtils