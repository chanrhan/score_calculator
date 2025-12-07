import * as React from 'react'
import { List } from '@/components/builder/block_builder/CellElement/List'
import { createListElement } from '@/lib/blocks/modules/common/elementHelpers'

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
  const codes = Array.isArray(cellData.codes) ? cellData.codes : []

  return (
    <div>
      <List
        element={createListElement({
          item_type: 'Token',
          menu_key: 'admission_code',
          value: codes,
          optional: false,
          visible: true,
        })}
        onChange={(value) => {
          if (!readOnly) {
            onChange('codes', Array.isArray(value) ? value : [])
          }
        }}
      />
    </div>
  )
}

