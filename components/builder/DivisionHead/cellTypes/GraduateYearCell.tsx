import * as React from 'react'
import { Token } from '@/components/builder/block_builder/CellElement/Token'
import { InputField } from '@/components/builder/block_builder/CellElement/InputField'
import { createTokenElement, createInputFieldElement } from '@/lib/blocks/modules/common/elementHelpers'
import { TOKEN_MENU_KEYS } from '@/lib/data/token-menus'

interface GraduateYearCellProps {
  cellData: Record<string, any>
  onChange: (key: string, value: any) => void
  readOnly?: boolean
}

export const GraduateYearCell: React.FC<GraduateYearCellProps> = ({
  cellData,
  onChange,
  readOnly = false,
}) => {
  const year = cellData.year !== undefined ? Number(cellData.year) : new Date().getFullYear()
  const compareOption = cellData.compare_option || '0'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <InputField
          element={createInputFieldElement({
            value: String(year),
            optional: false,
            visible: true,
            inputType: 'number',
          })}
          onChange={(value) => {
            if (!readOnly) {
              onChange('year', Number(value))
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

