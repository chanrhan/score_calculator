'use client'

import * as React from 'react'
import styles from './Formula.module.css'

interface FormulaInputProps {
  value: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  getVariableLabel: (varValue: string) => string
}

export interface FormulaInputRef {
  insertVariable: (varValue: string) => void
}

export const FormulaInput = React.forwardRef<FormulaInputRef, FormulaInputProps>(({
  value,
  onChange,
  placeholder = '수식을 입력하세요...',
  className = '',
  getVariableLabel,
}, ref) => {
  const editorRef = React.useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = React.useState(false)
  const [isEmpty, setIsEmpty] = React.useState(true)

  // 빈 상태 확인
  const checkEmpty = React.useCallback(() => {
    if (!editorRef.current) return
    
    const textContent = editorRef.current.textContent?.trim() || ''
    const isEmptyState = textContent === ''
    setIsEmpty(isEmptyState)
  }, [])

  // 텍스트 값을 HTML로 변환 (#{value} -> span)
  const valueToHtml = React.useCallback((text: string): string => {
    if (!text) return ''
    
    const regex = /#\{([^}]+)\}/g
    let html = ''
    let lastIndex = 0
    let match
    
    while ((match = regex.exec(text)) !== null) {
      // 변수 이전의 일반 텍스트
      if (match.index > lastIndex) {
        const textPart = text.substring(lastIndex, match.index)
        html += escapeHtml(textPart)
      }
      
      // 변수 부분
      const varValue = match[1]
      const varLabel = getVariableLabel(varValue)
      html += `<span data-variable="${escapeHtml(varValue)}" contenteditable="false" class="${styles.variableInText}">${escapeHtml(varLabel)}</span>`
      
      lastIndex = regex.lastIndex
    }
    
    // 마지막 남은 텍스트
    if (lastIndex < text.length) {
      html += escapeHtml(text.substring(lastIndex))
    }
    
    return html || escapeHtml(text)
  }, [getVariableLabel])

  // HTML을 텍스트 값으로 변환 (span -> #{value})
  const htmlToValue = React.useCallback((html: string): string => {
    if (!html) return ''
    
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    
    let result = ''
    const walker = document.createTreeWalker(
      tempDiv,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          // 변수 span의 자식 노드는 건너뛰기 (중복 방지)
          if (node.nodeType === Node.TEXT_NODE) {
            const parent = node.parentElement
            if (parent && parent.hasAttribute('data-variable')) {
              return NodeFilter.FILTER_REJECT
            }
          }
          return NodeFilter.FILTER_ACCEPT
        }
      }
    )
    
    let node: Node | null
    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement
        if (element.hasAttribute('data-variable')) {
          const varValue = element.getAttribute('data-variable') || ''
          result += `#{${varValue}}`
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent || ''
      }
    }
    
    return result
  }, [])

  // HTML 이스케이프
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  // 커서 위치 저장 (Range 객체로 저장)
  const saveSelection = React.useCallback((containerEl: HTMLElement): Range | null => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return null
    
    const range = selection.getRangeAt(0)
    
    // 컨테이너 내부의 범위인지 확인
    if (!containerEl.contains(range.startContainer) || !containerEl.contains(range.endContainer)) {
      return null
    }
    
    return range.cloneRange()
  }, [])

  // 커서 위치 복원
  const restoreSelection = React.useCallback((containerEl: HTMLElement, savedRange: Range) => {
    const selection = window.getSelection()
    if (!selection) return
    
    try {
      // 저장된 범위가 여전히 유효한지 확인
      if (containerEl.contains(savedRange.startContainer) && containerEl.contains(savedRange.endContainer)) {
        selection.removeAllRanges()
        selection.addRange(savedRange)
        return
      }
    } catch (e) {
      // 범위가 유효하지 않으면 무시
    }
    
    // 범위가 유효하지 않으면 끝에 커서 배치
    const range = document.createRange()
    range.selectNodeContents(containerEl)
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
  }, [])

  // value가 변경되면 HTML 업데이트 (외부에서 value 변경된 경우만)
  React.useEffect(() => {
    if (!editorRef.current) return
    
    // 현재 HTML에서 추출한 값과 prop value 비교
    const currentValue = htmlToValue(editorRef.current.innerHTML)
    
    // 값이 다르면 업데이트 (사용자가 직접 입력한 경우는 제외)
    if (currentValue !== value) {
      const selection = window.getSelection()
      const isFocused = editorRef.current === document.activeElement
      let savedRange: Range | null = null
      
      if (isFocused && selection && selection.rangeCount > 0) {
        savedRange = saveSelection(editorRef.current)
      }
      
      const newHtml = valueToHtml(value)
      // 빈 상태일 때는 <br>을 추가하여 placeholder가 표시되도록 함
      editorRef.current.innerHTML = newHtml || '<br>'
      
      checkEmpty()
      
      if (savedRange && isFocused && editorRef.current) {
        // 다음 프레임에서 복원 (DOM 업데이트 후)
        requestAnimationFrame(() => {
          if (editorRef.current) {
            restoreSelection(editorRef.current, savedRange!)
          }
        })
      }
    }
  }, [value, valueToHtml, htmlToValue, saveSelection, restoreSelection, checkEmpty])

  // 값 업데이트
  const updateValue = React.useCallback(() => {
    if (!editorRef.current) return
    
    const html = editorRef.current.innerHTML
    const newValue = htmlToValue(html)
    onChange?.(newValue)
  }, [htmlToValue, onChange])

  // 변수 삽입
  const insertVariable = React.useCallback((varValue: string) => {
    if (!editorRef.current) return
    
    const selection = window.getSelection()
    if (!selection) return
    
    if (selection.rangeCount === 0) {
      // 선택이 없으면 끝에 삽입
      const range = document.createRange()
      range.selectNodeContents(editorRef.current)
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)
    }
    
    if (selection.rangeCount === 0) return
    
    const range = selection.getRangeAt(0)
    
    // 빈 <br> 태그 제거
    if (range.startContainer === editorRef.current && editorRef.current.innerHTML === '<br>') {
      range.deleteContents()
    } else {
      range.deleteContents()
    }
    
    const varLabel = getVariableLabel(varValue)
    const span = document.createElement('span')
    span.setAttribute('data-variable', varValue)
    span.setAttribute('contenteditable', 'false')
    span.className = styles.variableInText
    span.textContent = varLabel
    
    range.insertNode(span)
    
    // 커서를 변수 뒤로 이동
    const newRange = document.createRange()
    newRange.setStartAfter(span)
    newRange.collapse(true)
    selection.removeAllRanges()
    selection.addRange(newRange)
    
    // 값 업데이트
    checkEmpty()
    updateValue()
  }, [getVariableLabel, updateValue, checkEmpty])

  // 키보드 이벤트 처리
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return
    
    const range = selection.getRangeAt(0)
    
    // 백스페이스 또는 Delete 키 처리
    if (e.key === 'Backspace' || e.key === 'Delete') {
      // 선택된 영역이 변수 span을 포함하는지 확인
      let variableSpan: HTMLElement | null = null
      
      if (!range.collapsed) {
        // 선택 영역이 있는 경우
        const commonAncestor = range.commonAncestorContainer
        if (commonAncestor.nodeType === Node.ELEMENT_NODE && (commonAncestor as HTMLElement).hasAttribute('data-variable')) {
          variableSpan = commonAncestor as HTMLElement
        } else {
          // 선택 영역 내의 변수 span 찾기
          const walker = document.createTreeWalker(
            range.commonAncestorContainer.parentElement || range.commonAncestorContainer,
            NodeFilter.SHOW_ELEMENT,
            {
              acceptNode: (node) => {
                if (range.intersectsNode(node) && (node as HTMLElement).hasAttribute('data-variable')) {
                  return NodeFilter.FILTER_ACCEPT
                }
                return NodeFilter.FILTER_REJECT
              }
            }
          )
          const firstVarNode = walker.nextNode()
          if (firstVarNode) {
            variableSpan = firstVarNode as HTMLElement
          }
        }
      } else {
        // 커서만 있는 경우
        if (e.key === 'Backspace') {
          // 백스페이스: 커서 앞의 노드 확인
          let node: Node | null = range.startContainer
          
          if (node.nodeType === Node.TEXT_NODE && range.startOffset === 0) {
            node = node.previousSibling
          }
          
          // 변수 span인지 확인
          if (node && node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).hasAttribute('data-variable')) {
            variableSpan = node as HTMLElement
          } else if (node && node.parentElement?.hasAttribute('data-variable')) {
            variableSpan = node.parentElement
          }
        } else {
          // Delete: 커서 뒤의 노드 확인
          let node: Node | null = range.endContainer
          
          if (node.nodeType === Node.TEXT_NODE && range.endOffset === (node.textContent?.length || 0)) {
            node = node.nextSibling
          }
          
          // 변수 span인지 확인
          if (node && node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).hasAttribute('data-variable')) {
            variableSpan = node as HTMLElement
          } else if (node && node.parentElement?.hasAttribute('data-variable')) {
            variableSpan = node.parentElement
          }
        }
      }
      
      if (variableSpan) {
        e.preventDefault()
        
        // 커서 위치 저장 (변수 앞)
        const newRange = document.createRange()
        if (variableSpan.previousSibling) {
          if (variableSpan.previousSibling.nodeType === Node.TEXT_NODE) {
            newRange.setStart(variableSpan.previousSibling, (variableSpan.previousSibling.textContent?.length || 0))
          } else {
            newRange.setStartAfter(variableSpan.previousSibling)
          }
        } else if (variableSpan.nextSibling) {
          newRange.setStartBefore(variableSpan.nextSibling)
        } else {
          newRange.setStart(editorRef.current!, 0)
        }
        newRange.collapse(true)
        
        variableSpan.remove()
        
        // 빈 상태가 되면 <br> 추가
        if (editorRef.current && !editorRef.current.textContent?.trim()) {
          editorRef.current.innerHTML = '<br>'
          newRange.setStart(editorRef.current, 0)
          newRange.collapse(true)
        }
        
        checkEmpty()
        updateValue()
        
        // 커서 위치 복원
        selection.removeAllRanges()
        selection.addRange(newRange)
      }
    }
    
    // Enter 키 처리 (기본 동작 유지)
    if (e.key === 'Enter') {
      // 기본 동작 허용
    }
  }, [updateValue])

  // 입력 이벤트 처리
  const handleInput = React.useCallback(() => {
    if (!editorRef.current) return
    
    // 빈 상태일 때 <br> 추가 (placeholder 표시를 위해)
    const textContent = editorRef.current.textContent?.trim() || ''
    if (textContent === '' && editorRef.current.innerHTML !== '<br>') {
      editorRef.current.innerHTML = '<br>'
    }
    
    checkEmpty()
    updateValue()
  }, [updateValue, checkEmpty])

  // 붙여넣기 이벤트 처리 (HTML 정리)
  const handlePaste = React.useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    
    if (text) {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        
        const textNode = document.createTextNode(text)
        range.insertNode(textNode)
        
        range.setStartAfter(textNode)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
        
        updateValue()
      }
    }
  }, [updateValue])

  // 포커스 이벤트
  const handleFocus = React.useCallback(() => {
    setIsFocused(true)
  }, [])

  const handleBlur = React.useCallback(() => {
    setIsFocused(false)
  }, [])

  // 외부에서 변수 삽입할 수 있도록 ref 노출
  React.useImperativeHandle(ref, () => ({
    insertVariable,
  }), [insertVariable])

  // 초기 빈 상태 확인
  React.useEffect(() => {
    checkEmpty()
  }, [checkEmpty])

  return (
    <div
      ref={editorRef}
      contentEditable
      className={`${styles.formulaInput} ${className} ${isFocused ? styles.focused : ''}`}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onFocus={handleFocus}
      onBlur={handleBlur}
      data-placeholder={placeholder}
      data-empty={isEmpty}
      suppressContentEditableWarning
    />
  )
})

FormulaInput.displayName = 'FormulaInput'

