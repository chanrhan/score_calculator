import * as React from 'react'
import { Token } from '@/components/builder/block_builder/CellElement/Token'
import { createTokenElement } from '@/lib/blocks/modules/common/elementHelpers'
import { TOKEN_MENU_KEYS } from '@/lib/data/token-menus'

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
  const type = cellData.type || '1'

  return (
    <div>
      <Token
        element={createTokenElement({
          menu_key: TOKEN_MENU_KEYS.APPLICANT_SC_CODE,
          value: type,
          optional: false,
          visible: true,
        })}
        onChange={(value) => {
          if (!readOnly) {
            onChange('type', value)
          }
        }}
        autoFit={true}
      />
    </div>
  )
}

