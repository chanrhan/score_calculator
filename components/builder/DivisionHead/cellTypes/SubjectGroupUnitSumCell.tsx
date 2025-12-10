import * as React from 'react'
import { Token } from '@/components/builder/block_builder/CellElement/Token'
import { InputField } from '@/components/builder/block_builder/CellElement/InputField'
import { createTokenElement, createInputFieldElement } from '@/lib/blocks/modules/common/elementHelpers'
import { TOKEN_MENU_KEYS } from '@/lib/data/token-menus'

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
  const compareOption = cellData.compare_option !== undefined ? String(cellData.compare_option) : '1'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
        <Token
          element={createTokenElement({
            menu_key: TOKEN_MENU_KEYS.COMPARE_OPTION,
            value: compareOption,
            optional: false,
            visible: true,
          })}
          onChange={(value) => {
            if (!readOnly) {
              onChange('compare_option', value)
            }
          }}
          autoFit={true}
        />
      </div>
    </div>
  )
}

