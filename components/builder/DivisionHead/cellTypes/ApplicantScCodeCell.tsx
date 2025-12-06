import * as React from 'react'

interface ApplicantScCodeCellProps {
  cellData: Record<string, any>
  onChange: (key: string, value: any) => void
  readOnly?: boolean
}

export const ApplicantScCodeCell: React.FC<ApplicantScCodeCellProps> = ({
  cellData,
  onChange,
  readOnly = false,
}) => {
  // TODO: 지원자 유형 셀 타입 구현
  return <div>지원자 유형</div>
}

