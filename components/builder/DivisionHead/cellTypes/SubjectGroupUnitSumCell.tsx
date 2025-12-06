import * as React from 'react'

interface SubjectGroupUnitSumCellProps {
  cellData: Record<string, any>
  onChange: (key: string, value: any) => void
  readOnly?: boolean
}

export const SubjectGroupUnitSumCell: React.FC<SubjectGroupUnitSumCellProps> = ({
  cellData,
  onChange,
  readOnly = false,
}) => {
  // TODO: 교과군별 이수단위 합 셀 타입 구현
  return <div>교과군별 이수단위 합</div>
}

