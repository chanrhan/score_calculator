'use client'

import * as React from 'react'
import type { FormulaElement } from '@/types/block-structure'
import { Formula } from './Formula'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { FunctionSquare } from 'lucide-react'
import { VARIABLE_MENU } from '@/lib/data/token-menus'
import { usePipelineVariables } from '@/store/usePipelineVariables'
import { extractHashPatternContents } from '@/lib/utils/stringPattern'
import styles from './FormulaModal.module.css'

interface FormulaModalProps {
  element: FormulaElement
  onChange?: (value: string) => void
  className?: string
  varScope?: '0' | '1'
}

export const FormulaModal: React.FC<FormulaModalProps> = ({ 
  element, 
  onChange, 
  className = '',
  varScope
}) => {
  const { value, optional, visible } = element
  const var_use = (element as any).var_use ?? true
  const [open, setOpen] = React.useState(false)
  const { variablesByName } = usePipelineVariables()

  if (optional && !visible) {
    return null
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

  // 수식 미리보기 텍스트 생성 (변수명을 라벨로 변환)
  const getPreviewText = (): string => {
    if (!value || String(value).trim() === '') {
      return '수식 편집'
    }
    
    let formula = String(value).trim()
    
    // #{변수명} 패턴을 찾아서 라벨로 치환
    const variableNames = extractHashPatternContents(formula)
    variableNames.forEach(varName => {
      const label = getVariableLabel(varName)
      // #{변수명}을 라벨로 치환
      formula = formula.replace(`#{${varName}}`, label)
    })
    
    if (formula.length > 30) {
      return `${formula.substring(0, 30)}...`
    }
    return formula
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
          }}
          className={styles.formulaButton}
        >
          <FunctionSquare className={styles.buttonIcon} />
          <span className={styles.buttonText}>{getPreviewText()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={styles.popoverContent}
        side="bottom"
        align="start"
        sideOffset={8}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <div className={styles.popoverHeader}>
          <span className={styles.popoverTitle}>수식 편집</span>
        </div>
        <div className={styles.formulaContainer}>
          <Formula
            element={element}
            onChange={(newValue) => {
              onChange?.(newValue)
            }}
            varScope={varScope}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

