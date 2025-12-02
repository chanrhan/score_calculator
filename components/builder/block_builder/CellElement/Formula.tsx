'use client'

import * as React from 'react'
import type { FormulaElement } from '@/types/block-structure'
import type { TokenMenu, TokenMenuItem } from '@/types/block-data'
import styles from './Formula.module.css'
import { usePipelineVariables } from '@/store/usePipelineVariables'
import { Textarea } from '@/components/ui/textarea'

interface FormulaProps {
  element: FormulaElement
  onChange?: (value: string) => void
  className?: string
  tokenMenus?: TokenMenu[]
}

export const Formula: React.FC<FormulaProps> = ({ element, onChange, className = '', tokenMenus = [] }) => {
  const { menu_key, value, optional, visible } = element
  const [menuItems, setMenuItems] = React.useState<any[]>([])
  const { variablesByName, currentKey, create } = usePipelineVariables()


  // tokenMenus가 전달된 경우 우선 사용, 없으면 API 호출
  React.useEffect(() => {

    if (tokenMenus.length > 0) {
      // 전달받은 tokenMenus에서 해당 menu_key 찾기
      const tokenMenu = tokenMenus.find(tm => tm.key === menu_key)
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
      // setLoading(false)
      return
    }
  }, [menu_key, tokenMenus, variablesByName])

  if (optional && !visible) {
    return null
  }

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value
    if (!selectedValue) return
    // 토큰 메뉴에서 선택 시, #{메뉴명} 형식으로 입력
    onChange?.(`${value}#{${selectedValue}}`)
  }

  return (
    <div className={`${styles.container} ${className}`}>
      <Textarea
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


