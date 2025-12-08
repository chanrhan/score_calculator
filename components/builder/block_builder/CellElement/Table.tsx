'use client'

import * as React from 'react'
import { TableElement } from '@/types/block-structure'
import styles from './Table.module.css'

interface TableProps {
  element: TableElement
  onChange?: (value: any[][]) => void
  className?: string
}

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  type: 'row' | 'column' | null
  index: number | null
}

export const Table: React.FC<TableProps> = ({ element, onChange, className = '' }) => {
  const { value, init_rows, init_cols, input_type, output_type, optional, visible, input_option } = element
  
  if (optional && !visible) {
    return null
  }
  
  // 테이블 값 초기화
  const initializeTableData = React.useCallback(() => {
    if (value && Array.isArray(value) && value.length > 0 && value[0]?.length > 0) {
      return value
    }
    return Array(init_rows).fill(null).map(() => Array(init_cols).fill(''))
  }, [value, init_rows, init_cols])

  const [tableData, setTableData] = React.useState<any[][]>(initializeTableData)
  
  // value prop이 변경되면 업데이트
  React.useEffect(() => {
    if (value && Array.isArray(value) && value.length > 0 && value[0]?.length > 0) {
      setTableData(value)
    }
  }, [value])

  // 컨텍스트 메뉴 상태
  const [contextMenu, setContextMenu] = React.useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    type: null,
    index: null
  })

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
    
    for (let colIndex = 0; colIndex < columnCount; colIndex++) {
      let maxLength = 0
      for (let rowIndex = 0; rowIndex < tableData.length; rowIndex++) {
        const cellValue = tableData[rowIndex]?.[colIndex] || ''
        const textLength = String(cellValue).length
        maxLength = Math.max(maxLength, textLength)
      }
      // 최소 60px, 텍스트 길이 * 8px + 패딩 20px
      const width = Math.max(60, maxLength * 8 + 20)
      columnWidths.push(width)
    }
    
    return columnWidths
  }, [tableData, init_cols])
  
  const columnWidths = calculateColumnWidths()
  
  const handleCellChange = (rowIndex: number, colIndex: number, newValue: string) => {
    const newData = [...tableData]
    newData[rowIndex] = [...newData[rowIndex]]
    newData[rowIndex][colIndex] = newValue
    setTableData(newData)
    onChange?.(newData)
  }
  
  // 마지막 열에 열 추가
  const addColumn = () => {
    const newData = tableData.map(row => [...row, ''])
    setTableData(newData)
    onChange?.(newData)
  }
  
  // 마지막 행에 행 추가
  const addRow = () => {
    const newData = [...tableData, Array(tableData[0]?.length || init_cols).fill('')]
    setTableData(newData)
    onChange?.(newData)
  }
  
  // 마지막 열 삭제
  const removeLastColumn = () => {
    if (tableData[0]?.length <= 1) return
    const lastColIndex = tableData[0].length - 1
    const newData = tableData.map(row => row.filter((_, index) => index !== lastColIndex))
    setTableData(newData)
    onChange?.(newData)
  }
  
  // 마지막 행 삭제
  const removeLastRow = () => {
    if (tableData.length <= 1) return
    const newData = tableData.filter((_, index) => index !== tableData.length - 1)
    setTableData(newData)
    onChange?.(newData)
  }

  // Notion 스타일: 행 위에 삽입 (컨텍스트 메뉴용)
  const insertRowAbove = (rowIndex: number) => {
    const newData = [...tableData]
    newData.splice(rowIndex, 0, Array(tableData[0]?.length || init_cols).fill(''))
    setTableData(newData)
    onChange?.(newData)
  }

  // Notion 스타일: 열 왼쪽에 삽입 (컨텍스트 메뉴용)
  const insertColumnLeft = (colIndex: number) => {
    const newData = tableData.map(row => {
      const newRow = [...row]
      newRow.splice(colIndex, 0, '')
      return newRow
    })
    setTableData(newData)
    onChange?.(newData)
  }
  
  const removeColumn = (colIndex: number) => {
    if (tableData[0]?.length <= 1) return
    const newData = tableData.map(row => row.filter((_, index) => index !== colIndex))
    setTableData(newData)
    onChange?.(newData)
  }
  
  const removeRow = (rowIndex: number) => {
    if (tableData.length <= 1) return
    const newData = tableData.filter((_, index) => index !== rowIndex)
    setTableData(newData)
    onChange?.(newData)
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

  return (
    <div className={`${styles.tableContainer} ${className}`}>
      <div className={styles.tableInfo}>
        {/* {input_type} → {output_type}
        {input_option && <span> ({input_option})</span>} */}
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
            className={`${styles.actionButton} ${styles.actionButtonWithLabel} ${tableData.length <= 1 ? styles.actionButtonDisabled : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              removeLastRow()
            }}
            disabled={tableData.length <= 1}
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
            className={`${styles.actionButton} ${styles.actionButtonWithLabel} ${(tableData[0]?.length || 0) <= 1 ? styles.actionButtonDisabled : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              removeLastColumn()
            }}
            disabled={(tableData[0]?.length || 0) <= 1}
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
                {row.map((cell, colIndex) => (
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
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                      className={styles.tableInput}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleContextMenu(e, 'column', colIndex)
                      }}
                    />
                  </td>
                ))}
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
                  className={`${styles.contextMenuItem} ${tableData.length <= 1 ? styles.contextMenuItemDisabled : ''}`}
                  onClick={() => handleMenuAction('removeRow')}
                  disabled={tableData.length <= 1}
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
                  className={`${styles.contextMenuItem} ${(tableData[0]?.length || 0) <= 1 ? styles.contextMenuItemDisabled : ''}`}
                  onClick={() => handleMenuAction('removeColumn')}
                  disabled={(tableData[0]?.length || 0) <= 1}
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
}
