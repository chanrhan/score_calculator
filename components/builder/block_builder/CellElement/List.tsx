'use client'

import * as React from 'react'
import type { ListElement } from '@/types/block-structure'
import { Token } from './Token'
import { Text } from './Text'
import { InputField } from './InputField'
import { Formula } from './Formula'
import styles from './List.module.css'
import { OrderToken } from './OrderToken'

interface ListProps {
  element: ListElement
  onChange?: (value: any[]) => void
  className?: string
}

export const List: React.FC<ListProps> = ({ element, onChange, className = '' }) => {
  const { value, optional, visible, item_type, menu_key, menu_key2 } = element

  // if (optional && !visible) {
  //   return null
  // }


  const valueArray = Array.isArray(value) ? value : []
  const itemsToRender =  valueArray.length > 0 ? valueArray : (
    optional ? null : Array(1).fill('')
  )

  const updateItemAt = (index: number, newValue: any) => {
    const next = Array.isArray(valueArray) ? [...valueArray] : []
    next[index] = newValue
    onChange?.(next)
  }

  const defaultItemValue = () => {
    switch (item_type) {
      case 'Token':
      case 'InputField':
      case 'Text':
      case 'Formula':
        return ''
      case 'Table':
        return []
      default:
        return ''
    }
  }

  const addItem = () => {
    const next = [...valueArray, defaultItemValue()]
    onChange?.(next)
  }

  const renderItem = (itemValue: any, index: number) => {
    const base = { optional: false, visible: true } as const
    switch (item_type) {
      case 'Token':
        return (
          <Token
            element={{ type: 'Token', menu_key: menu_key || '', value: itemValue, ...base }}
            onChange={(v) => updateItemAt(index, v)}
          />
        )
      case 'OrderToken':
        return (
          <OrderToken
            element={{ type: 'OrderToken', menu_key: menu_key || '', menu_key2: menu_key2 || '', value: itemValue as (string | null)[], ...base }}
            onChange={(v) => updateItemAt(index, v)}
          />
        )
      case 'InputField':
        return (
          <InputField
            element={{ type: 'InputField', value: itemValue, ...base }}
            onChange={(v) => updateItemAt(index, v)}
          />
        )
      case 'Text':
        return <Text element={{ type: 'Text', content: String(itemValue ?? ''), ...base }} />
      case 'Formula':
        return (
          <Formula
            element={{ type: 'Formula', value: itemValue, menu_key: '', ...base }}
            onChange={(v) => updateItemAt(index, v)}
          />
        )
      default:
        return <span className={styles.errorText}>Unsupported</span>
    }
  }

  return (
    <div className={`${styles.listContainer} ${className}`}>
      {itemsToRender && itemsToRender.map((itemValue, index) => (
        <div key={index} className={styles.listItem}>
          {renderItem(itemValue, index)}
        </div>
      ))}
      <div className={styles.listActions}>
              <button
                type="button"
                onClick={addItem}
                className={styles.addButton}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={styles.icon}>
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (valueArray.length === 0) return
                  const next = valueArray.slice(0, -1)
                  onChange?.(next)
                }}
                className={styles.removeButton}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={styles.icon}>
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 100 2h12a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM5 8a1 1 0 011-1h8a1 1 0 011 1v7a2 2 0 01-2 2H7a2 2 0 01-2-2V8zm3 1a1 1 0 012 0v6a1 1 0 11-2 0V9zm4-1a1 1 0 00-1 1v6a1 1 0 102 0V9a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
    </div>
  )
}


