'use client'

import * as React from 'react'
import type { FormulaElement } from '@/types/block-structure'
import type { TokenMenuItem } from '@/types/block-data'
import styles from './Formula.module.css'
import { Textarea } from '@/components/ui/textarea'
import { VARIABLE_MENU } from '@/lib/data/token-menus'
import { usePipelineVariables } from '@/store/usePipelineVariables'
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
import { ChevronDown, Plus } from 'lucide-react'

interface FormulaProps {
  element: FormulaElement
  onChange?: (value: string) => void
  className?: string
}

export const Formula: React.FC<FormulaProps> = ({ element, onChange, className = '' }) => {
  const { menu_key, value, optional, visible, var_use = true, var_store = true } = element
  const [baseItems, setBaseItems] = React.useState<TokenMenuItem[]>([])
  const [variableItems, setVariableItems] = React.useState<TokenMenuItem[]>([])
  const [open, setOpen] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [newVarName, setNewVarName] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const { variablesByName, currentKey, create } = usePipelineVariables()

  // 상수 파일에서 token_menu 데이터 가져오기
  React.useEffect(() => {
    // Formula 블록에서는 항상 VARIABLE_MENU를 기본으로 사용
    const variableMenu = VARIABLE_MENU
    const base: TokenMenuItem[] = variableMenu 
      ? (variableMenu.items || []).map((item, idx) => ({
          id: idx + 1,
          order: idx + 1,
          label: item.label,
          value: item.value,
        }))
      : []
    setBaseItems(base)

    // var_use: 파이프라인 변수 병합
    let merged: TokenMenuItem[] = base
    if (var_use) {
      const nextOrderStart = base.length + 1
      const vars: TokenMenuItem[] = Array.from(variablesByName.values()).map((v, idx) => ({ 
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
  }, [menu_key, variablesByName, var_use, var_store])

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
    // 토큰 메뉴에서 선택 시, #{메뉴명} 형식으로 입력
    onChange?.(`${value || ''}#{${selectedValue}}`)
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
    const res = await create(currentKey.univId, currentKey.pipelineId, name)
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

  // 텍스트에서 #{변수} 형식을 label로 변환
  const renderFormattedText = (text: string): React.ReactNode => {
    if (!text) return ''
    
    const parts: React.ReactNode[] = []
    const regex = /#\{([^}]+)\}/g
    let lastIndex = 0
    let match
    let keyCounter = 0
    
    while ((match = regex.exec(text)) !== null) {
      // 변수 이전의 일반 텍스트
      if (match.index > lastIndex) {
        parts.push(<span key={`text-${keyCounter++}`}>{text.substring(lastIndex, match.index)}</span>)
      }
      
      // 변수 부분 - 라벨명만 표시
      const varValue = match[1]
      const varLabel = getVariableLabel(varValue)
      // 원본 #{value} 길이만큼 공백을 추가하여 커서 위치 맞춤
      const originalLength = match[0].length // #{value} 길이
      const labelLength = varLabel.length
      const paddingLength = Math.max(0, originalLength - labelLength)
      const padding = paddingLength > 0 ? '\u00A0'.repeat(paddingLength) : ''
      
      parts.push(
        <span key={`var-${keyCounter++}`} className={styles.variableInText}>
          {varLabel}{padding}
        </span>
      )
      
      lastIndex = regex.lastIndex
    }
    
    // 마지막 남은 텍스트
    if (lastIndex < text.length) {
      parts.push(<span key={`text-${keyCounter++}`}>{text.substring(lastIndex)}</span>)
    }
    
    return parts.length > 0 ? parts : text
  }

  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const overlayRef = React.useRef<HTMLDivElement>(null)

  // Textarea와 오버레이의 스크롤 동기화
  React.useEffect(() => {
    const textarea = textareaRef.current
    const overlay = overlayRef.current
    if (!textarea || !overlay) return

    const syncScroll = () => {
      overlay.scrollTop = textarea.scrollTop
      overlay.scrollLeft = textarea.scrollLeft
    }

    textarea.addEventListener('scroll', syncScroll)
    // 초기 스크롤 위치 동기화
    syncScroll()
    
    return () => textarea.removeEventListener('scroll', syncScroll)
  }, [value])

  return (
    <>
      <div className={`${styles.container} ${className}`}>
        <div className={styles.textareaWrapper}>
          <Textarea
            ref={textareaRef}
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            className={styles.input}
            placeholder="수식을 입력하세요..."
          />
          <div 
            ref={overlayRef}
            className={styles.textareaOverlay}
          >
            {value ? renderFormattedText(value) : <span className={styles.placeholder}>수식을 입력하세요...</span>}
          </div>
        </div>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <button className={styles.variableButton} type="button">
              <span className={styles.variableButtonText}>변수</span>
              <ChevronDown className={styles.variableButtonIcon} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={styles.dropdownContent}>
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


