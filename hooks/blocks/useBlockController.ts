'use client'

import * as React from 'react'
import type { BlockSchema } from './useBlockSchema'

export type UseBlockControllerArgs = {
  schema: BlockSchema
  value: Record<string, any>
  onChange: (patch: Record<string, any>) => void
}

export function useBlockController({ schema, value, onChange }: UseBlockControllerArgs) {
  const getValue = React.useCallback(
    (cellId: string) => {
      return value?.[cellId]
    },
    [value]
  )

  const setValue = React.useCallback(
    (cellId: string, v: any) => {
      onChange({ [cellId]: v })
    },
    [onChange]
  )

  const validate = React.useCallback(() => {
    const errors: Record<string, string> = {}
    for (const cell of schema.cells) {
      if (cell.validate) {
        const msg = cell.validate(getValue(cell.id))
        if (msg) errors[cell.id] = msg
      }
    }
    return errors
  }, [schema, getValue])

  const [focusedCellId, setFocusedCellId] = React.useState<string | null>(null)

  return {
    getValue,
    setValue,
    validate,
    focusedCellId,
    setFocusedCellId,
  }
}


