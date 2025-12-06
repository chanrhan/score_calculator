import * as React from 'react'

interface MajorCodeCellProps {
  cellData: Record<string, any>
  onChange: (key: string, value: any) => void
  readOnly?: boolean
}

export const MajorCodeCell: React.FC<MajorCodeCellProps> = ({
  cellData,
  onChange,
  readOnly = false,
}) => {
  // TODO: 모집단위 셀 타입 구현
  return <div>모집단위</div>
}

