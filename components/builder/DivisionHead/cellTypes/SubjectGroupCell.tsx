import * as React from 'react'

interface SubjectGroupCellProps {
  cellData: Record<string, any>
  onChange: (key: string, value: any) => void
  readOnly?: boolean
}

export const SubjectGroupCell: React.FC<SubjectGroupCellProps> = ({
  cellData,
  onChange,
  readOnly = false,
}) => {
  // TODO: 교과군 셀 타입 구현
    return <div>교과군</div>
}

