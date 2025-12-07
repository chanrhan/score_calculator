'use client'

import * as React from 'react'
import { InputFieldElement } from '@/types/block-structure'
import styles from './InputField.module.css'

interface InputFieldProps {
  element: InputFieldElement
  onChange?: (value: string) => void
  className?: string
  autoFit?: boolean // 자동 크기 조정 옵션
}

export const InputField: React.FC<InputFieldProps> = ({ element, onChange, className = '', autoFit = true }) => {
  const { value, optional, visible, inputType = 'text' } = element
  const [inputWidth, setInputWidth] = React.useState<number | undefined>(undefined)
  
  if (optional && !visible) {
    return null
  }
  
  // 입력된 값에 따른 동적 크기 계산
  React.useEffect(() => {
    if (!autoFit || !value) {
      setInputWidth(undefined)
      return
    }

    // 텍스트 길이에 따른 최소 너비 계산 (한글 기준 약 14px per character)
    const textLength = value.length
    const minWidth = Math.max(80, textLength * 14 + 20) // 최소 80px, 패딩 고려
    setInputWidth(minWidth)
  }, [value, autoFit])
  
  return (
    <input
      type={inputType}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className={`${styles.input} ${className}`}
      placeholder="입력하세요..."
      style={autoFit && inputWidth ? { width: `${inputWidth}px` } : {}}
    />
  )
}