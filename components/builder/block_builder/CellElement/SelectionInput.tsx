'use client'

import * as React from 'react'
import type { SelectionInputElement } from '@/types/block-structure'
import type { TokenMenuItem } from '@/types/block-data'
import styles from './SelectionInput.module.css'
import { usePipelineVariables } from '@/store/usePipelineVariables'
import { getTokenMenu } from '@/lib/data/token-menus'

interface SelectionInputProps {
  element: SelectionInputElement
  onChange?: (value: string) => void
  className?: string
}

export const SelectionInput: React.FC<SelectionInputProps> = ({ element, onChange, className = '' }) => {
  const { menu_key, value, optional, visible } = element
  const [menuItems, setMenuItems] = React.useState<any[]>([])

  const { variablesByName, currentKey, create } = usePipelineVariables()

  // 상수 파일에서 token_menu 데이터 가져오기
  React.useEffect(() => {
    const tokenMenu = getTokenMenu(menu_key)
    const baseItems: TokenMenuItem[] = tokenMenu ? (tokenMenu.items || []) : []

    // var_use: 파이프라인 변수 병합
    let merged: TokenMenuItem[] = baseItems
    const nextOrderStart = (baseItems[baseItems.length - 1]?.order ?? 0) + 1
    const vars: TokenMenuItem[] = Array.from(variablesByName.values()).map((v, idx) => ({ id: -1000 - idx, order: nextOrderStart + idx, value: v.variable_name, label: v.variable_name, created_at: undefined, updated_at: undefined })) as any
    merged = [...baseItems, ...vars]

    // var_store: 하단에 "변수 추가" 액션 추가
    const order = (merged[merged.length - 1]?.order ?? 0) + 1
    merged = [...merged, { id: -1, order, value: '__add_variable__', label: '+ 새 변수 추가' } as any]

    setMenuItems(merged)
  }, [menu_key, variablesByName])


  if (optional && !visible) {
    return null
  }

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value
    if (!selectedValue) return
    // 토큰 메뉴에서 선택 시, #{메뉴명} 형식으로 입력
    onChange?.(`#{${selectedValue}}`)
  }

  return (
    <div className={`${styles.container} ${className}`}>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        className={styles.input}
        placeholder="입력 또는 선택..."
      />
      <select className={styles.select} value="" onChange={handleSelect}>
        <option value="">선택</option>
        {menuItems.map((item) => (
          <option key={item.id} value={item.value}>{item.label}</option>
        ))}
      </select>
    </div>
  )
}


