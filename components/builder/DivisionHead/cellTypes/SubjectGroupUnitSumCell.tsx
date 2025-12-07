import * as React from 'react'
import { InputField } from '@/components/builder/block_builder/CellElement/InputField'
import { createInputFieldElement } from '@/lib/blocks/modules/common/elementHelpers'

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
  const value = cellData.value !== undefined ? Number(cellData.value) : 0

  return (
    <div>
      <InputField
        element={createInputFieldElement({
          value: String(value),
          optional: false,
          visible: true,
          inputType: 'number',
        })}
        onChange={(newValue) => {
          if (!readOnly) {
            onChange('value', Number(newValue))
          }
        }}
        autoFit={true}
      />
    </div>
  )
}

