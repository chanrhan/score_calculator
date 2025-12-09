'use client'

import * as React from 'react'
import type { FormulaElement } from '@/types/block-structure'
import type { TokenMenuItem } from '@/types/block-data'
import styles from './Formula.module.css'
import { VARIABLE_MENU } from '@/lib/data/token-menus'
import { usePipelineVariables } from '@/store/usePipelineVariables'
import { FormulaInput, type FormulaInputRef } from './FormulaInput'
import { getAttributesByScope } from '@/lib/utils/scope-attributes'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronDown, Plus, Hash, RotateCcw } from 'lucide-react'

interface FormulaProps {
  element: FormulaElement
  onChange?: (value: string) => void
  className?: string
  varScope?: '0' | '1' // 블록 헤더의 var_scope 값 ('0': 학생, '1': 과목)
}

export const Formula: React.FC<FormulaProps> = ({ element, onChange, className = '', varScope }) => {
  const { menu_key, value, optional, visible } = element
  const var_use = (element as any).var_use ?? true
  const var_store = (element as any).var_store ?? true
  const [baseItems, setBaseItems] = React.useState<TokenMenuItem[]>([])
  const [variableItems, setVariableItems] = React.useState<TokenMenuItem[]>([])
  const [open, setOpen] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [newVarName, setNewVarName] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const { variablesByName, currentKey, create } = usePipelineVariables()
  const formulaInputRef = React.useRef<FormulaInputRef>(null)

  // 상수 파일에서 token_menu 데이터 가져오기
  React.useEffect(() => {
    // Formula 블록에서는 항상 VARIABLE_MENU를 기본으로 사용
    const variableMenu = VARIABLE_MENU
    let base: TokenMenuItem[] = variableMenu 
      ? (variableMenu.items || []).map((item, idx) => ({
          id: idx + 1,
          order: idx + 1,
          label: item.label,
          value: item.value,
          scope: item.scope ?? 2, // scope 속성 포함 (기본값 2: 상관없음)
        }))
      : []
    
    // scope 필터링 적용: 각 항목의 scope 속성에 따라 필터링
    // scope: 0=과목, 1=학생, 2=상관없음(항상 보임), undefined=상관없음(기본값)
    if (varScope !== undefined) {
      base = base.filter(item => {
        const itemScope = item.scope ?? 2 // 기본값은 2 (상관없음)
        // scope가 2이면 항상 보임
        if (itemScope === 2) return true
        // varScope와 itemScope가 일치하면 보임
        // varScope '0'=과목, '1'=학생
        return String(itemScope) === varScope
      })
    }
    
    setBaseItems(base)

    // var_use: 파이프라인 변수 병합
    let merged: TokenMenuItem[] = base
    if (var_use) {
      const nextOrderStart = base.length + 1
      // scope 필터링 적용 (varScope가 있을 때)
      let varsToInclude = Array.from(variablesByName.values())
      if (varScope !== undefined) {
        varsToInclude = varsToInclude.filter(v => (v as any).scope === varScope)
      }
      const vars: TokenMenuItem[] = varsToInclude.map((v, idx) => ({ 
        id: -1000 - idx, 
        order: nextOrderStart + idx, 
        value: v.variable_name, 
        label: v.variable_name, 
        created_at: undefined, 
        updated_at: undefined 
      })) as any
      merged = [...base, ...vars]
    }

    // var_store: 하단에 "변수 추가" 액션 추가
    if (var_store) {
      const order = merged.length + 1
      merged = [...merged, { id: -1, order, value: '__add_variable__', label: '+ 새 변수 추가' } as any]
    }

    setVariableItems(merged)
  }, [menu_key, variablesByName, var_use, var_store, varScope])

  if (optional && !visible) {
    return null
  }

  const handleSelect = (selectedValue: string) => {
    if (!selectedValue) return
    if (selectedValue === '__add_variable__') {
      setNewVarName('')
      setError(null)
      setOpen(false)
      setDialogOpen(true)
      return
    }
    // FormulaInput에 변수 삽입
    formulaInputRef.current?.insertVariable(selectedValue)
    setOpen(false)
  }

  const handleSaveVar = async () => {
    if (!currentKey?.univId || !currentKey?.pipelineId) return
    const name = newVarName.trim()
    if (!name) { 
      setError('변수명을 입력하세요')
      return 
    }
    setSaving(true)
    setError(null)
    // varScope가 있으면 해당 scope로 저장, 없으면 기본값 '0'
    const scope = varScope || '0'
    const res = await (create as any)(currentKey.univId, currentKey.pipelineId, name, scope)
    setSaving(false)
    if (!res.success) { 
      setError(res.error || '저장 실패')
      return 
    }
    setDialogOpen(false)
    setNewVarName('')
  }

  // 변수 value를 label로 변환하는 함수
  const getVariableLabel = (varValue: string): string => {
    // VARIABLE_MENU에서 찾기
    const variableMenu = VARIABLE_MENU
    const menuItem = variableMenu?.items?.find(item => item.value === varValue)
    if (menuItem) {
      return menuItem.label
    }
    
    // 파이프라인 변수에서 찾기
    if (var_use) {
      const pipelineVar = Array.from(variablesByName.values()).find(v => v.variable_name === varValue)
      if (pipelineVar) {
        return pipelineVar.variable_name
      }
    }
    
    // 찾지 못하면 원본 반환
    return varValue
  }

  // 수식 초기화 핸들러
  const handleReset = () => {
    if (onChange) {
      onChange('')
    }
  }


  return (
    <>
      <div className={`${styles.container} ${className}`}>
        {/* 툴바 */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarGroup}>
            <DropdownMenu open={open} onOpenChange={setOpen}>
              <DropdownMenuTrigger asChild>
                <button className={styles.toolbarButton} type="button" title="변수 선택">
                  <Hash className={styles.toolbarButtonIcon} />
                </button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className={styles.dropdownContent}>
              {baseItems.length > 0 && (
                <>
                  {baseItems.map((item, idx) => (
                    <DropdownMenuItem
                      key={`base-${idx}`}
                      onClick={() => handleSelect(item.value)}
                      className={styles.dropdownItem}
                    >
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                  {var_use && variablesByName.size > 0 && <DropdownMenuSeparator />}
                </>
              )}
              {var_use && Array.from(variablesByName.values()).map((v, idx) => (
                <DropdownMenuItem
                  key={`var-${idx}`}
                  onClick={() => handleSelect(v.variable_name)}
                  className={styles.dropdownItem}
                >
                  <span className={styles.variableToken}>{v.variable_name}</span>
                </DropdownMenuItem>
              ))}
              {var_store && (
                <>
                  {(baseItems.length > 0 || (var_use && variablesByName.size > 0)) && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={() => handleSelect('__add_variable__')}
                    className={styles.dropdownItemAdd}
                  >
                    <Plus className={styles.addIcon} />
                    새 변수 추가
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
            </DropdownMenu>
            <button
              className={styles.toolbarButton}
              type="button"
              onClick={handleReset}
              title="수식 초기화"
            >
              <RotateCcw className={styles.toolbarButtonIcon} />
            </button>
          </div>
        </div>
        {/* 입력 영역 */}
        <FormulaInput
          ref={formulaInputRef}
          value={value || ''}
          onChange={onChange}
          placeholder="수식을 입력하세요..."
          className={styles.formulaInputWrapper}
          getVariableLabel={getVariableLabel}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>변수 추가</DialogTitle>
          </DialogHeader>
          <div className={styles.dialogContent}>
            <Input 
              placeholder="변수명" 
              value={newVarName} 
              onChange={(e) => setNewVarName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !saving) {
                  handleSaveVar()
                }
              }}
            />
            {error && <p className={styles.errorText}>{error}</p>}
          </div>
          <DialogFooter>
            <Button 
              variant="secondary" 
              onClick={() => {
                setDialogOpen(false)
                setNewVarName('')
                setError(null)
              }} 
              disabled={saving}
            >
              취소
            </Button>
            <Button 
              onClick={handleSaveVar} 
              disabled={saving || !newVarName.trim()}
            >
              {saving ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}


