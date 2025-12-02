'use client'

import * as React from 'react'
import { TableElement } from '@/types/block-structure'
import styles from './Table.module.css'

interface TableProps {
  element: TableElement
  onChange?: (value: any[][]) => void
  className?: string
}

export const Table: React.FC<TableProps> = ({ element, onChange, className = '' }) => {
  const { value, init_rows, init_cols, input_type, output_type, optional, visible, input_option } = element
  
  if (optional && !visible) {
    return null
  }
  
  // 테이블 값 초기화
  const [tableData, setTableData] = React.useState<any[][]>(
    value || Array(init_rows).fill(null).map(() => Array(init_cols).fill(''))
  )
  
  // 각 열의 최대 텍스트 길이 계산
  const calculateColumnWidths = React.useCallback(() => {
    if (!tableData.length) return []
    
    const columnCount = tableData[0].length
    const columnWidths = []
    
    for (let colIndex = 0; colIndex < columnCount; colIndex++) {
      let maxLength = 0
      for (let rowIndex = 0; rowIndex < tableData.length; rowIndex++) {
        const cellValue = tableData[rowIndex][colIndex] || ''
        const textLength = cellValue.length
        maxLength = Math.max(maxLength, textLength)
      }
      // 최소 60px, 텍스트 길이 * 8px + 패딩 20px
      const width = Math.max(60, maxLength * 8 + 20)
      columnWidths.push(width)
    }
    
    return columnWidths
  }, [tableData])
  
  const columnWidths = calculateColumnWidths()
  
  const handleCellChange = (rowIndex: number, colIndex: number, newValue: string) => {
    const newData = [...tableData]
    newData[rowIndex] = [...newData[rowIndex]]
    newData[rowIndex][colIndex] = newValue
    setTableData(newData)
    onChange?.(newData)
  }
  
  const addColumn = () => {
    const newData = tableData.map(row => [...row, ''])
    setTableData(newData)
    onChange?.(newData)
  }
  
  const addRow = () => {
    const newData = [...tableData, Array(tableData[0]?.length || init_cols).fill('')]
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
  
  // 테이블 전체 너비 계산 (열 개수에 따라)
  const totalTableWidth = React.useMemo(() => {
    const totalColumnWidth = columnWidths.reduce((sum, width) => sum + width, 0)
    const actionColumnWidth = 40 // 행/열 삭제 버튼 너비
    const totalColumns = tableData[0]?.length || 0
    return totalColumnWidth + (totalColumns * actionColumnWidth) + 40 // +열 버튼 공간
  }, [columnWidths, tableData])

  return (
    <div className={`${styles.tableContainer} ${className}`}>
      <div className={styles.tableInfo}>
        {/* {input_type} → {output_type}
        {input_option && <span> ({input_option})</span>} */}
      </div>
      
      <div 
        className={styles.tableWrapper}
        style={{ 
          width: 'fit-content',
          maxWidth: '100%',
          minWidth: `${Math.min(totalTableWidth, 400)}px`
        }}
      >
        <table className={styles.table} style={{ width: 'auto' }}>
          <tbody>
            {tableData.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex === 0 ? styles.tableRowHeader : styles.tableRow}>
                {row.map((cell, colIndex) => (
                  <td 
                    key={colIndex} 
                    className={styles.tableCell}
                    style={{ width: columnWidths[colIndex] ? `${columnWidths[colIndex]}px` : 'auto' }}
                  >
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                      className={styles.tableInput}
                      placeholder={rowIndex === 0 ? input_type : output_type}
                    />
                  </td>
                ))}
                <td className={styles.tableCell} style={{ width: '40px' }}>
                  <button
                    onClick={() => removeRow(rowIndex)}
                    className={`${styles.removeButton} ${tableData.length <= 1 ? styles.removeButtonDisabled : ''}`}
                    disabled={tableData.length <= 1}
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
            <tr>
              {Array(tableData[0]?.length || init_cols).fill(null).map((_, colIndex) => (
                <td 
                  key={colIndex} 
                  className={styles.tableCell}
                  style={{ width: columnWidths[colIndex] ? `${columnWidths[colIndex]}px` : 'auto' }}
                >
                  <button
                    onClick={() => removeColumn(colIndex)}
                    className={`${styles.removeButton} w-full ${(tableData[0]?.length || 0) <= 1 ? styles.removeButtonDisabled : ''}`}
                    disabled={(tableData[0]?.length || 0) <= 1}
                  >
                    ×
                  </button>
                </td>
              ))}
              <td className={styles.tableCell} style={{ width: '40px' }}>
                <button
                  onClick={addRow}
                  className={styles.addButton}
                >
                  +행
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div className={styles.tableActions}>
          <button
            onClick={addColumn}
            className={styles.addButton}
          >
            +열
          </button>
        </div>
      </div>
    </div>
  )
}