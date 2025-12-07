import * as React from 'react'
import { List } from '@/components/builder/block_builder/CellElement/List'
import { createListElement } from '@/lib/blocks/modules/common/elementHelpers'
import { TOKEN_MENU_KEYS } from '@/lib/data/token-menus'

interface SubjectGroupCellProps {
  cellData: Record<string, any>
  onChange: (key: string, value: any) => void
  readOnly?: boolean
}

export const SubjectGroupCell: React.FC<SubjectGroupCellProps> = ({
  cellData,
  onChange,
  readOnly = false,
}) => {
  const subjectGroups = Array.isArray(cellData.subject_groups) ? cellData.subject_groups : []

  return (
    <div>
      <List
        element={createListElement({
          item_type: 'Token',
          menu_key: TOKEN_MENU_KEYS.SUBJECT_GROUP,
          value: subjectGroups,
          optional: false,
          visible: true,
        })}
        onChange={(value) => {
          if (!readOnly) {
            onChange('subject_groups', Array.isArray(value) ? value : [])
          }
        }}
      />
    </div>
  )
}

