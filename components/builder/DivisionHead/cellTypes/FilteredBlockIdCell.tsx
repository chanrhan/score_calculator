import * as React from 'react'

interface FilteredBlockIdCellProps {
  cellData: Record<string, any>
  onChange: (key: string, value: any) => void
  readOnly?: boolean
}

export const FilteredBlockIdCell: React.FC<FilteredBlockIdCellProps> = ({
  cellData,
  onChange,
  readOnly = false,
}) => {
  // TODO: 필터링된 블록 ID 셀 타입 구현
    return <div>필터링된 블록 ID</div>
}

