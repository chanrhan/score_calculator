'use client'

import * as React from 'react'
import type { ConditionChainElement, ConditionChainItemType } from '@/types/block-structure'
import { Token } from './Token'
import { Text } from './Text'
import { InputField } from './InputField'
import { Formula } from './Formula'
import { SelectionInput } from './SelectionInput'
import { TOKEN_MENU_KEYS } from '@/lib/data/token-menus'
import styles from './ConditionChain.module.css'

interface ConditionChainProps {
  element: ConditionChainElement
  onChange?: (value: Array<Record<string, any>>) => void
  className?: string
}

function defaultFieldValue(type: ConditionChainItemType['type']): any {
  switch (type) {
    case 'Token':
    case 'InputField':
    case 'Text':
    case 'Formula':
    case 'SelectionInput':
    default:
      return ''
  }
}

function defaultRowByItemType(itemType: ConditionChainItemType[]): any[] {
  if (!Array.isArray(itemType)) return []
  return itemType.map((f) => defaultFieldValue(f.type))
}

function getRowSchema(base: ConditionChainItemType[], rowIndex: number): ConditionChainItemType[] {
  const schema = Array.isArray(base) ? base : []
  if (rowIndex >= 1) {
    // 둘째 요소부터는 맨 앞에 논리연산자 토큰을 추가
    return [{ type: 'Token', menu_key: TOKEN_MENU_KEYS.LOGICAL_OPERATOR } as const, ...schema]
  }
  return schema
}

function defaultRowForRowIndex(base: ConditionChainItemType[], rowIndex: number): any[] {
  const rowSchema = getRowSchema(base, rowIndex)
  return rowSchema.map((f) => defaultFieldValue(f.type))
}

export const ConditionChain: React.FC<ConditionChainProps> = ({ element, onChange, className = '' }) => {
  const { value, optional, visible, item_type } = element

  if (optional && !visible) {
    return null
  }

  const arrayValue = Array.isArray(value) ? value : []
  const schema = Array.isArray(item_type) ? item_type : []
  const itemsToRender = arrayValue.length > 0 ? arrayValue : (optional ? null : [defaultRowForRowIndex(schema, 0)])

  const updateItemAt = (rowIndex: number, colIndex: number, newValue: any) => {
    const next = Array.isArray(arrayValue) ? [...arrayValue] : []
    const current = Array.isArray(next[rowIndex]) ? [...next[rowIndex]] : defaultRowForRowIndex(schema, rowIndex)
    current[colIndex] = newValue
    next[rowIndex] = current
    onChange?.(next)
  }

  const addItem = () => {
    const next = [...arrayValue, defaultRowForRowIndex(schema, arrayValue.length)]
    onChange?.(next)
  }

  const removeItem = () => {
    if (arrayValue.length === 0) return
    const next = arrayValue.slice(0, -1)
    onChange?.(next)
  }

  const renderField = (field: ConditionChainItemType, rowIndex: number, row: any[], colIndex: number) => {
    const base = { optional: false, visible: true } as const
    const fieldValue = row?.[colIndex]
    switch (field.type) {
      case 'Token':
        return (
          <Token
            element={
              { ...(field as any),
                value: fieldValue, 
              }
            }
            onChange={(v) => updateItemAt(rowIndex, colIndex, v)}
          />
        )
      case 'InputField':
        return (
          <InputField
            element={{ ...(field as any), value: fieldValue }}
            onChange={(v) => updateItemAt(rowIndex, colIndex, v)}
          />
        )
      case 'SelectionInput':
        return (
          <SelectionInput
            element={{ ...(field as any), value: fieldValue }}
            onChange={(v: string) => updateItemAt(rowIndex, colIndex, v)}
          />
        )
      case 'Text':
        return <Text element={{ ...(field as any), content: String((field as any).content ?? '') }} />
      case 'Formula':
        return (
          <Formula
            element={{ ...(field as any), value: fieldValue }}
            onChange={(v) => updateItemAt(rowIndex, colIndex, v)}
          />
        )
      default:
        return <span className={styles.errorText}>Unsupported</span>
    }
  }

  return (
    <div className={`${styles.container} ${className}`}>
      {itemsToRender && itemsToRender.map((row, rowIndex) => {
        const rowSchema = getRowSchema(schema, rowIndex)
        const normalizedRow = Array.isArray(row)
          ? [...row, ...Array(Math.max(0, rowSchema.length - row.length)).fill('')]
          : defaultRowForRowIndex(schema, rowIndex)
        return (
        <div key={rowIndex} className={styles.itemContainer}>
          {rowSchema.map((field, colIndex) => (
            <div key={colIndex} className={styles.itemField}>
              {renderField(field, rowIndex, normalizedRow, colIndex)}
            </div>
          ))}
        </div>
      )})}
      <div className={styles.actions}>
        <button type="button" onClick={addItem} className={styles.addButton}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={styles.icon}>
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
        <button type="button" onClick={removeItem} className={styles.removeButton}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={styles.icon}>
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 100 2h12a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM5 8a1 1 0 011-1h8a1 1 0 011 1v7a2 2 0 01-2 2H7a2 2 0 01-2-2V8zm3 1a1 1 0 012 0v6a1 1 0 11-2 0V9zm4-1a1 1 0 00-1 1v6a1 1 0 102 0V9a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  )
}


