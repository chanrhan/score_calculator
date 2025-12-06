import * as React from 'react'

interface SubjectSeparationCodeCellProps {
  cellData: Record<string, any>
  onChange: (key: string, value: any) => void
  readOnly?: boolean
}

export const SubjectSeparationCodeCell: React.FC<SubjectSeparationCodeCellProps> = ({
  cellData,
  onChange,
  readOnly = false,
}) => {
  // TODO: 과목구분 셀 타입 구현
    return <div>과목구분</div>
}

