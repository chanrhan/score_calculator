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
import { createDefaultDivisionHead } from '@/lib/utils/divisionHeadUtils'
import { DivisionHead } from '../DivisionHead/DivisionHead'

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
  // divisionHead 객체의 변경을 감지하기 위해 body.length를 의존성으로 사용
  const divisionHeadBodyLength = divisionHead?.body?.length ?? 0;
  const divisionHeadHeaderLength = divisionHead?.header?.length ?? 0;
  const divisionHeadIsActive = divisionHead?.isActive ?? true;
  
  const divisionHeadData = React.useMemo(() => {
    return divisionHead || createDefaultDivisionHead()
  }, [divisionHead, divisionHeadBodyLength, divisionHeadHeaderLength, divisionHeadIsActive])
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
  
  // DivisionHead 열 개수
  // 비활성화되어 있어도 막대 형태로 1열은 차지함
  const divisionHeadCols = React.useMemo(() => {
    return divisionHeadData.isActive ? divisionHeadData.header.length : 1;
  }, [divisionHeadData.isActive, divisionHeadData.header.length]);
  
  // 전체 행×열 크기 계산 (구분 헤드 + 블록)
  const totalRowsWithDivisionHead = React.useMemo(() => {
    // 블록의 바디 행 수
    const blockBodyRows = totalRows - 2; // totalRows는 옵션(1행) + 헤더(1행) + 바디 행들
    // 구분 헤드의 바디 행 수
    const divisionHeadBodyRows = divisionHeadData.isActive ? divisionHeadData.body.length : 0;
    // 전체 바디 행 수는 둘 중 큰 값
    const maxBodyRows = Math.max(blockBodyRows, divisionHeadBodyRows);
    // 전체 행 수 = 옵션(1행) + 헤더(1행) + 바디 행들
    return 2 + maxBodyRows;
  }, [totalRows, divisionHeadData.isActive, divisionHeadData.body.length])

  // 전체 열 수 (구분 헤드 + 블록)
  const totalColsWithDivisionHead = totalCols + divisionHeadCols;

  // 전체 그리드 구조 로그 (렌더링 시 한 번만 출력)
  React.useEffect(() => {
    const gridInfo = {
      '구분 헤드': {
        활성화: divisionHeadData.isActive,
        열개수: divisionHeadCols,
        바디행수: divisionHeadData.body.length,
        헤더: divisionHeadData.header,
        바디: divisionHeadData.body,
      },
      '블록들': {
        개수: blocks.length,
        총열개수: totalCols,
        각블록열개수: blocks.map(b => {
          const db = b.toDbFormat();
          return { id: b.block_id, 열개수: db.header_cells?.length || 1 };
        }),
      },
      '전체 그리드': {
        총행수: totalRowsWithDivisionHead,
        총열수: totalColsWithDivisionHead,
        구조: `[${totalRowsWithDivisionHead}행 × ${totalColsWithDivisionHead}열] = 구분헤드(${divisionHeadCols}열) + 블록들(${totalCols}열)`,
      },
    };
    console.log('📊 전체 그리드 구조:', gridInfo);
  }, [divisionHeadData, divisionHeadCols, blocks, totalCols, totalRowsWithDivisionHead, totalColsWithDivisionHead])

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
  // colIndex는 블록들의 열 인덱스 (0부터 시작, 구분 헤드 열 제외)
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
    
    if (!targetBlock) {
      // 디버깅: 블록을 찾지 못한 경우
      if (rowIndex >= 2) {
        console.warn(`⚠️ 블록을 찾지 못함 [${rowIndex}, ${colIndex}]:`, {
          블록열인덱스: colIndex,
          블록개수: blocks.length,
          블록총열개수: totalCols,
        });
      }
      return <div className="empty-cell" />;
    }
    
    // 디버깅: 블록 셀 렌더링
    if (rowIndex >= 2) {
      console.log(`📦 블록셀 [${rowIndex}, ${colIndex}]:`, {
        블록ID: targetBlock.block_id,
        블록타입: targetBlock.block_type,
        블록내부열인덱스: blockColIndex,
        블록열범위: `${currentCol} ~ ${currentCol + (targetBlock.toDbFormat().header_cells?.length || 1) - 1}`,
      });
    }
    
    // LayoutRenderer를 사용하여 셀 렌더링
    const renderer = LayoutRendererFactory.create(targetBlock.block_type);
    return renderer.renderCell(targetBlock, rowIndex, blockColIndex, totalRows, renderContext);
  };
  
  // DivisionHead 셀 렌더링 헬퍼
  // rowIndex: 전체 그리드의 행 인덱스
  // colIndex: 구분 헤드 내부의 열 인덱스 (0부터 시작)
  const renderDivisionHeadCell = (rowIndex: number, colIndex: number, data: DivisionHeadData) => {
    return (
      <DivisionHead
        key={`dh-${rowIndex}-${colIndex}-${data.body.length}`}
        data={data}
        onChange={(data) => {
          console.log('✅ 구분헤드 변경:', { 바디행수: data.body.length });
          onDivisionHeadChange?.(data)
        }}
        readOnly={readOnly}
        renderAsTableCell={true}
        rowIndex={rowIndex}
        colIndex={colIndex}
        totalRows={totalRowsWithDivisionHead}
        onInsertRow={onInsertRow}
        blocks={blocks}
      />
    )
  }

  // 각 위치(r,c)에 맞는 셀 렌더링 함수
  const renderCellAtPosition = (rowIndex: number, colIndex: number): React.ReactNode => {
    // 구분 헤드 열인지 확인
    const isDivisionHeadCol = colIndex < divisionHeadCols;
    
    // 디버깅: 각 셀 렌더링 시점
    if (rowIndex >= 2) { // 바디 행만 로그
      console.log(`📍 셀 렌더링 [${rowIndex}, ${colIndex}]:`, {
        전체열인덱스: colIndex,
        구분헤드열개수: divisionHeadCols,
        구분헤드열인가: isDivisionHeadCol,
        블록열인덱스: isDivisionHeadCol ? null : colIndex - divisionHeadCols,
      });
    }
    
    if (isDivisionHeadCol) {
      // 구분 헤드 열 (0 ~ divisionHeadCols - 1)
      // colIndex는 전체 그리드의 열 인덱스이므로, 구분 헤드 내부 열 인덱스로 변환
      // 구분 헤드가 항상 첫 번째 열부터 시작하므로, colIndex가 구분 헤드 내부 열 인덱스와 동일
      const divisionHeadInternalColIndex = divisionHeadData.isActive ? colIndex : 0;
      return renderDivisionHeadCell(rowIndex, divisionHeadInternalColIndex, divisionHeadData);
    }
    
    // 블록 열인 경우
    // 전체 그리드에서 블록 영역의 열 인덱스 = colIndex - divisionHeadCols
    // 이 값은 블록들의 열 인덱스 (0부터 시작)
    const blockColIndex = colIndex - divisionHeadCols;
    
    return (
      <td key={`block-${rowIndex}-${colIndex}`} className="border border-gray-300 p-0" style={{ minHeight: '40px' }}>
        {fillCellContent(rowIndex, blockColIndex, blocks)}
      </td>
    );
  };

  return (
    <div className="component-grid overflow-auto">
      <table className="w-full border-collapse border border-gray-300">
        <tbody>
          {React.useMemo(() => {
            // 전체 행을 순회하면서 각 행 렌더링
            return Array.from({ length: totalRowsWithDivisionHead }, (_, rowIndex) => {
              return (
                <tr 
                  key={`row-${rowIndex}-${divisionHeadData.body.length}`}
                  style={{ minHeight: '40px', height: 'auto' }}
                >
                  {/* 각 열을 순회하면서 해당 위치의 셀 렌더링 */}
                  {Array.from({ length: totalColsWithDivisionHead }, (_, colIndex) => 
                    renderCellAtPosition(rowIndex, colIndex)
                  )}
                </tr>
              );
            });
          }, [
            totalRowsWithDivisionHead, 
            totalColsWithDivisionHead, 
            divisionHeadData, 
            divisionHeadCols, 
            totalCols, 
            blocks, 
            readOnly, 
            onDivisionHeadChange, 
            onInsertRow
          ])}
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
