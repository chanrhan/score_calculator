'use client'

import * as React from 'react'
import { useEffect, useMemo } from 'react'
import { FlowBlock } from '@/types/block-structure'
import { HierarchicalCell } from '@/utils/divisionRenderer'
import { Cell } from '../block_builder/Cell'
import { Link2, ArrowLeft, ArrowRight, X, Eye } from 'lucide-react'
import { useResultsHighlight } from '@/components/results/ResultsHighlightContext'
import type { BlockData, TokenMenu } from '@/types/block-data'
import { BLOCK_TYPE, BLOCK_TYPE_MAP } from '@/types/block-types'
import { getBlockTypeNameById } from '@/lib/blockManager'
import { getBlockType } from '@/types/block-structure'
import { 
  renderDivisionCell, 
  getLeafCellsCount, 
  getDivisionBlockCols,
  type RenderCell 
} from '@/utils/divisionRenderer'
import { 
  updateDivisionCellValue,
  addRowToAllBlocks,
  addColumnToDivisionBlock 
} from '@/utils/divisionUpdater'
import { convertDivisionToAnyBlock } from '@/utils/hierarchicalCellConverter'
import { convertFlowBlockToDb } from '@/utils/blockToDbConverter'
import { BlockInstance } from '@/lib/blocks/BlockInstance'
import { LayoutRendererFactory } from '@/lib/blocks/layout/LayoutRendererFactory'
import { RenderCellContext } from '@/lib/blocks/layout/BlockLayoutRenderer'
import { ALL_TOKEN_MENUS } from '@/lib/data/token-menus'
import styles from './ComponentGrid.module.css'
import { toast } from 'sonner'
import { DivisionHeadData } from '@/types/division-head'
import { createDefaultDivisionHead, calculateRowspan, addRowToDivisionHead, removeRowFromDivisionHead, addColumnToDivisionHead, removeColumnFromDivisionHead } from '@/lib/utils/divisionHeadUtils'
import { Token } from '../block_builder/CellElement/Token'
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

interface ComponentGridProps {
  blocks: BlockInstance[]
  divisionHead?: DivisionHeadData
  onDivisionHeadChange?: (data: DivisionHeadData) => void
  onBlockChange?: (blockId: number, updatedBlock: BlockInstance) => void
  onBlockCombine?: (blockId: number, side?: 'left' | 'right') => void
  onAddColumn?: (blockId: number) => void
  onInsertRow?: (blocks: BlockInstance[]) => void
  onBlockDelete?: (blockId: number) => void
  combineState?: {
    isCombineMode: boolean
    sourceBlockId: number | null
    sourcePipelineId: string | null
  }
}

// refactoring_0911.md에 따른 셀 렌더링 구현
export const ComponentGrid: React.FC<ComponentGridProps> = ({
  blocks,
  divisionHead,
  onDivisionHeadChange,
  onBlockChange,
  onBlockCombine,
  onAddColumn,
  onInsertRow,
  onBlockDelete,
  combineState
}) => {
  // DivisionHead가 없으면 기본값 생성
  const divisionHeadData = React.useMemo(() => {
    return divisionHead || createDefaultDivisionHead()
  }, [divisionHead])
  // block_data는 더 이상 사용하지 않음 (BLOCK_TYPES 직접 사용)
  // const { blockData } = useBlockDataStore();
  const { highlightedBlockIds, blockIdToSubjectNames, highlightedRowsByBlockId, readOnly, snapshots } = useResultsHighlight();
  
  // snapshots를 빠르게 조회하기 위한 키 집합
  const highlightedCaseSet = React.useMemo(() => {
    const set = new Set<string>();
    try {
      snapshots?.forEach?.((snap: any) => {
        set.add(`${snap.block_id}:${snap.case_index}`);
      });
    } catch {}
    return set;
  }, [snapshots]);
  
  // 호버 상태 관리
  const [hoveredBlockId, setHoveredBlockId] = React.useState<number | null>(null);

  // 블록 타입별 색상 매핑 함수
  const getBlockColor = (blockType: number): string => {
    const colorMap: { [key: number]: string } = {
      [BLOCK_TYPE.DIVISION]: '#10b981',           // purple
      [BLOCK_TYPE.APPLY_SUBJECT]: '#3b82f6',      // blue
      [BLOCK_TYPE.GRADE_RATIO]: '#3b82f6',        // blue
      [BLOCK_TYPE.APPLY_TERM]: '#3b82f6',         // blue
      [BLOCK_TYPE.TOP_SUBJECT]: '#3b82f6',        // blue
      [BLOCK_TYPE.SUBJECT_GROUP_RATIO]: '#3b82f6', // blue
      [BLOCK_TYPE.SEPARATION_RATIO]: '#3b82f6',   // blue
      [BLOCK_TYPE.SCORE_MAP]: '#3b82f6',          // blue
      [BLOCK_TYPE.FORMULA]: '#3b82f6',            // blue
      [BLOCK_TYPE.VARIABLE]: '#ef4444',           // red
      [BLOCK_TYPE.CONDITION]: '#8b5cf6',          // purple
      [BLOCK_TYPE.AGGREGATION]: '#8b5cf6',        // green
    };
    return colorMap[blockType] || '#6b7280'; // 기본 회색
  };


  // 1단계: 전체 행×열 크기 계산
  const calculateTotalRows = (blocks: BlockInstance[]) => {
    for(const block of blocks){
      if(block.block_type === BLOCK_TYPE.DIVISION){
        const dbFormat = block.toDbFormat();
        return (dbFormat.body_cells?.length || 0) + 2;
      }
    }
    return 3;
  };
  
  const calculateTotalCols = (blocks: BlockInstance[]) => {
    // 각 블록의 header_cells 열 개수 합계
    return blocks.reduce((total, block) => {
      const dbFormat = block.toDbFormat();
      const cols = dbFormat.header_cells?.length || 1;
      return total + cols;
    }, 0);
  };
  
  const totalRows = calculateTotalRows(blocks);
  const totalCols = calculateTotalCols(blocks);
  
  // DivisionHead 열 개수 추가
  const divisionHeadCols = divisionHeadData.isActive ? divisionHeadData.header.length : 0
  const totalColsWithDivisionHead = totalCols + divisionHeadCols
  
  // DivisionHead의 행 개수 계산
  const divisionHeadRows = divisionHeadData.isActive 
    ? divisionHeadData.body.length + 1 // 헤더 1행 + 바디 행들
    : 1 // 비활성화 시에도 막대 형태로 1행 차지
  const totalRowsWithDivisionHead = Math.max(totalRows, divisionHeadRows)


  // 렌더링 컨텍스트 생성
  // tokenMenus는 이제 코드 상수로 관리되므로 하위 호환성을 위해 빈 배열 전달
  const renderContext: RenderCellContext = React.useMemo(() => ({
    readOnly,
    highlightedCaseSet,
    blockIdToSubjectNames,
    hoveredBlockId,
    setHoveredBlockId,
    tokenMenus: [], // 더 이상 사용하지 않음 (하위 호환성 유지)
    combineState,
    onBlockChange,
    onBlockDelete,
    onBlockCombine,
    onInsertRow
  }), [readOnly, highlightedCaseSet, blockIdToSubjectNames, hoveredBlockId, setHoveredBlockId, combineState, onBlockChange, onBlockDelete, onBlockCombine, onInsertRow]);

  // 2단계: 각 셀(r,c)의 내용 채우기
  const fillCellContent = (rowIndex: number, colIndex: number, blocks: BlockInstance[]) => {
    // 현재 열이 어느 블록에 속하는지 찾기
    let currentCol = 0;
    let targetBlock: BlockInstance | null = null;
    let blockColIndex = 0;
    
    for (const block of blocks) {
      const dbFormat = block.toDbFormat();
      const cols = dbFormat.header_cells?.length || 1;
      
      if (colIndex >= currentCol && colIndex < currentCol + cols) {
        targetBlock = block;
        blockColIndex = colIndex - currentCol;
        break;
      }
      currentCol += cols;
    }
    
    if (!targetBlock) return <div className="empty-cell" />;
    
    // LayoutRenderer를 사용하여 셀 렌더링
    const renderer = LayoutRendererFactory.create(targetBlock.block_type);
    return renderer.renderCell(targetBlock, rowIndex, blockColIndex, totalRows, renderContext);
  };



  // DivisionBlock 전용 Body 셀 렌더링
  // const renderDivisionBodyCells = (block: FlowBlock, bodyRowIndex: number, colIndex: number, totalBodyRows: number) => {
  //   // DivisionBlock의 계층적 구조에서 해당 위치의 셀 정보 가져오기
  //   const renderCell = renderDivisionCell(block, bodyRowIndex, colIndex, totalBodyRows);
    
  //   // 구분 블록인 경우 col_type 전달
  //   const colType = block.header_cells?.[colIndex]?.[0] || null;
    
  //   // rowspan 정보는 미리 계산된 그리드에서 가져옴
  //   const rowspan = rowspanGrid[bodyRowIndex][colIndex];
    
  //   return (
  //     <div className="body-cell p-2 relative min-h-[40px]">
  //       <Cell
  //         values={renderCell?.content || []}
  //         onChange={(elementIndex, value) => {
  //           // DivisionBlock의 계층적 구조 업데이트
  //           const updatedBlock = updateDivisionCellValue(
  //             block,
  //             bodyRowIndex,
  //             colIndex,
  //             elementIndex,
  //             value
  //           );
  //           onBlockChange?.(block.block_id, updatedBlock);
  //         }}
  //         blockType={block.block_type}
  //         isHeader={false}
  //         col_type={colType}
  //       />
        
  //       {/* 행 추가 버튼 (하단 오버레이) */}
  //       <div 
  //         className="absolute bottom-0 left-0 right-0 h-2 bg-transparent hover:bg-blue-200 cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
  //         onClick={(e) => {
  //           e.stopPropagation();
  //           // DivisionBlock에 형제 셀 추가 (행 추가)
  //           const updatedBlock = addRowToAllBlocks(
  //             blocks,
  //             bodyRowIndex,
  //             colIndex
  //           );
  //           onBlockChange?.(block.block_id, updatedBlock);
  //         }}
  //         title="행 추가"
  //       />
  //     </div>
  //   );
  // };

  
  // 4단계: 최종 렌더링 (HTML 테이블 구조)
  // const hasDivisionBlock = blocks.some(block => block.block_type === BLOCK_TYPE.DIVISION);
  
  // if (hasDivisionBlock) {
  //   return renderDivisionTable(blocks, totalRows, totalCols);
  // }
  
  // DivisionHead 셀 렌더링 헬퍼
  const renderDivisionHeadCell = (rowIndex: number, colIndex: number) => {
    // 비활성화 상태일 때는 왼쪽 막대 형태로만 표시
    if (!divisionHeadData.isActive) {
      if (rowIndex === 0 && colIndex === 0) {
        return (
          <td 
            key="dh-collapsed"
            className="border border-gray-300 bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors"
            rowSpan={totalRowsWithDivisionHead}
            style={{ 
              width: '30px',
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              verticalAlign: 'middle',
              textAlign: 'center'
            }}
            onClick={() => !readOnly && onDivisionHeadChange?.({ ...divisionHeadData, isActive: true })}
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
                    onClick={() => onDivisionHeadChange?.({ ...divisionHeadData, isActive: false })}
                  >
                    비활성화
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      const { header, body } = addColumnToDivisionHead(divisionHeadData.header, divisionHeadData.body);
                      onDivisionHeadChange?.({ ...divisionHeadData, header, body });
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
      if (colIndex < divisionHeadCols) {
        const headerCell = divisionHeadData.header[colIndex];
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
                const newHeader = divisionHeadData.header.map((cell, idx) =>
                  idx === colIndex ? { division_type: value } : cell
                );
                onDivisionHeadChange?.({ ...divisionHeadData, header: newHeader });
              }}
              autoFit={true}
            />
          </td>
        )
      }
      return null
    } else {
      // 바디 행들
      const bodyRowIndex = rowIndex - 2;
      if (bodyRowIndex >= 0 && bodyRowIndex < divisionHeadData.body.length && colIndex < divisionHeadCols) {
        const cell = divisionHeadData.body[bodyRowIndex]?.[colIndex] || {};
        const rowspan = calculateRowspan(divisionHeadData.body, bodyRowIndex, colIndex);
        
        // 병합된 셀인지 확인
        let isMerged = false;
        for (let r = 0; r < bodyRowIndex; r++) {
          const prevRowspan = calculateRowspan(divisionHeadData.body, r, colIndex);
          if (r + prevRowspan > bodyRowIndex) {
            isMerged = true;
            break;
          }
        }
        
        if (isMerged) return null;
        
        return (
          <td
            key={`dh-body-${bodyRowIndex}-${colIndex}`}
            className="border border-gray-300 p-2"
            rowSpan={rowspan > 1 ? rowspan : undefined}
          >
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <div className="min-h-[40px]">
                  {Object.entries(cell).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 mb-1">
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => {
                          const newKey = e.target.value;
                          const newBody = divisionHeadData.body.map((row, rIdx) => {
                            if (rIdx === bodyRowIndex) {
                              return row.map((c, cIdx) => {
                                if (cIdx === colIndex) {
                                  const newCell = { ...c };
                                  delete newCell[key];
                                  newCell[newKey] = value;
                                  return newCell;
                                }
                                return c;
                              });
                            }
                            return row;
                          });
                          onDivisionHeadChange?.({ ...divisionHeadData, body: newBody });
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
                          const newBody = divisionHeadData.body.map((row, rIdx) => {
                            if (rIdx === bodyRowIndex) {
                              return row.map((c, cIdx) => {
                                if (cIdx === colIndex) {
                                  return { ...c, [key]: e.target.value };
                                }
                                return c;
                              });
                            }
                            return row;
                          });
                          onDivisionHeadChange?.({ ...divisionHeadData, body: newBody });
                        }}
                        className="flex-1 px-2 py-1 border rounded text-sm"
                        placeholder="값"
                        disabled={readOnly}
                      />
                    </div>
                  ))}
                  {Object.keys(cell).length === 0 && (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      빈 셀
                    </div>
                  )}
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem
                  onClick={() => {
                    const { header, body } = removeColumnFromDivisionHead(
                      divisionHeadData.header,
                      divisionHeadData.body,
                      colIndex
                    );
                    onDivisionHeadChange?.({ ...divisionHeadData, header, body });
                  }}
                  disabled={divisionHeadData.header.length <= 1}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  열 삭제
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                  onClick={() => {
                    // 행 추가는 컴포넌트 내 모든 블록에 영향을 줘야 함
                    // DivisionHead에 행 추가
                    const newDivisionHeadBody = addRowToDivisionHead(divisionHeadData.body, bodyRowIndex, colIndex);
                    onDivisionHeadChange?.({ ...divisionHeadData, body: newDivisionHeadBody });
                    
                    // 모든 블록에도 행 추가 (onInsertRow 사용)
                    if (onInsertRow) {
                      const updatedBlocks = blocks.map(block => {
                        // BlockInstance의 addRow 메서드 사용
                        block.addRow(bodyRowIndex);
                        return block;
                      });
                      onInsertRow(updatedBlocks);
                    }
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  행 추가
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => {
                    if (divisionHeadData.body.length <= 1) return;
                    // 행 삭제는 컴포넌트 내 모든 블록에 영향을 줘야 함
                    const newDivisionHeadBody = removeRowFromDivisionHead(divisionHeadData.body, bodyRowIndex);
                    onDivisionHeadChange?.({ ...divisionHeadData, body: newDivisionHeadBody });
                    
                    // 모든 블록에서도 행 삭제 (onInsertRow 사용)
                    if (onInsertRow) {
                      const updatedBlocks = blocks.map(block => {
                        // BlockInstance의 removeRow 메서드 사용
                        block.removeRow(bodyRowIndex);
                        return block;
                      });
                      onInsertRow(updatedBlocks);
                    }
                  }}
                  disabled={divisionHeadData.body.length <= 1}
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

  return (
    <div className="component-grid overflow-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          {/* 1행: 옵션 부분 (점 3개 아이콘) */}
          <tr>
            {/* DivisionHead 옵션 (활성화/비활성화 상태 모두 렌더링) */}
            {renderDivisionHeadCell(0, 0)}
            {/* 블록 옵션 (각 블록의 1행) */}
            {Array.from({ length: totalCols }, (_, colIndex) => (
              <td key={colIndex} className="border border-gray-300 p-0">
                {fillCellContent(0, colIndex, blocks)}
              </td>
            ))}
          </tr>
          {/* 2행: 헤더 */}
          <tr>
            {/* DivisionHead 헤더 셀들 */}
            {divisionHeadData.isActive && Array.from({ length: divisionHeadCols }, (_, colIndex) => 
              renderDivisionHeadCell(1, colIndex)
            )}
            {/* 블록 헤더 열들 */}
            {Array.from({ length: totalCols }, (_, colIndex) => (
              <td key={colIndex} className="border border-gray-300 p-0">
                {fillCellContent(1, colIndex, blocks)}
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* 3행 이상: 바디 */}
          {Array.from({ length: Math.max(totalRows - 2, divisionHeadData.isActive ? divisionHeadData.body.length : 0) }, (_, rowIndex) => {
            return (
              <tr key={rowIndex}>
                {/* DivisionHead 바디 셀들 */}
                {divisionHeadData.isActive && Array.from({ length: divisionHeadCols }, (_, colIndex) => 
                  renderDivisionHeadCell(rowIndex + 2, colIndex)
                )}
                {/* 블록 바디 열들 */}
                {Array.from({ length: totalCols }, (_, colIndex) => {
                  return (
                    <td key={colIndex} className="border border-gray-300 p-0">
                      {rowIndex < totalRows - 2 ? fillCellContent(rowIndex + 2, colIndex, blocks) : null}
                    </td>
                  );
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  );

};

// 결합 버튼 컴포넌트
interface CombineButtonProps {
  blockId: number
  combineState?: {
    isCombineMode: boolean
    sourceBlockId: number | null
    sourcePipelineId: string | null
  }
  onCombine: (blockId: number, side?: 'left' | 'right') => void
}

const CombineButton: React.FC<CombineButtonProps> = ({ blockId, combineState, onCombine }) => {
  const isCombineMode = combineState?.isCombineMode || false
  const isSourceBlock = combineState?.sourceBlockId === blockId
  
  const getCombineButtonStyle = () => {
    if (!isCombineMode) {
      return "bg-blue-600 text-white p-1 rounded hover:bg-blue-700"
    }
    
    if (isSourceBlock) {
      return "bg-yellow-500 text-white p-1 rounded hover:bg-yellow-600"
    }
    
    return "bg-green-500 text-white p-1 rounded hover:bg-green-600"
  }
  
  // 결합 모드가 아닌 경우: 일반 결합 버튼 표시
  if (!isCombineMode) {
    return (
      <button 
        className={getCombineButtonStyle()}
        onClick={(e) => {
          e.stopPropagation()
          onCombine(blockId)
        }}
        title="결합"
      >
        <Link2 className="w-4 h-4" />
      </button>
    )
  }
  
  // 결합 모드에서 소스 블록인 경우: 취소 버튼 표시
  if (isSourceBlock) {
    return (
      <button 
        className={getCombineButtonStyle()}
        onClick={(e) => {
          e.stopPropagation()
          onCombine(blockId)
        }}
        title="결합 취소"
      >
        <X className="w-4 h-4" />
      </button>
    )
  }
  
  // 결합 모드에서 다른 블록인 경우: 방향 버튼들 표시
  return (
    <div className="flex gap-1">
      <button 
        className="bg-green-500 text-white p-1 rounded hover:bg-green-600"
        onClick={(e) => {
          e.stopPropagation()
          onCombine(blockId, 'left')
        }}
        title="왼쪽에 결합"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>
      <button 
        className="bg-green-500 text-white p-1 rounded hover:bg-green-600"
        onClick={(e) => {
          e.stopPropagation()
          onCombine(blockId, 'right')
        }}
        title="오른쪽에 결합"
      >
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}
