'use client'

import * as React from 'react'
import { DivisionHeadData, DivisionHeadHeader, DivisionHeadBody } from '@/types/division-head'
import { calculateRowspan, addRowToDivisionHead, removeRowFromDivisionHead, addColumnToDivisionHead, removeColumnFromDivisionHead } from '@/lib/utils/divisionHeadUtils'
import { Token } from '../block_builder/CellElement/Token'
import { MoreVertical, Plus, Trash2 } from 'lucide-react'
import { getDivisionHeadCellType } from './cellTypes'
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

// 테이블 셀 형태로 렌더링하는 헬퍼 함수
function renderTableCell({
  data,
  onChange,
  readOnly,
  rowIndex,
  colIndex,
  totalRows,
  onInsertRow,
  blocks = [],
}: {
  data: DivisionHeadData
  onChange: (data: DivisionHeadData) => void
  readOnly: boolean
  rowIndex: number
  colIndex: number
  totalRows?: number
  onInsertRow?: (blocks: any[]) => void
  blocks?: any[]
}) {
  const { header, body, isActive } = data

  // 비활성화 상태일 때는 왼쪽 막대 형태로만 표시
  if (!isActive) {
    if (rowIndex === 0 && colIndex === 0) {
      return (
        <td 
          key="dh-collapsed"
          className="border border-gray-300 bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors"
          rowSpan={totalRows}
          style={{ 
            width: '30px',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            verticalAlign: 'middle',
            textAlign: 'center'
          }}
          onClick={() => !readOnly && onChange({ ...data, isActive: true })}
          title="클릭하여 구분 헤드 활성화"
        >
          <span className="text-xs font-semibold text-gray-600">구분</span>
        </td>
      )
    }
    return null
  }

  if (rowIndex === 0) {
    // 1행: 옵션 부분 (점 3개 아이콘)
    const divisionHeadCols = header.length
    if (colIndex === 0 && divisionHeadCols > 0) {
      return (
        <td 
          key="dh-options"
          className="border border-gray-300 p-2 bg-gray-50"
          colSpan={divisionHeadCols}
        >
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 hover:bg-gray-200 rounded" disabled={readOnly}>
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
                <DropdownMenuItem
                  onClick={() => {
                    const { header: newHeader, body: newBody } = addColumnToDivisionHead(header, body)
                    onChange({ ...data, header: newHeader, body: newBody })
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  열 추가
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </td>
      )
    }
    return null
  } else if (rowIndex === 1) {
    // 헤더 행 (division_type Token 행)
    const divisionHeadCols = header.length
    if (colIndex < divisionHeadCols) {
      const headerCell = header[colIndex]
      return (
        <td key={`dh-header-${colIndex}`} className="border border-gray-300 p-2 bg-gray-50">
          <Token
            element={{
              type: 'Token',
              optional: false,
              visible: true,
              menu_key: 'division_type',
              value: headerCell?.division_type || '',
            }}
            onChange={(value) => {
              const newHeader = header.map((cell, idx) =>
                idx === colIndex ? { division_type: value } : cell
              )
              onChange({ ...data, header: newHeader })
            }}
            autoFit={true}
          />
        </td>
      )
    }
    return null
  } else {
    // 바디 행들
    const bodyRowIndex = rowIndex - 2
    const divisionHeadCols = header.length
    
    // 디버깅: 구분 헤드 바디 셀 렌더링
    console.log(`🎯 구분헤드바디 [${rowIndex}, ${colIndex}]:`, {
      bodyRowIndex,
      divisionHeadCols,
      bodyLength: body.length,
      조건체크: `bodyRowIndex >= 0 (${bodyRowIndex >= 0}) && colIndex < divisionHeadCols (${colIndex < divisionHeadCols})`,
      렌더링여부: bodyRowIndex >= 0 && colIndex < divisionHeadCols,
    });
    
    // bodyRowIndex가 body.length보다 크거나 같으면 빈 셀 렌더링
    // (블록에만 행이 있는 경우)
    if (bodyRowIndex >= 0 && colIndex < divisionHeadCols) {
      // bodyRowIndex가 body.length 범위를 벗어나면 빈 셀 렌더링
      if (bodyRowIndex >= body.length) {
        return (
          <td
            key={`dh-body-empty-${bodyRowIndex}-${colIndex}`}
            className="border border-gray-300 p-2"
            style={{ minHeight: '40px', height: 'auto', verticalAlign: 'top' }}
          >
            {/* 빈 셀 */}
          </td>
        )
      }
      const cell = body[bodyRowIndex]?.[colIndex] || {}
      const rowspan = calculateRowspan(body, bodyRowIndex, colIndex)
      const actualRowspan = cell?.rowspan !== undefined ? cell.rowspan : 1
      
      // rowspan=0이면 null 반환 (문서 규칙: rowspan=0인 셀은 렌더링하지 않음)
      if (rowspan === 0) {
        return null
      }
      
      // 병합된 셀인지 확인
      // 위쪽 행의 rowspan이 현재 행을 포함하는지 확인
      // 포함하면 현재 행의 셀은 병합된 셀이므로 렌더링하지 않음
      let isMerged = false
      if (bodyRowIndex > 0) {
        for (let r = 0; r < bodyRowIndex; r++) {
          const prevRowspan = calculateRowspan(body, r, colIndex)
          // 위쪽 행의 rowspan이 현재 행을 포함하는지 확인
          // r + prevRowspan > bodyRowIndex 이면 현재 행이 위쪽 행의 병합 범위에 포함됨
          if (r + prevRowspan > bodyRowIndex) {
            // 현재 행이 위쪽 행의 병합 범위에 포함되므로 병합된 셀
            isMerged = true
            break
          }
        }
      }
      
      // 병합된 셀이면 null 반환 (렌더링하지 않음)
      if (isMerged) {
        return null
      }

      const divisionType = header[colIndex]?.division_type || ''
      // rowspan 속성은 UI에 표시하지 않으므로 제외
      const { rowspan: _, ...cellDataWithoutRowspan } = cell || {}
      const cellData = cellDataWithoutRowspan
      const CellTypeComponent = divisionType ? getDivisionHeadCellType(divisionType) : null

      const handleCellChange = (key: string, value: any) => {
        // rowspan 속성은 변경 불가
        if (key === 'rowspan') return
        
        const newBody = body.map((row, rIdx) => {
          if (rIdx === bodyRowIndex) {
            return row.map((c, cIdx) => {
              if (cIdx === colIndex) {
                return { ...c, [key]: value }
              }
              return c
            })
          }
          return row
        })
        onChange({ ...data, body: newBody })
      }

      return (
        <td
          key={`dh-body-${bodyRowIndex}-${colIndex}-${divisionType}`}
          className="border border-gray-300 p-2"
          rowSpan={rowspan > 1 ? rowspan : undefined}
          style={{ minHeight: '40px', height: 'auto', verticalAlign: 'top' }}
        >
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div style={{ minHeight: '40px', display: 'flex', flexDirection: 'column', padding: '8px 0' }}>
                {/* 디버깅: rowspan 값 표시 */}
                <div style={{ 
                  fontSize: '10px', 
                  color: '#666', 
                  marginBottom: '4px',
                  padding: '2px 4px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '2px',
                  fontWeight: 'bold'
                }}>
                  rowspan: {rowspan} (실제: {actualRowspan}) [r:{bodyRowIndex}, c:{colIndex}] 전체행:{rowIndex}
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {CellTypeComponent ? (
                    <CellTypeComponent
                      cellData={cellData}
                      onChange={handleCellChange}
                      readOnly={readOnly}
                    />
                  ) : (
                    <>
                      {Object.entries(cellData).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 mb-1">
                        <input
                          type="text"
                          value={key}
                          onChange={(e) => {
                            const newKey = e.target.value
                            const newBody = body.map((row, rIdx) => {
                              if (rIdx === bodyRowIndex) {
                                return row.map((c, cIdx) => {
                                  if (cIdx === colIndex) {
                                    const newCell = { ...c }
                                    delete newCell[key]
                                    newCell[newKey] = value
                                    return newCell
                                  }
                                  return c
                                })
                              }
                              return row
                            })
                            onChange({ ...data, body: newBody })
                          }}
                          className="flex-1 px-2 py-1 border rounded text-sm"
                          placeholder="키"
                          disabled={readOnly}
                        />
                        <span>:</span>
                        <input
                          type="text"
                          value={String(value || '')}
                          onChange={(e) => {
                            const newBody = body.map((row, rIdx) => {
                              if (rIdx === bodyRowIndex) {
                                return row.map((c, cIdx) => {
                                  if (cIdx === colIndex) {
                                    return { ...c, [key]: e.target.value }
                                  }
                                  return c
                                })
                              }
                              return row
                            })
                            onChange({ ...data, body: newBody })
                          }}
                          className="flex-1 px-2 py-1 border rounded text-sm"
                          placeholder="값"
                          disabled={readOnly}
                        />
                      </div>
                    ))}
                    {Object.keys(cellData).length === 0 && (
                      <div className="flex items-center gap-2 text-gray-400 text-sm" style={{ minHeight: '24px' }}>
                        빈 셀
                      </div>
                    )}
                  </>
                )}
                </div>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem
                onClick={() => {
                  if (header.length <= 1) return
                  const { header: newHeader, body: newBody } = removeColumnFromDivisionHead(
                    header,
                    body,
                    colIndex
                  )
                  onChange({ ...data, header: newHeader, body: newBody })
                }}
                disabled={header.length <= 1}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                열 삭제
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={() => {
                  try {
                    // 구분 헤드에 행 추가
                    const newBody = addRowToDivisionHead(body, bodyRowIndex, colIndex)
                    onChange({ ...data, body: newBody })
                    
                    // 블록에도 행 추가
                    if (onInsertRow && blocks) {
                      const updatedBlocks = blocks.map(block => {
                        const blockBodyRowIndex = rowIndex - 2
                        block.addRow(blockBodyRowIndex)
                        return block
                      })
                      console.log('➕ 행 추가:', { 
                        구분헤드행: `${body.length} → ${newBody.length}`, 
                        블록개수: blocks.length 
                      });
                      onInsertRow(updatedBlocks)
                    }
                  } catch (error) {
                    console.error('행 추가 실패:', error)
                    // 에러 발생 시 사용자에게 알림 (선택사항)
                  }
                }}
                disabled={rowspan === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                행 추가
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => {
                  if (body.length <= 1) return
                  const newBody = removeRowFromDivisionHead(body, bodyRowIndex)
                  onChange({ ...data, body: newBody })
                  
                  if (onInsertRow && blocks) {
                    const updatedBlocks = blocks.map(block => {
                      block.removeRow(bodyRowIndex)
                      return block
                    })
                    onInsertRow(updatedBlocks)
                  }
                }}
                disabled={body.length <= 1}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                행 삭제
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </td>
      )
    }
    return null
  }
}

interface DivisionHeadProps {
  data: DivisionHeadData
  onChange: (data: DivisionHeadData) => void
  readOnly?: boolean
  // 테이블 셀 형태로 렌더링할 때 사용
  renderAsTableCell?: boolean
  rowIndex?: number
  colIndex?: number
  totalRows?: number
  onInsertRow?: (blocks: any[]) => void
  blocks?: any[]
}

export const DivisionHead: React.FC<DivisionHeadProps> = ({
  data,
  onChange,
  readOnly = false,
  renderAsTableCell = false,
  rowIndex,
  colIndex,
  totalRows,
  onInsertRow,
  blocks = [],
}) => {
  const { header, body, isActive } = data


  // 테이블 셀 형태로 렌더링하는 경우
  if (renderAsTableCell && rowIndex !== undefined && colIndex !== undefined) {
    return renderTableCell({ data, onChange, readOnly, rowIndex, colIndex, totalRows, onInsertRow, blocks })
  }

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
    // rowspan 속성은 변경 불가
    if (key === 'rowspan') return
    
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
    try {
      // rowIndex는 구분 헤드의 body 배열 인덱스 (0부터 시작)
      const newBody = addRowToDivisionHead(body, rowIndex, colIndex)
      onChange({ ...data, body: newBody })
      
      // 블록에도 행 추가
      // handleAddRow는 renderAsTableCell=false일 때 사용되므로,
      // rowIndex는 이미 구분 헤드의 body 인덱스
      // 하지만 블록의 addRow는 블록의 body 인덱스를 받아야 함
      // 구분 헤드와 블록의 body 인덱스는 같은 테이블 행에 대해 동일해야 함
      // 따라서 rowIndex를 그대로 전달
      if (onInsertRow && blocks) {
        const updatedBlocks = blocks.map(block => {
          block.addRow(rowIndex)
          return block
        })
        onInsertRow(updatedBlocks)
      }
    } catch (error) {
      console.error('행 추가 실패:', error)
      // 에러 발생 시 사용자에게 알림 (선택사항)
    }
  }

  const handleRemoveRow = (rowIndex: number) => {
    if (body.length <= 1) {
      // 최소 1개 행 유지
      return
    }
    const newBody = removeRowFromDivisionHead(body, rowIndex)
    onChange({ ...data, body: newBody })
    
    // 블록에서도 행 삭제
    if (onInsertRow && blocks) {
      const updatedBlocks = blocks.map(block => {
        block.removeRow(rowIndex)
        return block
      })
      onInsertRow(updatedBlocks)
    }
  }

  const totalBodyRows = body.length
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
              const actualRowspan = cell?.rowspan !== undefined ? cell.rowspan : 1
              
              // rowspan=0이면 null 반환 (문서 규칙: rowspan=0인 셀은 렌더링하지 않음)
              if (rowspan === 0) {
                return null
              }
              
              // 병합된 셀인지 확인 (위쪽 행에서 이미 병합된 경우)
              let isMerged = false
              for (let r = 0; r < rowIndex; r++) {
                const prevRowspan = calculateRowspan(body, r, colIndex)
                if (r + prevRowspan > rowIndex) {
                  isMerged = true
                  break
                }
              }

              // 병합된 셀이면 null 반환 (렌더링하지 않음)
              if (isMerged) {
                return null
              }

              const divisionType = header[colIndex]?.division_type || ''
              // rowspan 속성은 UI에 표시하지 않으므로 제외
              const { rowspan: _, ...cellDataWithoutRowspan } = cell || {}
              const cellData = cellDataWithoutRowspan

              // division_type에 해당하는 셀 타입 컴포넌트 가져오기
              const CellTypeComponent = divisionType
                ? getDivisionHeadCellType(divisionType)
                : null

              // 셀 데이터 변경 핸들러
              const handleCellChange = (key: string, value: any) => {
                // rowspan 속성은 변경 불가
                if (key === 'rowspan') return
                handleBodyCellChange(rowIndex, colIndex, key, value)
              }

              // key에 divisionType을 포함하여 divisionType 변경 시 컴포넌트가 재마운트되도록 함
              return (
                <ContextMenu key={`${rowIndex}-${colIndex}-${divisionType}`}>
                  <ContextMenuTrigger asChild>
                    <div
                      className={styles.bodyCell}
                      style={{
                        gridRow: `span ${rowspan}`,
                      }}
                    >
                      <div className={styles.cellContent} style={{ display: 'flex', flexDirection: 'column' }}>
                        {/* 디버깅: rowspan 값 표시 */}
                        <div style={{ 
                          fontSize: '10px', 
                          color: '#666', 
                          marginBottom: '4px',
                          padding: '2px 4px',
                          backgroundColor: '#f0f0f0',
                          borderRadius: '2px',
                          fontWeight: 'bold'
                        }}>
                          rowspan: {rowspan} (실제: {actualRowspan}) [r:{rowIndex}, c:{colIndex}]
                        </div>
                        {/* division_type에 따라 셀 타입 컴포넌트 렌더링 */}
                        {CellTypeComponent ? (
                          <CellTypeComponent
                            cellData={cellData}
                            onChange={handleCellChange}
                            readOnly={readOnly}
                          />
                        ) : (
                          /* division_type이 없거나 매핑되지 않은 경우 기본 key-value 형태로 렌더링 */
                          <>
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
                          </>
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
                      onClick={() => {
                        try {
                          handleAddRow(rowIndex, colIndex)
                        } catch (error) {
                          console.error('행 추가 실패:', error)
                        }
                      }}
                      disabled={rowspan === 0}
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

