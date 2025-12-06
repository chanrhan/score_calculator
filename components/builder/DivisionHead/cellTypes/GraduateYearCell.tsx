import * as React from 'react'

interface GraduateYearCellProps {
  cellData: Record<string, any>
  onChange: (key: string, value: any) => void
  readOnly?: boolean
}

export const GraduateYearCell: React.FC<GraduateYearCellProps> = ({
  cellData,
  onChange,
  readOnly = false,
}) => {
  // TODO: 졸업년도 셀 타입 구현
  return <div>졸업년도</div>
}

