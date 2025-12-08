'use client'

import * as React from 'react'
import { TokenElement } from '@/types/block-structure'
import { useUniversity } from '@/store/useUniversity'
import type { TokenMenuItem } from '@/types/block-data'
import styles from './Token.module.css'
import { usePipelineVariables } from '@/store/usePipelineVariables'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getTokenMenu } from '@/lib/data/token-menus'
import { useBlockDataStore } from '@/store/useBlockDataStore'

interface TokenProps {
  element: TokenElement
  onChange?: (value: string) => void
  className?: string
  autoFit?: boolean // 자동 크기 조정 옵션
}

export const Token: React.FC<TokenProps> = ({ element, onChange, className = '', autoFit = true }) => {
  const { menu_key, value, optional, visible, var_use, var_store } = element
  const { variablesByName, currentKey, create } = usePipelineVariables()
  const { selectedUnivId } = useUniversity()
  const { getDynamicTokenMenu, loadDynamicTokenMenu } = useBlockDataStore()
  const [menuItems, setMenuItems] = React.useState<any[]>([])
  const [selectWidth, setSelectWidth] = React.useState<number | undefined>(undefined)
  const [open, setOpen] = React.useState(false)
  const [newVarName, setNewVarName] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  
  // 상수 파일에서 token_menu 데이터 가져오기, 없으면 스토어 캐시 또는 API에서 동적으로 로드
  React.useEffect(() => {
    const loadMenuItems = async () => {
      // 먼저 상수 파일에서 확인
      const tokenMenu = getTokenMenu(menu_key)
      let baseItems: TokenMenuItem[] = []
      
      if (tokenMenu) {
        // 상수 파일에 있으면 사용
        baseItems = (tokenMenu.items || []).map((item, idx) => ({
          id: idx + 1,
          order: idx + 1,
          label: item.label,
          value: item.value,
        }))
      } else if (selectedUnivId && menu_key) {
        // 상수 파일에 없으면 스토어 캐시에서 확인
        let dynamicMenu = getDynamicTokenMenu(selectedUnivId, menu_key)
        
        // 캐시에 없으면 API에서 로드 (스토어에 캐싱됨)
        if (!dynamicMenu) {
          dynamicMenu = await loadDynamicTokenMenu(selectedUnivId, menu_key) || undefined
        }
        
        if (dynamicMenu) {
          baseItems = (dynamicMenu.items || []).map((item: any, idx: number) => ({
            id: item.id || idx + 1,
            order: item.order || idx + 1,
            label: item.label,
            value: item.value,
          }))
        }
      }

      // var_use: 파이프라인 변수 병합
      let merged: TokenMenuItem[] = baseItems
      if (var_use) {
        const nextOrderStart = baseItems.length + 1
        const vars: TokenMenuItem[] = Array.from(variablesByName.values()).map((v, idx) => ({ 
          id: -1000 - idx, 
          order: nextOrderStart + idx, 
          value: v.variable_name, 
          label: v.variable_name, 
          created_at: undefined, 
          updated_at: undefined 
        })) as any
        merged = [...baseItems, ...vars]
      }

      // var_store: 하단에 "변수 추가" 액션 추가
      if (var_store) {
        const order = merged.length + 1
        merged = [...merged, { id: -1, order, value: '__add_variable__', label: '+ 새 변수 추가' } as any]
      }

      setMenuItems(merged)
    }

    loadMenuItems()
  }, [menu_key, selectedUnivId, variablesByName, var_use, var_store])

  // 선택된 값에 따른 동적 크기 계산
  React.useEffect(() => {
    if (!autoFit || !value) {
      setSelectWidth(undefined)
      return
    }

    // 선택된 항목의 텍스트 길이 계산
    const selectedItem = menuItems.find(item => item.value === value)
    if (selectedItem) {
      const textLength = selectedItem.label?.length || 0
      // 텍스트 길이에 따른 최소 너비 계산 (한글 기준 약 14px per character)
      const minWidth = Math.max(80, textLength * 14 + 40) // 최소 80px, 패딩 고려
      setSelectWidth(minWidth)
    }
  }, [value, menuItems, autoFit])
  
  if (optional && !visible) {
    return null
  }
  
  const onSelectChange = async (v: string) => {
    if (v === '__add_variable__') {
      setNewVarName('')
      setError(null)
      setOpen(true)
      return
    }
    onChange?.(v)
  }

  const onSaveVar = async () => {
    if (!currentKey?.univId || !currentKey?.pipelineId) return
    const name = newVarName.trim()
    if (!name) { setError('변수명을 입력하세요'); return }
    setSaving(true)
    setError(null)
    const res = await create(currentKey.univId, currentKey.pipelineId, name)
    setSaving(false)
    if (!res.success) { setError(res.error || '저장 실패'); return }
    setOpen(false)
  }

  return (
    <>
      <select
        value={value || ''}
        onChange={(e) => onSelectChange(e.target.value)}
        className={`${styles.select} ${className}`}
        style={autoFit && selectWidth ? { width: `${selectWidth}px` } : {}}
      >
        {!value && <option value="">선택하세요</option>}
        {menuItems.map((item) => (
          <option key={item.id} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>변수 추가</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Input placeholder="변수명" value={newVarName} onChange={(e) => setNewVarName(e.target.value)} />
            {error ? <p className="text-red-500 text-sm">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>취소</Button>
            <Button onClick={onSaveVar} disabled={saving}>{saving ? '저장 중...' : '저장'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}