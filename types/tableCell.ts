// 테이블 셀의 기본 타입 정의

export interface CellPosition {
  row: number
  col: number
  rowSpan?: number
  colSpan?: number
}

export interface CellToken {
  type: 'text' | 'select' | 'input' | 'number' | 'textarea' | 'button' | 'custom'
  name: string
  value: any
  placeholder?: string
  options?: Array<{ value: string; label: string }>
  disabled?: boolean
  className?: string
  onClick?: () => void
  onChange?: (value: any) => void
  renderer?: (token: CellToken) => React.ReactNode
}

export interface TableCell {
  id: string
  position: CellPosition
  tokens: CellToken[]
  className?: string
  style?: React.CSSProperties
  isHeader?: boolean
  onClick?: () => void
  onHover?: (hovered: boolean) => void
}

export interface TableGridConfig {
  rows: number
  cols: number
  className?: string
  style?: React.CSSProperties
  gridTemplateColumns?: string
  gridTemplateRows?: string
  gap?: string
  onCellChange?: (cellId: string, tokenName: string, value: any) => void
  onAddCell?: (position: CellPosition) => void
  onRemoveCell?: (cellId: string) => void
}

export interface TableGridProps {
  cells: TableCell[]
  config: TableGridConfig
  children?: React.ReactNode
}