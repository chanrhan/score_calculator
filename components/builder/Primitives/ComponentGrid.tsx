'use client'

import * as React from 'react'
import { useEffect, useMemo } from 'react'
import { FlowBlock } from '@/types/block-structure'
import { HierarchicalCell } from '@/utils/divisionRenderer'
import { Cell } from '../block_builder/Cell'
import { Trash2, Link2, ArrowLeft, ArrowRight, X, Eye } from 'lucide-react'
import { useResultsHighlight } from '@/components/results/ResultsHighlightContext'
import type { BlockData, TokenMenu } from '@/types/block-data'
import { BLOCK_TYPE, BLOCK_TYPE_MAP } from '@/types/block-types'
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
import { useBlockDataStore } from '@/store/useBlockDataStore'
import styles from './ComponentGrid.module.css'
import { toast } from 'sonner'

interface ComponentGridProps {
  blocks: FlowBlock[]
  onBlockChange?: (blockId: number, updatedBlock: FlowBlock) => void
  onBlockCombine?: (blockId: number, side?: 'left' | 'right') => void
  onAddColumn?: (blockId: number) => void
  onInsertRow?: (blocks: FlowBlock[]) => void
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
  onBlockChange,
  onBlockCombine,
  onAddColumn,
  onInsertRow,
  onBlockDelete,
  combineState
}) => {
  // 전역 스토어에서 block_data 가져오기
  const { blockData } = useBlockDataStore();
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
  const calculateTotalRows = (blocks: FlowBlock[]) => {
    for(const block of blocks){
      if(block.block_type === BLOCK_TYPE.DIVISION){
        return block.body_cells.length + 2;
      }
    }
    return 3;
  };
  
  const calculateTotalCols = (blocks: FlowBlock[]) => {
    // 새로운 구조에서는 각 블록의 header_cells 열 개수 합계
    return blocks.reduce((total, block) => {
      let cols = 1;
      
      cols = block.header_cells?.length || 1;
      
      return total + cols;
    }, 0);
  };
  
  const totalRows = calculateTotalRows(blocks);
  const totalCols = calculateTotalCols(blocks);


  // 2단계: 각 셀(r,c)의 내용 채우기
  const fillCellContent = (rowIndex: number, colIndex: number, blocks: FlowBlock[]) => {
    // 현재 열이 어느 블록에 속하는지 찾기
    let currentCol = 0;
    let targetBlock: FlowBlock | null = null;
    let blockColIndex = 0;
    
    for (const block of blocks) {
      let cols = 1;
      cols = block.header_cells?.length || 1;
      
      if (colIndex >= currentCol && colIndex < currentCol + cols) {
        targetBlock = block;
        blockColIndex = colIndex - currentCol;
        break;
      }
      currentCol += cols;
    }
    
    if (!targetBlock) return <div className="empty-cell" />;
    
    // 행과 열 위치에 따라 셀 내용 렌더링 (필요시 동적 데이터 생성)
    return renderCellByPosition(targetBlock, rowIndex, blockColIndex, totalRows);
  };


  // 3단계: 행과 열 위치에 따라 다른 셀 내용 렌더링
  const renderCellByPosition = (block: FlowBlock, rowIndex: number, colIndex: number, totalRows: number) => {
    if (rowIndex === 0) {
      // 1행: 블록명 (첫 번째 열에만 표시, 나머지 열은 빈 셀)
      if (colIndex === 0) {
        // 해당 블록의 col_editable 상태 확인
        const blockDataItem = blockData.find(bd => bd.block_type === block.block_type);
        const isColEditable = blockDataItem?.col_editable || false;
        
        const tooltip = (blockIdToSubjectNames[block.block_id] || []).filter(Boolean).join(', ')
        return (
          <td 
            className={styles.blockNameCell}
            style={{ backgroundColor: getBlockColor(block.block_type) }}
            onClick={async (e) => {
              e.stopPropagation()
              try {
                await navigator.clipboard.writeText(String(block.block_id))
                toast.success(`block_id ${block.block_id} 복사됨`)
              } catch (error) {
                console.error(error)
                toast.error('클립보드 복사 실패')
              }
            }}
            onMouseEnter={() => setHoveredBlockId(block.block_id)}
            onMouseLeave={() => setHoveredBlockId(null)}
          >
            <span title={tooltip || undefined}>{BLOCK_TYPE_MAP[block.block_type as keyof typeof BLOCK_TYPE_MAP]} 블록</span>
        <div className={`${styles.blockActions} ${combineState?.isCombineMode ? styles.combineMode : ''}`}>
          {/* 삭제 버튼 - 호버 시에만 표시 */}
          {onBlockDelete && !readOnly && hoveredBlockId === block.block_id && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                    onBlockDelete(block.block_id)
              }}
              className={styles.deleteButton}
              title="삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {/* 열 추가 버튼 - col_editable이 true이고 호버 시에만 표시 */}
              {isColEditable && !readOnly && hoveredBlockId === block.block_id && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                const updatedBlock = { ...block };
                  
                // header_cells에 새로운 열 추가
                if (updatedBlock.header_cells) {
                  updatedBlock.header_cells = [...updatedBlock.header_cells, [null]];
                }
                
                // body_cells에 새로운 열 추가
                if (updatedBlock.body_cells) {
                  const newCell : any = (block.block_type === BLOCK_TYPE.DIVISION) ? {
                    values: [],
                    rowspan: 1
                  } : [null]

                  updatedBlock.body_cells.forEach((row : any) => {
                    row.push(newCell)
                  })
                }
                
                
                onBlockChange?.(block.block_id, updatedBlock);
              }}
              className={styles.addColumnButton}
              title="열 추가"
            >
              +열
            </button>
          )}
              {/* 데이터 보기 버튼 */}
          {/* <button
            onClick={(e) => {
              e.stopPropagation()
              // 블록 데이터를 DB 형식으로 변환하여 콘솔에 출력
              try {
                const dbData = convertFlowBlockToDb(block, 1, 0)
                console.log('=== 블록 DB 삽입 데이터 ===')
                console.log('블록 타입:', block.block_type)
                console.log('블록 ID:', block.block_id)
                console.log('DB 삽입 데이터:', JSON.stringify(dbData, null, 2))
                console.log('========================')
              } catch (error) {
                console.error('블록 데이터 변환 중 오류 발생:', error)
                console.log('원본 블록 데이터:', block)
              }
            }}
            className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700"
            title="데이터 보기"
          >
            <Eye className="w-4 h-4" />
          </button> */}
              
          {/* 결합 버튼 - 결합 모드일 때는 항상 표시, 아닐 때는 호버 시에만 표시 */}
          {onBlockCombine && !readOnly && (combineState?.isCombineMode || hoveredBlockId === block.block_id) && (
            <CombineButton 
                  blockId={block.block_id} 
              combineState={combineState}
              onCombine={onBlockCombine}
            />
          )}
          
        </div>
      </td>  
        );
      } else {
        return <td className={`${styles.emptyCell} ${styles.tableCell}`} />;
      }
    } else if (rowIndex === 1) {
      // 2행: Header 셀들
      return renderHeaderCells(block, colIndex);
    } else {
      // 3행부터: Body 셀들
      return renderBodyCells(block, rowIndex - 2, colIndex);
    }
  };

  // Header 셀 렌더링
  const renderHeaderCells = (block: FlowBlock, colIndex: number) => {
    // 새로운 FlowBlock 구조에서 header_cells 사용
    const headerValues = [...(block.header_cells?.[colIndex] || [])];
    
    // 구분 블록인 경우 col_type 전달, 그렇지 않으면 null
    const colType = block.block_type === BLOCK_TYPE.DIVISION ? block.header_cells?.[colIndex]?.[0] || null : null;

    return (
      <td key={colIndex} className={styles.tableCell}>
        <div className={styles.headerCell}>
          <Cell
            values={headerValues}
            onChange={(elementIndex, value) => {
              if (readOnly) return;
              // 모든 블록 타입에 대해 동일한 방식으로 처리
              const updatedBlock = { ...block };
              if (updatedBlock.header_cells && updatedBlock.header_cells[colIndex]) {
                const newHeaderCells = [...updatedBlock.header_cells];
                const newColValues = [...newHeaderCells[colIndex]];
                newColValues[elementIndex] = value;
                newHeaderCells[colIndex] = newColValues;
                updatedBlock.header_cells = newHeaderCells;
              }
              onBlockChange?.(block.block_id, updatedBlock);
            }}
            blockType={block.block_type}
            isHeader={true}
            col_type={colType}
          />
        </div>
      </td>
    );
  };

  // Body 셀 렌더링
  const renderBodyCells = (block: FlowBlock, bodyRowIndex: number, colIndex: number) => {
    const colType = block.header_cells?.[colIndex]?.[0] || null;
    
    const bodyValues = (block.block_type === BLOCK_TYPE.DIVISION) ? 
        [...(block.body_cells[bodyRowIndex][colIndex].values as any)] : [...(block.body_cells?.[bodyRowIndex]?.[colIndex] || [])];

        // console.table(block.body_cells[bodyRowIndex][colIndex])
    let rowSpan = 1;
    if(block.block_type === BLOCK_TYPE.DIVISION) {
      rowSpan = bodyValues == null ? 0 : (block.body_cells[bodyRowIndex][colIndex] as any)?.rowspan || 0;
    }
    
    // console.log('block.body_cells:', block.body_cells);
    
    if(rowSpan === 0) {
      return <td/>;
    }

    // 하이라이트 여부를 사전 계산된 Set으로 조회 (훅 미사용)
    const isHighlighted = highlightedCaseSet.has(`${block.block_id}:${bodyRowIndex}`);
    
    return (
      <td key={colIndex} className={`${styles.tableCell} ${isHighlighted ? styles.bodyCellHighlighted : ''}`} rowSpan={rowSpan}>
        <div className={`${styles.bodyCell} `}>
          {isHighlighted && (
            <div className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></div>
          )}
          <Cell
            values={bodyValues}
            onChange={(elementIndex, value) => {
              if (readOnly){
                return;
              }
              const updatedBlock = { ...block };

            // <div className="absolute bottom-0 left-0 right-0 h-3 bg-gray-100 hover:bg-blue-300 cursor-pointer opacity-30 hover:opacity-100 transition-all duration-200 border-t border-gray-200 hover:border-blue-400"
            // onClick={(e) => {
            //   e.stopPropagation();
            //   console.log('onClick');
            // }}
            // />
              if (block.block_type === BLOCK_TYPE.DIVISION) {
                if (updatedBlock.body_cells && updatedBlock.body_cells[bodyRowIndex] && updatedBlock.body_cells[bodyRowIndex][colIndex]) {
                  const newBodyCells = [...updatedBlock.body_cells];
                  const newRowCells = [...newBodyCells[bodyRowIndex]];
                  const newCellValues = {...newRowCells[colIndex]};
                  (newCellValues.values as any)[elementIndex] = value;
                  newRowCells[colIndex] = newCellValues;
                  newBodyCells[bodyRowIndex] = newRowCells;
                  updatedBlock.body_cells = newBodyCells;
                  
                }
              } else {
                // console.log('일반 블록', updatedBlock.body_cells);
                // 일반 블록의 경우 단순한 구조 업데이트
                if (updatedBlock.body_cells && updatedBlock.body_cells[bodyRowIndex] && updatedBlock.body_cells[bodyRowIndex][colIndex]) {
                  // console.log('일반 블록 업데이트');
                  const newBodyCells = [...updatedBlock.body_cells];
                  const newRowCells = [...newBodyCells[bodyRowIndex]];
                  const newCellValues = [...newRowCells[colIndex]];
                  // console.log('newColValues:', newColValues);
                  newCellValues[elementIndex] = value;
                  newRowCells[colIndex] = newCellValues;
                  newBodyCells[bodyRowIndex] = newRowCells;
                  updatedBlock.body_cells = newBodyCells;
                  // console.log('updatedBlock.body_cells:', updatedBlock.body_cells);
                }
              }
              onBlockChange?.(block.block_id, updatedBlock);

            }}
            blockType={block.block_type}
            col_type={colType}
            isHeader={false}
          />
          {block.block_type === BLOCK_TYPE.DIVISION && !readOnly && (
            <div 
            className={styles.rowAddButton}
            onClick={(e) => {
              e.stopPropagation();
              console.log(blocks);
              const updatedBlocks = addRowToAllBlocks(
                blocks,
                bodyRowIndex,
                colIndex,
                totalRows-2,
                totalCols
              ); 
              console.log(updatedBlocks);
              onInsertRow?.(updatedBlocks);
            }}
            title="행 추가"
          />
          )}
        </div>
      </td>
    );
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
  
  return (
    <div className="component-grid overflow-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          {/* 블록명 행 */}
          <tr>
            {Array.from({ length: totalCols }, (_, colIndex) => (
              <td key={colIndex} className="border border-gray-300 p-0">
                {fillCellContent(0, colIndex, blocks)}
              </td>
            ))}
            {/* <td className="border border-gray-300 p-0" colSpan={totalCols}>
                {fillCellContent(0, 0, blocks)}
              </td> */}
          </tr>
          {/* 헤더 행 */}
          <tr>
            {Array.from({ length: totalCols }, (_, colIndex) => (
              <td key={colIndex} className="border border-gray-300 p-0">
                {fillCellContent(1, colIndex, blocks)}
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
              {Array.from({ length: totalRows - 2 }, (_, rowIndex) => {
                return (
                  <tr key={rowIndex}>
                    {Array.from({ length: totalCols }, (_, colIndex) => 
                    {
                      return <>
                        {fillCellContent(rowIndex + 2, colIndex, blocks)}
                      </>
                    }
                    // (
                    //   <td key={colIndex} className="border border-gray-300 p-0">
                    //     {fillCellContent(rowIndex + 2, colIndex, blocks)}
                    //   </td>
                    // )
                    )}
                  </tr>
                )
              })}
          {/* 데이터 행들 */}
          {/* {(() => {
            const rows: JSX.Element[] = [];
            const processedCells = new Set<string>(); // 이미 처리된 셀 추적
            
            for (let rowIndex = 0; rowIndex < totalRows - 2; rowIndex++) {
              const cells: JSX.Element[] = [];
              
              for (let colIndex = 0; colIndex < totalCols; colIndex++) {
                const cellKey = `${rowIndex}-${colIndex}`;
                
                // 이미 rowspan으로 처리된 셀인지 확인
                if (processedCells.has(cellKey)) {
                  continue;
                }
                
                const cellContent = fillCellContent(rowIndex + 2, colIndex, blocks);
                console.log('blocks', blocks);
                const rowspan = rowspanGrid[rowIndex][colIndex];
                
                // rowspan이 적용된 셀인 경우, 다음 행들에서 해당 셀들을 건너뛰도록 표시
                if (rowspan > 1) {
                  for (let i = 1; i < rowspan; i++) {
                    processedCells.add(`${rowIndex + i}-${colIndex}`);
                  }
                }
                
                cells.push(
                  <td 
                    key={colIndex} 
                    className="border border-gray-300 p-0"
                    rowSpan={rowspan > 1 ? rowspan : undefined}
                  >
                    {cellContent}
                  </td>
                );
              }
              
              rows.push(<tr key={rowIndex}>{cells}</tr>);
            }
            
            return rows;
          })()} */}
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
