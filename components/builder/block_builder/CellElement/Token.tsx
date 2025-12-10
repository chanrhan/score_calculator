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
import { getAttributesByScope } from '@/lib/utils/scope-attributes'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { X, ChevronDown } from 'lucide-react'

interface TokenProps {
  element: TokenElement
  onChange?: (value: string) => void
  className?: string
  autoFit?: boolean // 자동 크기 조정 옵션
  varScope?: '0' | '1' // 블록 헤더의 var_scope 값 ('0': 과목, '1': 학생)
}

// 토큰 색상 통일 (모든 토큰 동일한 색상)
const getTagColor = (label: string): { bg: string; text: string; border: string } => {
  // 배경: 옅은 회색, 테두리: 옅은 회색, 글자: 검은색
  return {
    bg: 'rgba(156, 163, 175, 0.1)', // 옅은 회색 배경
    text: 'rgb(0, 0, 0)', // 검은색 글자
    border: 'rgba(156, 163, 175, 0.3)', // 옅은 회색 테두리
  }
}

export const Token: React.FC<TokenProps> = ({ element, onChange, className = '', autoFit = true, varScope }) => {
  const { menu_key, value, optional, visible, var_use, var_store } = element
  const { variablesByName, currentKey, create } = usePipelineVariables()
  const { selectedUnivId } = useUniversity()
  const { getDynamicTokenMenu, loadDynamicTokenMenu } = useBlockDataStore()
  const [menuItems, setMenuItems] = React.useState<any[]>([])
  const [open, setOpen] = React.useState(false)
  const [newVarName, setNewVarName] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [popoverOpen, setPopoverOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  
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
          scope: item.scope ?? 2, // scope 속성 포함 (기본값 2: 상관없음)
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
            scope: item.scope ?? 2, // scope 속성 포함 (기본값 2: 상관없음)
          }))
        }
      }

      // scope 필터링 적용: 각 항목의 scope 속성에 따라 필터링
      // scope: 0=과목, 1=학생, 2=상관없음(항상 보임), undefined=상관없음(기본값)
      let filteredItems: TokenMenuItem[] = baseItems
      if (varScope !== undefined) {
        filteredItems = baseItems.filter(item => {
          const itemScope = item.scope ?? 2 // 기본값은 2 (상관없음)
          // scope가 2이면 항상 보임
          if (itemScope === 2) return true
          // varScope와 itemScope가 일치하면 보임
          // varScope '0'=과목, '1'=학생
          return String(itemScope) === varScope
        })
      }

      // var_use: 파이프라인 변수 병합
      let merged: TokenMenuItem[] = filteredItems
      if (var_use) {
        const nextOrderStart = filteredItems.length + 1
        // scope 필터링 적용 (varScope가 있을 때)
        // pipeline variable의 scope: '0'=과목, '1'=학생
        let varsToInclude = Array.from(variablesByName.values())
        if (varScope !== undefined) {
          varsToInclude = varsToInclude.filter(v => {
            const vScope = (v as any).scope || '0'
            return vScope === varScope
          })
        }
        const vars: TokenMenuItem[] = varsToInclude.map((v, idx) => ({ 
          id: -1000 - idx, 
          order: nextOrderStart + idx, 
          value: v.variable_name, 
          label: v.variable_name, 
          scope: (v as any).scope === '0' ? 0 : (v as any).scope === '1' ? 1 : 2, // pipeline variable scope를 token menu scope로 변환
          created_at: undefined, 
          updated_at: undefined 
        })) as any
        merged = [...filteredItems, ...vars]
      }

      // var_store: 하단에 "변수 추가" 액션 추가
      if (var_store) {
        const order = merged.length + 1
        merged = [...merged, { id: -1, order, value: '__add_variable__', label: '+ 새 변수 추가' } as any]
      }

      setMenuItems(merged)
    }

    loadMenuItems()
  }, [menu_key, selectedUnivId, variablesByName, var_use, var_store, varScope])

  // 검색 필터링된 메뉴 아이템
  const filteredMenuItems = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return menuItems
    }
    const query = searchQuery.toLowerCase()
    return menuItems.filter(item => 
      item.label?.toLowerCase().includes(query) || 
      item.value?.toLowerCase().includes(query)
    )
  }, [menuItems, searchQuery])

  // 선택된 항목 정보
  const selectedItem = React.useMemo(() => {
    return menuItems.find(item => item.value === value)
  }, [menuItems, value])
  
  if (optional && !visible) {
    return null
  }
  
  const onSelectChange = async (v: string) => {
    if (v === '__add_variable__') {
      setNewVarName('')
      setError(null)
      setOpen(true)
      setPopoverOpen(false)
      return
    }
    onChange?.(v)
    setPopoverOpen(false)
    setSearchQuery('')
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.('')
  }

  const onSaveVar = async () => {
    if (!currentKey?.univId || !currentKey?.pipelineId) return
    const name = newVarName.trim()
    if (!name) { setError('변수명을 입력하세요'); return }
    setSaving(true)
    setError(null)
    // varScope가 있으면 해당 scope로 저장, 없으면 기본값 '0'
    const scope = varScope || '0'
    const res = await (create as any)(currentKey.univId, currentKey.pipelineId, name, scope)
    setSaving(false)
    if (!res.success) { setError(res.error || '저장 실패'); return }
    setOpen(false)
  }

  const selectedItemColor = selectedItem ? getTagColor(selectedItem.label) : null

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <div className={`${styles.tokenContainer} ${className} ${popoverOpen ? styles.popoverOpen : ''}`}>
            {selectedItem ? (
              <div
                className={styles.selectedTag}
                style={{
                  backgroundColor: selectedItemColor?.bg,
                  color: selectedItemColor?.text,
                  borderColor: selectedItemColor?.border,
                }}
              >
                <span className={styles.tagLabel}>{selectedItem.label}</span>
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={handleRemove}
                  aria-label="제거"
                >
                  <X className={styles.removeIcon} />
                </button>
              </div>
            ) : (
              <div className={styles.placeholder}>
                <span>선택하세요</span>
                <ChevronDown className={styles.chevronIcon} />
              </div>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className={styles.popoverContent} align="start">
          <div className={styles.dropdownHeader}>
            <span className={styles.headerText}>옵션 선택 또는 생성</span>
          </div>
          <div className={styles.searchContainer}>
            <Input
              placeholder="검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              autoFocus
            />
          </div>
          <div className={styles.optionsList}>
            {filteredMenuItems.length === 0 ? (
              <div className={styles.emptyState}>검색 결과가 없습니다</div>
            ) : (
              filteredMenuItems.map((item) => {
                const itemColor = getTagColor(item.label)
                const isSelected = item.value === value
                
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles.optionTag} ${isSelected ? styles.optionTagSelected : ''}`}
                    style={{
                      backgroundColor: itemColor.bg,
                      color: itemColor.text,
                      borderColor: itemColor.border,
                    }}
                    onClick={() => onSelectChange(item.value)}
                  >
                    <span className={styles.optionLabel}>{item.label}</span>
                  </button>
                )
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

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