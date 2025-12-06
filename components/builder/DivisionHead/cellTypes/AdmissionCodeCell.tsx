import * as React from 'react'

interface AdmissionCodeCellProps {
  cellData: Record<string, any>
  onChange: (key: string, value: any) => void
  readOnly?: boolean
}

export const AdmissionCodeCell: React.FC<AdmissionCodeCellProps> = ({
  cellData,
  onChange,
  readOnly = false,
}) => {
  // TODO: 모집전형 셀 타입 구현
  return <div>전형코드</div>
}

