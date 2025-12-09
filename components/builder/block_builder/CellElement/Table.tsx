'use client'

import * as React from 'react'
import { TableElement } from '@/types/block-structure'
import { getTokenMenu } from '@/lib/data/token-menus'
import { parseRangeToDisplay, formatRangeFromInput, parseRangeToInput, RangeInput } from '@/lib/utils/rangeUtils'
import styles from './Table.module.css'

interface TableProps {
  element: TableElement
  onChange?: (value: any[][]) => void
  onElementChange?: (element: Partial<TableElement>) => void
  onGetCurrentData?: () => any[][] // 현재 tableData를 가져오는 함수
  className?: string
  input_prop?: string
  output_prop?: string
}

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  type: 'row' | 'column' | null
  index: number | null
}

export const Table = React.forwardRef<{ getCurrentTableData: () => any[][] }, TableProps>(({ element, onChange, onElementChange, onGetCurrentData, className = '', input_prop, output_prop }, ref) => {
  const { value, init_rows, init_cols, input_type, output_type, optional, visible, input_option, range: rangeProp } = element
  
  // 체크박스용 고유 ID 생성
  const checkboxId = React.useId()
  
  // range 값을 로컬 state로 관리하여 체크박스 상태를 안정적으로 유지
  const [range, setRange] = React.useState<boolean>(!!rangeProp)
  
  // element의 range 값이 변경되면 로컬 state도 업데이트
  React.useEffect(() => {
    setRange(!!rangeProp)
  }, [rangeProp])
  
  if (optional && !visible) {
    return null
  }
  
  // 테이블 값 초기화
  const initializeTableData = React.useCallback(() => {
    const hasProps = input_prop !== undefined || output_prop !== undefined
    
    if (value && Array.isArray(value) && value.length > 0 && value[0]?.length > 0) {
      // input_prop/output_prop가 있으면 저장된 데이터는 1열이 없는 상태이므로 1열을 추가
      if (hasProps) {
        // 각 행 앞에 빈 1열 추가 (표시용, label은 렌더링 시 표시)
        let processedData = value.map((row) => ['', ...row])
        // 최소 2행 보장
        while (processedData.length < 2) {
          const colCount = processedData[0]?.length || 1
          processedData.push(Array(colCount).fill(''))
        }
        return processedData
      }
      // input_prop/output_prop가 없으면 그대로 사용
      let processedData = value.map((row) => {
        if (row.length === 0) {
          return ['']
        }
        return row
      })
      // 최소 2행 보장
      while (processedData.length < 2) {
        const colCount = processedData[0]?.length || 1
        processedData.push(Array(colCount).fill(''))
      }
      return processedData
    }
    // 기본 1열 생성, 최소 2행 보장
    const defaultCols = hasProps ? Math.max(1, init_cols) : Math.max(1, init_cols)
    const defaultRows = Math.max(2, init_rows)
    return Array(defaultRows).fill(null).map(() => Array(defaultCols).fill(''))
  }, [value, init_rows, init_cols, input_prop, output_prop])

  const [tableData, setTableData] = React.useState<any[][]>(initializeTableData)
  
  // tableData의 최신 값을 ref로 관리 (모달 닫힐 때 최종 값 저장용)
  const tableDataRef = React.useRef<any[][]>(tableData)
  
  // tableData가 변경될 때마다 ref 업데이트
  React.useEffect(() => {
    tableDataRef.current = tableData
  }, [tableData])
  
  // value prop이 변경되면 업데이트
  React.useEffect(() => {
    const hasProps = input_prop !== undefined || output_prop !== undefined
    
    if (value && Array.isArray(value) && value.length > 0 && value[0]?.length > 0) {
      // input_prop/output_prop가 있으면 저장된 데이터는 1열이 없는 상태이므로 1열을 추가
      if (hasProps) {
        // 각 행 앞에 빈 1열 추가 (표시용, label은 렌더링 시 표시)
        let processedData = value.map((row) => ['', ...row])
        // 최소 2행 보장
        while (processedData.length < 2) {
          const colCount = processedData[0]?.length || 1
          processedData.push(Array(colCount).fill(''))
        }
        setTableData(processedData)
      } else {
        // input_prop/output_prop가 없으면 그대로 사용
        let processedData = value.map((row) => {
          if (row.length === 0) {
            return ['']
          }
          return row
        })
        // 최소 2행 보장
        while (processedData.length < 2) {
          const colCount = processedData[0]?.length || 1
          processedData.push(Array(colCount).fill(''))
        }
        setTableData(processedData)
      }
    }
  }, [value, input_prop, output_prop])

  // input_prop, output_prop가 변경되면 1열이 없을 경우 추가
  React.useEffect(() => {
    if ((input_prop !== undefined || output_prop !== undefined) && tableData.length > 0) {
      const needsUpdate = tableData.some(row => row.length === 0)
      if (needsUpdate) {
        const newData = tableData.map((row) => {
          if (row.length === 0) {
            return ['']
          }
          return row
        })
        setTableData(newData)
        onChange?.(newData)
      }
    }
  }, [input_prop, output_prop, tableData.length])

  // 컨텍스트 메뉴 상태
  const [contextMenu, setContextMenu] = React.useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    type: null,
    index: null
  })

  // 범위 편집 상태
  const [editingRangeCell, setEditingRangeCell] = React.useState<{ rowIndex: number; colIndex: number } | null>(null)
  const [rangeFormData, setRangeFormData] = React.useState<RangeInput>({
    start: null,
    end: null,
    includeStart: true,
    includeEnd: true
  })

  // range 속성이 true인지 확인
  const isRangeMode = range === true

  // 테이블 및 wrapper ref
  const tableRef = React.useRef<HTMLTableElement>(null)
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  
  // 각 열의 최대 텍스트 길이 계산
  const calculateColumnWidths = React.useCallback(() => {
    if (!tableData.length) {
      // 빈 테이블일 경우 기본 너비 반환
      return Array(init_cols).fill(100)
    }
    
    const columnCount = tableData[0]?.length || init_cols
    const columnWidths: number[] = []
    const hasProps = input_prop !== undefined || output_prop !== undefined
    const scoreTypeMenu = hasProps ? getTokenMenu('score_type') : null
    
    for (let colIndex = 0; colIndex < columnCount; colIndex++) {
      let maxLength = 0
      
      for (let rowIndex = 0; rowIndex < tableData.length; rowIndex++) {
        let cellValue = tableData[rowIndex]?.[colIndex] || ''
        
        // 1열이고 input_prop/output_prop가 있으면 label 값 사용
        if (colIndex === 0 && hasProps && scoreTypeMenu) {
          if (rowIndex % 2 === 0 && input_prop !== undefined) {
            const menuItem = scoreTypeMenu.items.find(item => item.value === input_prop)
            cellValue = menuItem?.label || input_prop
          } else if (rowIndex % 2 === 1 && output_prop !== undefined) {
            const menuItem = scoreTypeMenu.items.find(item => item.value === output_prop)
            cellValue = menuItem?.label || output_prop
          }
        } else if (isRangeMode && rowIndex % 2 === 0 && colIndex > 0) {
          // 범위 모드이고 입력 행이면 범위를 한글 설명으로 표시
          if (cellValue) {
            cellValue = parseRangeToDisplay(cellValue)
          }
        }
        
        // 한글/영문 구분하여 더 정확한 너비 계산
        const text = String(cellValue)
        let textWidth = 0
        for (let i = 0; i < text.length; i++) {
          const char = text[i]
          // 한글, 한자, 일본어 등은 더 넓게 계산 (약 14px)
          // 영문, 숫자, 기호는 좁게 계산 (약 8px)
          if (/[가-힣一-龯ぁ-ゟァ-ヿ]/.test(char)) {
            textWidth += 14
          } else {
            textWidth += 8
          }
        }
        maxLength = Math.max(maxLength, textWidth)
      }
      
      // 최소 너비: 1열은 80px, 나머지는 60px
      // 패딩 및 여백 고려: 좌우 각 12px씩 총 24px
      const minWidth = colIndex === 0 ? 80 : 60
      const width = Math.max(minWidth, maxLength + 24)
      columnWidths.push(width)
    }
    
    return columnWidths
  }, [tableData, init_cols, input_prop, output_prop, isRangeMode])
  
  const columnWidths = calculateColumnWidths()
  
  const handleCellChange = (rowIndex: number, colIndex: number, newValue: string) => {
    // 1열은 읽기 전용이므로 변경 불가
    if (colIndex === 0 && (input_prop !== undefined || output_prop !== undefined)) {
      return
    }
    const newData = [...tableData]
    newData[rowIndex] = [...newData[rowIndex]]
    newData[rowIndex][colIndex] = newValue
    setTableData(newData)
    notifyChange(newData)
  }

  // 범위 편집 시작
  const startRangeEdit = (rowIndex: number, colIndex: number) => {
    if (!isRangeMode) return
    
    // 입력 행(홀수 행, 0, 2, 4, ...)인지 확인
    const isInputRow = rowIndex % 2 === 0
    if (!isInputRow) return

    // 1열은 편집 불가
    if (colIndex === 0 && (input_prop !== undefined || output_prop !== undefined)) {
      return
    }

    const cellValue = tableData[rowIndex]?.[colIndex] || ''
    const parsed = parseRangeToInput(cellValue)
    setRangeFormData(parsed)
    setEditingRangeCell({ rowIndex, colIndex })
  }

  // 범위 편집 취소
  const cancelRangeEdit = () => {
    setEditingRangeCell(null)
    setRangeFormData({
      start: null,
      end: null,
      includeStart: true,
      includeEnd: true
    })
  }

  // 범위 편집 적용
  const applyRangeEdit = () => {
    if (!editingRangeCell) return

    const { rowIndex, colIndex } = editingRangeCell
    const formattedRange = formatRangeFromInput(rangeFormData)
    
    const newData = [...tableData]
    newData[rowIndex] = [...newData[rowIndex]]
    newData[rowIndex][colIndex] = formattedRange
    setTableData(newData)
    notifyChange(newData)
    
    cancelRangeEdit()
  }
  
  // onChange 호출 시 1열 제외하는 헬퍼 함수
  const notifyChange = (data: any[][]) => {
    // tableDataRef를 즉시 업데이트하여 최신 값 보장
    tableDataRef.current = data
    // input_prop/output_prop가 있으면 1열을 제외하고 저장
    const dataToSave = (input_prop !== undefined || output_prop !== undefined)
      ? data.map(row => row.slice(1)) // 1열 제외
      : data
    onChange?.(dataToSave)
  }

  // 마지막 열에 열 추가
  const addColumn = () => {
    const newData = tableData.map(row => [...row, ''])
    setTableData(newData)
    notifyChange(newData)
  }
  
  // 마지막 행에 행 추가
  const addRow = () => {
    const colCount = Math.max(1, tableData[0]?.length || init_cols)
    const newData = [...tableData, Array(colCount).fill('')]
    setTableData(newData)
    notifyChange(newData)
  }
  
  // 마지막 열 삭제
  const removeLastColumn = () => {
    const hasProps = input_prop !== undefined || output_prop !== undefined
    const totalCols = tableData[0]?.length || 0
    // 기본 1열을 제외한 열이 1개밖에 없으면 삭제 불가
    const dataCols = hasProps ? totalCols - 1 : totalCols
    if (dataCols <= 1) return
    
    const lastColIndex = tableData[0].length - 1
    const newData = tableData.map(row => row.filter((_, index) => index !== lastColIndex))
    setTableData(newData)
    notifyChange(newData)
  }
  
  // 마지막 행 삭제
  const removeLastRow = () => {
    // 최소 2행 보장
    if (tableData.length <= 2) return
    const newData = tableData.filter((_, index) => index !== tableData.length - 1)
    setTableData(newData)
    notifyChange(newData)
  }

  // Notion 스타일: 행 위에 삽입 (컨텍스트 메뉴용)
  const insertRowAbove = (rowIndex: number) => {
    const colCount = Math.max(1, tableData[0]?.length || init_cols)
    const newData = [...tableData]
    newData.splice(rowIndex, 0, Array(colCount).fill(''))
    setTableData(newData)
    notifyChange(newData)
  }

  // Notion 스타일: 열 왼쪽에 삽입 (컨텍스트 메뉴용)
  const insertColumnLeft = (colIndex: number) => {
    const newData = tableData.map(row => {
      const newRow = [...row]
      newRow.splice(colIndex, 0, '')
      return newRow
    })
    setTableData(newData)
    notifyChange(newData)
  }
  
  const removeColumn = (colIndex: number) => {
    const hasProps = input_prop !== undefined || output_prop !== undefined
    // input_prop/output_prop가 있으면 1열(인덱스 0)은 삭제 불가
    if (colIndex === 0 && hasProps) {
      return
    }
    const totalCols = tableData[0]?.length || 0
    // 기본 1열을 제외한 열이 1개밖에 없으면 삭제 불가
    const dataCols = hasProps ? totalCols - 1 : totalCols
    if (dataCols <= 1) return
    
    const newData = tableData.map(row => row.filter((_, index) => index !== colIndex))
    setTableData(newData)
    notifyChange(newData)
  }
  
  const removeRow = (rowIndex: number) => {
    // 최소 2행 보장
    if (tableData.length <= 2) return
    const newData = tableData.filter((_, index) => index !== rowIndex)
    setTableData(newData)
    notifyChange(newData)
  }

  // 컨텍스트 메뉴 핸들러
  const handleContextMenu = (e: React.MouseEvent, type: 'row' | 'column', index: number) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type,
      index
    })
  }

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, type: null, index: null })
  }

  // 전역 클릭 이벤트로 메뉴 닫기
  React.useEffect(() => {
    const handleClick = () => {
      closeContextMenu()
    }
    if (contextMenu.visible) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [contextMenu.visible])

  // 전역 클릭 이벤트로 범위 편집 닫기
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (editingRangeCell) {
        const target = e.target as HTMLElement
        const rangeEditor = target.closest(`.${styles.rangeEditor}`)
        if (!rangeEditor) {
          cancelRangeEdit()
        }
      }
    }
    if (editingRangeCell) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [editingRangeCell])

  const handleMenuAction = (action: 'addRow' | 'removeRow' | 'addColumn' | 'removeColumn') => {
    closeContextMenu()
    
    if (action === 'addRow') {
      addRow()
    } else if (action === 'removeRow') {
      removeLastRow()
    } else if (action === 'addColumn') {
      addColumn()
    } else if (action === 'removeColumn') {
      removeLastColumn()
    }
  }
  
  // 테이블 전체 너비 계산 (열 개수에 따라)
  const totalTableWidth = React.useMemo(() => {
    if (!columnWidths || columnWidths.length === 0) {
      return 400
    }
    const totalColumnWidth = columnWidths.reduce((sum, width) => sum + width, 0)
    return totalColumnWidth
  }, [columnWidths])

  // range 속성 변경 핸들러
  const handleRangeChange = React.useCallback((checked: boolean) => {
    console.log('handleRangeChange called:', checked, 'onElementChange:', !!onElementChange)
    setRange(checked)
    if (onElementChange) {
      console.log('Calling onElementChange with range:', checked)
      onElementChange({ range: checked })
    } else {
      console.warn('onElementChange is not provided')
    }
  }, [onElementChange])
  
  // 현재 데이터를 가져오는 함수
  const getCurrentTableData = React.useCallback(() => {
    const dataToSave = (input_prop !== undefined || output_prop !== undefined)
      ? tableDataRef.current.map(row => row.slice(1)) // 1열 제외
      : tableDataRef.current
    return dataToSave
  }, [input_prop, output_prop])
  
  // ref를 통해 getCurrentTableData 함수 노출
  React.useImperativeHandle(ref, () => ({
    getCurrentTableData
  }), [getCurrentTableData])

  return (
    <div className={`${styles.tableContainer} ${className}`}>
      <div className={styles.tableInfo}>
        {/* {input_type} → {output_type}
        {input_option && <span> ({input_option})</span>} */}
      </div>
      
      {/* range 체크박스 */}
      <div 
        className={styles.rangeCheckboxContainer} 
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <label 
          className={styles.rangeCheckboxLabel}
          htmlFor={checkboxId}
          onClick={(e) => {
            e.stopPropagation()
            // label 클릭 시 input이 자동으로 토글되도록 함
          }}
        >
          <input
            id={checkboxId}
            type="checkbox"
            checked={!!range}
            onChange={(e) => {
              e.stopPropagation()
              const checked = e.target.checked
              handleRangeChange(checked)
            }}
            className={styles.rangeCheckbox}
            onClick={(e) => {
              e.stopPropagation()
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
            }}
          />
          <span className={styles.rangeCheckboxText}>범위값 지정</span>
        </label>
      </div>
      
      {/* 표 위쪽 버튼 바 */}
      <div className={styles.actionBar}>
        <div className={styles.actionBarGroup}>
          <button
            className={`${styles.actionButton} ${styles.actionButtonWithLabel} ${tableData.length <= 1 ? styles.actionButtonDisabled : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              addRow()
            }}
            title="행 추가"
          >
            <span className={styles.buttonLabel}>행</span>
            <span className={styles.iconAdd}>+</span>
          </button>
          <button
            className={`${styles.actionButton} ${styles.actionButtonWithLabel} ${tableData.length <= 2 ? styles.actionButtonDisabled : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              removeLastRow()
            }}
            disabled={tableData.length <= 2}
            title="행 삭제"
          >
            <span className={styles.buttonLabel}>행</span>
            <span className={styles.iconDelete}>×</span>
          </button>
        </div>
        <div className={styles.actionBarGroup}>
          <button
            className={`${styles.actionButton} ${styles.actionButtonWithLabel} ${(tableData[0]?.length || 0) <= 1 ? styles.actionButtonDisabled : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              addColumn()
            }}
            title="열 추가"
          >
            <span className={styles.buttonLabel}>열</span>
            <span className={styles.iconAdd}>+</span>
          </button>
          <button
            className={`${styles.actionButton} ${styles.actionButtonWithLabel} ${(() => {
              const hasProps = input_prop !== undefined || output_prop !== undefined
              const totalCols = tableData[0]?.length || 0
              // 기본 1열을 제외한 열이 1개밖에 없을 때만 비활성화
              const dataCols = hasProps ? totalCols - 1 : totalCols
              return dataCols <= 1 ? styles.actionButtonDisabled : ''
            })()}`}
            onClick={(e) => {
              e.stopPropagation()
              removeLastColumn()
            }}
            disabled={(() => {
              const hasProps = input_prop !== undefined || output_prop !== undefined
              const totalCols = tableData[0]?.length || 0
              // 기본 1열을 제외한 열이 1개밖에 없을 때만 비활성화
              const dataCols = hasProps ? totalCols - 1 : totalCols
              return dataCols <= 1
            })()}
            title="열 삭제"
          >
            <span className={styles.buttonLabel}>열</span>
            <span className={styles.iconDelete}>×</span>
          </button>
        </div>
      </div>
      
      <div 
        ref={wrapperRef}
        className={styles.tableWrapper}
        style={{ 
          width: 'fit-content',
          maxWidth: '100%',
          minWidth: `${Math.min(totalTableWidth, 400)}px`
        }}
      >
        <table ref={tableRef} className={styles.table} style={{ width: 'auto' }}>
          <tbody>
            {tableData.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className={`${styles.tableRow} ${rowIndex % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd}`}
              >
                {row.map((cell, colIndex) => {
                  // 1열이고 input_prop/output_prop가 있으면 특별 처리
                  const isFirstColumn = colIndex === 0
                  const hasProps = input_prop !== undefined || output_prop !== undefined
                  const isInputRow = rowIndex % 2 === 0 // 입력 행(홀수 행, 0, 2, 4, ...)
                  const isEditingThisCell = editingRangeCell?.rowIndex === rowIndex && editingRangeCell?.colIndex === colIndex
                  
                  let displayValue = cell
                  let isReadOnly = false
                  
                  if (isFirstColumn && hasProps) {
                    // score_type 메뉴에서 label 가져오기
                    const scoreTypeMenu = getTokenMenu('score_type')
                    let label = ''
                    
                    // 홀수 행(0, 2, 4, ...)의 1열은 input_prop의 label로
                    if (rowIndex % 2 === 0 && input_prop !== undefined) {
                      const menuItem = scoreTypeMenu?.items.find(item => item.value === input_prop)
                      label = menuItem?.label || input_prop
                      displayValue = label
                      isReadOnly = true
                    }
                    // 짝수 행(1, 3, 5, ...)의 1열은 output_prop의 label로
                    if (rowIndex % 2 === 1 && output_prop !== undefined) {
                      const menuItem = scoreTypeMenu?.items.find(item => item.value === output_prop)
                      label = menuItem?.label || output_prop
                      displayValue = label
                      isReadOnly = true
                    }
                  } else if (isRangeMode && isInputRow && !isFirstColumn) {
                    // 범위 모드이고 입력 행이면 범위를 한글 설명으로 표시
                    if (cell) {
                      displayValue = parseRangeToDisplay(cell)
                    }
                  }
                  
                  return (
                    <td 
                      key={colIndex} 
                      className={styles.tableCell}
                      style={{ width: columnWidths && columnWidths[colIndex] ? `${columnWidths[colIndex]}px` : 'auto' }}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleContextMenu(e, 'column', colIndex)
                      }}
                    >
                      {isEditingThisCell ? (
                        // 범위 편집 UI (간단한 버전)
                        <div className={styles.rangeEditor} onClick={(e) => e.stopPropagation()}>
                          <div className={styles.rangeEditorForm}>
                            <div className={styles.rangeInputGroup}>
                              <input
                                type="number"
                                value={rangeFormData.start ?? ''}
                                onChange={(e) => setRangeFormData({
                                  ...rangeFormData,
                                  start: e.target.value ? parseFloat(e.target.value) : null
                                })}
                                className={styles.rangeNumberInput}
                                placeholder="시작"
                                size={5}
                              />
                              <select
                                value={rangeFormData.includeStart ? 'gte' : 'gt'}
                                onChange={(e) => setRangeFormData({
                                  ...rangeFormData,
                                  includeStart: e.target.value === 'gte'
                                })}
                                className={styles.rangeBoundarySelect}
                              >
                                <option value="gte">≥</option>
                                <option value="gt">&gt;</option>
                              </select>
                              <span className={styles.rangeSeparator}>~</span>
                              <input
                                type="number"
                                value={rangeFormData.end ?? ''}
                                onChange={(e) => setRangeFormData({
                                  ...rangeFormData,
                                  end: e.target.value ? parseFloat(e.target.value) : null
                                })}
                                className={styles.rangeNumberInput}
                                placeholder="끝"
                                size={5}
                              />
                              <select
                                value={rangeFormData.includeEnd ? 'lte' : 'lt'}
                                onChange={(e) => setRangeFormData({
                                  ...rangeFormData,
                                  includeEnd: e.target.value === 'lte'
                                })}
                                className={styles.rangeBoundarySelect}
                              >
                                <option value="lte">≤</option>
                                <option value="lt">&lt;</option>
                              </select>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  applyRangeEdit()
                                }}
                                className={styles.rangeApplyButton}
                                title="적용"
                              >
                                ✓
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  cancelRangeEdit()
                                }}
                                className={styles.rangeCancelButton}
                                title="취소"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={displayValue}
                          onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                          className={styles.tableInput}
                          readOnly={isReadOnly || (isRangeMode && isInputRow && !isFirstColumn)}
                          style={isReadOnly ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
                          onClick={(e) => {
                            if (isRangeMode && isInputRow && !isFirstColumn && !isReadOnly) {
                              e.stopPropagation()
                              startRangeEdit(rowIndex, colIndex)
                            }
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleContextMenu(e, 'column', colIndex)
                          }}
                        />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 컨텍스트 메뉴 */}
      {contextMenu.visible && (
        <>
          <div 
            className={styles.contextMenuOverlay}
            onClick={closeContextMenu}
          />
          <div 
            className={styles.contextMenu}
            style={{
              position: 'fixed',
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
              zIndex: 10000
            }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
          >
            {contextMenu.type === 'row' && (
              <>
                <button
                  className={styles.contextMenuItem}
                  onClick={() => handleMenuAction('addRow')}
                >
                  행 추가
                </button>
                <button
                  className={`${styles.contextMenuItem} ${tableData.length <= 2 ? styles.contextMenuItemDisabled : ''}`}
                  onClick={() => handleMenuAction('removeRow')}
                  disabled={tableData.length <= 2}
                >
                  행 삭제
                </button>
              </>
            )}
            {contextMenu.type === 'column' && (
              <>
                <button
                  className={styles.contextMenuItem}
                  onClick={() => handleMenuAction('addColumn')}
                >
                  열 추가
                </button>
                <button
                  className={`${styles.contextMenuItem} ${(() => {
                    const hasProps = input_prop !== undefined || output_prop !== undefined
                    const totalCols = tableData[0]?.length || 0
                    // 기본 1열을 제외한 열이 1개밖에 없을 때만 비활성화
                    const dataCols = hasProps ? totalCols - 1 : totalCols
                    return dataCols <= 1 ? styles.contextMenuItemDisabled : ''
                  })()}`}
                  onClick={() => handleMenuAction('removeColumn')}
                  disabled={(() => {
                    const hasProps = input_prop !== undefined || output_prop !== undefined
                    const totalCols = tableData[0]?.length || 0
                    // 기본 1열을 제외한 열이 1개밖에 없을 때만 비활성화
                    const dataCols = hasProps ? totalCols - 1 : totalCols
                    return dataCols <= 1
                  })()}
                >
                  열 삭제
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
})

Table.displayName = 'Table'
