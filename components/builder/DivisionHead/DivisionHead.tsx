'use client'

import * as React from 'react'
import { DivisionHeadData, DivisionHeadHeader, DivisionHeadBody } from '@/types/division-head'
import { calculateRowspan, addRowToDivisionHead, removeRowFromDivisionHead, addColumnToDivisionHead, removeColumnFromDivisionHead } from '@/lib/utils/divisionHeadUtils'
import { Token } from '../block_builder/CellElement/Token'
import { getTokenMenu } from '@/lib/data/token-menus'
import { MoreVertical, Plus, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import styles from './DivisionHead.module.css'

interface DivisionHeadProps {
  data: DivisionHeadData
  onChange: (data: DivisionHeadData) => void
  readOnly?: boolean
}

export const DivisionHead: React.FC<DivisionHeadProps> = ({
  data,
  onChange,
  readOnly = false,
}) => {
  const { header, body, isActive } = data

  // 비활성화 시 아코디언 형태로 접힘
  if (!isActive) {
    return (
      <div className={styles.divisionHeadCollapsed}>
        <div className={styles.headerRow}>
          <span className={styles.title}>구분 헤드</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={styles.menuButton} disabled={readOnly}>
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => onChange({ ...data, isActive: true })}
              >
                활성화
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )
  }

  const handleHeaderChange = (colIndex: number, value: string) => {
    const newHeader: DivisionHeadHeader = header.map((cell, idx) =>
      idx === colIndex ? { division_type: value } : cell
    )
    onChange({ ...data, header: newHeader })
  }

  const handleBodyCellChange = (
    rowIndex: number,
    colIndex: number,
    key: string,
    value: any
  ) => {
    const newBody: DivisionHeadBody = body.map((row, rIdx) => {
      if (rIdx === rowIndex) {
        return row.map((cell, cIdx) => {
          if (cIdx === colIndex) {
            return { ...cell, [key]: value }
          }
          return cell
        })
      }
      return row
    })
    onChange({ ...data, body: newBody })
  }

  const handleAddColumn = () => {
    const { header: newHeader, body: newBody } = addColumnToDivisionHead(
      header,
      body
    )
    onChange({ ...data, header: newHeader, body: newBody })
  }

  const handleRemoveColumn = (colIndex: number) => {
    if (header.length <= 1) {
      // 최소 1개 열 유지
      return
    }
    const { header: newHeader, body: newBody } = removeColumnFromDivisionHead(
      header,
      body,
      colIndex
    )
    onChange({ ...data, header: newHeader, body: newBody })
  }

  const handleAddRow = (rowIndex: number, colIndex: number) => {
    const newBody = addRowToDivisionHead(body, rowIndex, colIndex)
    onChange({ ...data, body: newBody })
  }

  const handleRemoveRow = (rowIndex: number) => {
    if (body.length <= 1) {
      // 최소 1개 행 유지
      return
    }
    const newBody = removeRowFromDivisionHead(body, rowIndex)
    onChange({ ...data, body: newBody })
  }

  const totalRows = body.length
  const totalCols = header.length

  return (
    <div className={styles.divisionHead}>
      {/* 헤더 행 */}
      <div className={styles.headerRow}>
        <div className={styles.headerCells}>
          {header.map((cell, colIndex) => (
            <div key={colIndex} className={styles.headerCell}>
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <div className={styles.cellContent}>
                    <Token
                      element={{
                        type: 'Token',
                        optional: false,
                        visible: true,
                        menu_key: 'division_type',
                        value: cell.division_type || '',
                      }}
                      onChange={(value) =>
                        handleHeaderChange(colIndex, value)
                      }
                      autoFit={true}
                    />
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    onClick={() => handleRemoveColumn(colIndex)}
                    disabled={header.length <= 1}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    열 삭제
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            </div>
          ))}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={styles.menuButton} disabled={readOnly}>
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => onChange({ ...data, isActive: false })}
            >
              비활성화
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleAddColumn}>
              <Plus className="w-4 h-4 mr-2" />
              열 추가
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 바디 행들 */}
      <div className={styles.bodyRows}>
        {body.map((row, rowIndex) => (
          <div key={rowIndex} className={styles.bodyRow}>
            {row.map((cell, colIndex) => {
              const rowspan = calculateRowspan(body, rowIndex, colIndex)
              
              // 병합된 셀인지 확인 (위쪽 행에서 이미 병합된 경우)
              let isMerged = false
              for (let r = 0; r < rowIndex; r++) {
                const prevRowspan = calculateRowspan(body, r, colIndex)
                if (r + prevRowspan > rowIndex) {
                  isMerged = true
                  break
                }
              }

              if (isMerged) {
                return null // 병합된 셀은 렌더링하지 않음
              }

              const divisionType = header[colIndex]?.division_type || ''
              const cellData = cell || {}

              return (
                <ContextMenu key={`${rowIndex}-${colIndex}`}>
                  <ContextMenuTrigger asChild>
                    <div
                      className={styles.bodyCell}
                      style={{
                        gridRow: `span ${rowspan}`,
                      }}
                    >
                      <div className={styles.cellContent}>
                        {/* 동적 key-value 셀 렌더링 */}
                        {Object.entries(cellData).map(([key, value]) => (
                          <div key={key} className={styles.cellKeyValue}>
                            <input
                              type="text"
                              value={key}
                              onChange={(e) => {
                                const newKey = e.target.value
                                const newCell = { ...cellData }
                                delete newCell[key]
                                newCell[newKey] = value
                                handleBodyCellChange(
                                  rowIndex,
                                  colIndex,
                                  newKey,
                                  value
                                )
                              }}
                              className={styles.keyInput}
                              placeholder="키"
                              disabled={readOnly}
                            />
                            <span className={styles.separator}>:</span>
                            <input
                              type="text"
                              value={String(value || '')}
                              onChange={(e) =>
                                handleBodyCellChange(
                                  rowIndex,
                                  colIndex,
                                  key,
                                  e.target.value
                                )
                              }
                              className={styles.valueInput}
                              placeholder="값"
                              disabled={readOnly}
                            />
                          </div>
                        ))}
                        {/* 빈 셀인 경우 입력 필드 표시 */}
                        {Object.keys(cellData).length === 0 && (
                          <div className={styles.cellKeyValue}>
                            <input
                              type="text"
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleBodyCellChange(
                                    rowIndex,
                                    colIndex,
                                    e.target.value,
                                    ''
                                  )
                                }
                              }}
                              className={styles.keyInput}
                              placeholder="키 입력"
                              disabled={readOnly}
                            />
                            <span className={styles.separator}>:</span>
                            <input
                              type="text"
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleBodyCellChange(
                                    rowIndex,
                                    colIndex,
                                    'value',
                                    e.target.value
                                  )
                                }
                              }}
                              className={styles.valueInput}
                              placeholder="값 입력"
                              disabled={readOnly}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem
                      onClick={() => handleRemoveColumn(colIndex)}
                      disabled={header.length <= 1}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      열 삭제
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      onClick={() => handleAddRow(rowIndex, colIndex)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      행 추가
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() => handleRemoveRow(rowIndex)}
                      disabled={body.length <= 1}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      행 삭제
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

