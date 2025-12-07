import * as React from 'react'
import { Token } from '@/components/builder/block_builder/CellElement/Token'
import { createTokenElement } from '@/lib/blocks/modules/common/elementHelpers'
import { TOKEN_MENU_KEYS } from '@/lib/data/token-menus'

interface GraduateGradeCellProps {
  cellData: Record<string, any>
  onChange: (key: string, value: any) => void
  readOnly?: boolean
}

export const GraduateGradeCell: React.FC<GraduateGradeCellProps> = ({
  cellData,
  onChange,
  readOnly = false,
}) => {
  const grade = cellData.grade || '1'

  return (
    <div>
      <Token
        element={createTokenElement({
          menu_key: TOKEN_MENU_KEYS.GRADE,
          value: grade,
          optional: false,
          visible: true,
        })}
        onChange={(value) => {
          if (!readOnly) {
            onChange('grade', value)
          }
        }}
        autoFit={true}
      />
    </div>
  )
}

