import * as React from 'react'

interface GraduateGradeCellProps {
  cellData: Record<string, any>
  onChange: (key: string, value: any) => void
  readOnly?: boolean
}

export const GraduateGradeCell: React.FC<GraduateGradeCellProps> = ({
  cellData,
  onChange,
  readOnly = false,
}) => {
  // TODO: 졸업학년 셀 타입 구현
  return <div>졸업학년</div>
}

