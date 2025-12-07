import * as React from 'react'
import { List } from '@/components/builder/block_builder/CellElement/List'
import { createListElement } from '@/lib/blocks/modules/common/elementHelpers'

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
  const codes = Array.isArray(cellData.codes) ? cellData.codes : []

  return (
    <div>
      <List
        element={createListElement({
          item_type: 'Token',
          menu_key: 'major_code',
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

