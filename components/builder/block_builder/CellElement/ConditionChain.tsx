'use client'

import * as React from 'react'
import type { ConditionChainElement, ConditionChainItemType } from '@/types/block-structure'
import { Token } from './Token'
import { Text } from './Text'
import { InputField } from './InputField'
import { FormulaModal } from './FormulaModal'
import { SelectionInput } from './SelectionInput'
import { TOKEN_MENU_KEYS } from '@/lib/data/token-menus'
import styles from './ConditionChain.module.css'

interface ConditionChainProps {
  element: ConditionChainElement
  onChange?: (value: Array<Record<string, any>>) => void
  className?: string
  varScope?: '0' | '1' // 블록 헤더의 var_scope 값 ('0': 학생, '1': 과목)
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
  // 카드 내부의 스키마만 반환 (논리 연산자는 별도 처리)
  return Array.isArray(base) ? base : []
}


function defaultRowForRowIndex(base: ConditionChainItemType[], rowIndex: number): any[] {
  const rowSchema = getRowSchema(base, rowIndex)
  const cardValues = rowSchema.map((f) => defaultFieldValue(f.type))
  // 두 번째 행부터는 논리 연산자를 맨 앞에 추가
  if (rowIndex >= 1) {
    return ['&&', ...cardValues]
  }
  return cardValues
}

export const ConditionChain: React.FC<ConditionChainProps> = ({ element, onChange, className = '', varScope }) => {
  const { value, optional, visible, item_type } = element

  if (optional && !visible) {
    return null
  }

  const arrayValue = Array.isArray(value) ? value : []
  const schema = Array.isArray(item_type) ? item_type : []
  const itemsToRender = arrayValue.length > 0 ? arrayValue : (optional ? null : [defaultRowForRowIndex(schema, 0)])

  const updateItemAt = (rowIndex: number, colIndex: number, newValue: any) => {
    const next = Array.isArray(arrayValue) ? [...arrayValue] : []
    let current = Array.isArray(next[rowIndex]) ? [...next[rowIndex]] : defaultRowForRowIndex(schema, rowIndex)
    
    // colIndex는 이미 조정된 인덱스 (논리 연산자가 있으면 +1된 상태)
    // 하지만 첫 번째 행의 경우 논리 연산자가 없으므로 그대로 사용
    // 두 번째 행부터는 colIndex가 이미 +1된 상태로 전달됨
    current[colIndex] = newValue
    
    next[rowIndex] = current
    onChange?.(next)
  }

  const updateLogicalOperator = (rowIndex: number, newValue: string) => {
    const next = Array.isArray(arrayValue) ? [...arrayValue] : []
    let current = Array.isArray(next[rowIndex]) ? [...next[rowIndex]] : defaultRowForRowIndex(schema, rowIndex)
    
    // 논리 연산자가 없으면 추가, 있으면 업데이트
    if (rowIndex >= 1) {
      current[0] = newValue
      next[rowIndex] = current
      onChange?.(next)
    }
  }

  const addItem = () => {
    const newRowIndex = arrayValue.length
    const newRow = defaultRowForRowIndex(schema, newRowIndex)
    // 두 번째 행부터는 논리 연산자를 맨 앞에 추가
    if (newRowIndex >= 1) {
      const logicalOperatorRow = ['&&', ...newRow]
      const next = [...arrayValue, logicalOperatorRow]
      onChange?.(next)
    } else {
      const next = [...arrayValue, newRow]
      onChange?.(next)
    }
  }

  const removeItem = (rowIndex: number) => {
    if (arrayValue.length === 0) return
    const next = arrayValue.filter((_, index) => index !== rowIndex)
    onChange?.(next)
  }

  const renderField = (field: ConditionChainItemType, rowIndex: number, row: any[], colIndex: number, hasLogicalOperator: boolean) => {
    const base = { optional: false, visible: true } as const
    const fieldValue = row?.[colIndex]
    // updateItemAt에 전달할 실제 인덱스 (논리 연산자가 있으면 +1)
    const actualColIndex = hasLogicalOperator ? colIndex + 1 : colIndex
    
    switch (field.type) {
      case 'Token':
        const tokenElement = { ...(field as any), value: fieldValue }
        // VARIABLE 키를 사용하는 Token에 var_use, var_store 설정
        if (tokenElement.menu_key === TOKEN_MENU_KEYS.VARIABLE) {
          tokenElement.var_use = true
          tokenElement.var_store = true
        }
        return (
          <Token
            element={tokenElement}
            onChange={(v) => updateItemAt(rowIndex, actualColIndex, v)}
            varScope={varScope}
          />
        )
      case 'InputField':
        return (
          <InputField
            element={{ ...(field as any), value: fieldValue }}
            onChange={(v) => updateItemAt(rowIndex, actualColIndex, v)}
          />
        )
      case 'SelectionInput':
        return (
          <SelectionInput
            element={{ ...(field as any), value: fieldValue }}
            onChange={(v: string) => updateItemAt(rowIndex, actualColIndex, v)}
          />
        )
      case 'Text':
        return <Text element={{ ...(field as any), content: String((field as any).content ?? '') }} />
      case 'Formula':
        return (
          <FormulaModal
            element={{ ...(field as any), value: fieldValue }}
            onChange={(v) => updateItemAt(rowIndex, actualColIndex, v)}
            varScope={varScope}
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
          ? [...row, ...Array(Math.max(0, (rowIndex >= 1 ? rowSchema.length + 1 : rowSchema.length) - row.length)).fill('')]
          : defaultRowForRowIndex(schema, rowIndex)
        
        // 논리 연산자 추출 (두 번째 행부터)
        const logicalOperator = rowIndex >= 1 ? normalizedRow[0] : null
        // 카드 내부의 데이터만 추출 (논리 연산자 제외)
        const cardData = rowIndex >= 1 ? normalizedRow.slice(1) : normalizedRow
        
        const isLastRow = rowIndex === (itemsToRender.length - 1)
        
        return (
          <div key={rowIndex} className={styles.conditionRow}>
            <div className={styles.logicalOperatorContainer}>
              {logicalOperator ? (
                <Token
                  element={{
                    type: 'Token',
                    menu_key: TOKEN_MENU_KEYS.LOGICAL_OPERATOR,
                    value: logicalOperator,
                    optional: false,
                    visible: true,
                  }}
                  onChange={(v) => updateLogicalOperator(rowIndex, v)}
                  autoFit={true}
                />
              ) : (
                <span className={styles.logicalOperatorPlaceholder}></span>
              )}
            </div>
            <div className={styles.conditionCard}>
              {rowSchema.map((field, colIndex) => {
                // 논리 연산자가 있는 경우 카드 데이터 사용, 없으면 전체 데이터 사용
                const adjustedRow = rowIndex >= 1 ? cardData : normalizedRow
                const hasLogicalOperator = rowIndex >= 1
                
                // operator 값 확인 (schema에서 operator는 보통 두 번째 필드, colIndex 1)
                const operatorValue = adjustedRow[1]
                const isExistsOperator = operatorValue === 'exists' || operatorValue === 'not_exists'
                
                // Formula 필드이고 exists/not_exists 연산자가 선택된 경우 숨김
                if (field.type === 'Formula' && isExistsOperator) {
                  return null
                }
                
                return (
                  <div key={colIndex} className={styles.itemField}>
                    {renderField(field, rowIndex, adjustedRow, colIndex, hasLogicalOperator)}
                  </div>
                )
              })}
            </div>
            <div className={styles.rowActions}>
              {isLastRow && (
                <button type="button" onClick={addItem} className={styles.addButton}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={styles.icon}>
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
              <button type="button" onClick={() => removeItem(rowIndex)} className={styles.removeButton}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={styles.icon}>
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 100 2h12a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM5 8a1 1 0 011-1h8a1 1 0 011 1v7a2 2 0 01-2 2H7a2 2 0 01-2-2V8zm3 1a1 1 0 012 0v6a1 1 0 11-2 0V9zm4-1a1 1 0 00-1 1v6a1 1 0 102 0V9a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}


