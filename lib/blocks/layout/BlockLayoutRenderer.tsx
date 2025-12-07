// lib/blocks/layout/BlockLayoutRenderer.tsx
// 블록의 내부 셀 레이아웃(배치, HTML/CSS)을 결정하는 C 객체

import React from 'react';
import { BlockInstance } from '../BlockInstance';
import { BLOCK_TYPE } from '@/types/block-types';
import { Link2, ArrowLeft, ArrowRight, X } from 'lucide-react';

export interface RenderCellContext {
  readOnly: boolean;
  highlightedCaseSet: Set<string>;
  blockIdToSubjectNames: Record<number, string[]>;
  hoveredBlockId: number | null;
  setHoveredBlockId?: (blockId: number | null) => void;
  tokenMenus?: any[]; // Token 메뉴 데이터
  combineState?: {
    isCombineMode: boolean;
    sourceBlockId: number | null;
    sourcePipelineId: string | null;
  };
  onBlockChange?: (blockId: number, updatedBlock: BlockInstance) => void;
  onBlockDelete?: (blockId: number) => void;
  onBlockCombine?: (blockId: number, side?: 'left' | 'right') => void;
  onInsertRow?: (blocks: BlockInstance[]) => void;
}

/**
 * 블록의 레이아웃 렌더링을 담당하는 추상 클래스
 * 각 블록 타입별로 다른 레이아웃 로직을 구현
 */
export abstract class BlockLayoutRenderer {
  /**
   * 특정 위치의 셀을 렌더링
   * @param block 블록 인스턴스
   * @param rowIndex 행 인덱스 (전체 그리드 기준)
   * @param colIndex 열 인덱스 (블록 내부 기준)
   * @param totalRows 전체 행 수
   * @param context 렌더링 컨텍스트
   */
  abstract renderCell(
    block: BlockInstance,
    rowIndex: number,
    colIndex: number,
    totalRows: number,
    context: RenderCellContext
  ): React.ReactNode;

  /**
   * 셀의 rowspan 계산
   * @param block 블록 인스턴스
   * @param rowIndex 행 인덱스
   * @param colIndex 열 인덱스
   */
  abstract calculateRowSpan(
    block: BlockInstance,
    rowIndex: number,
    colIndex: number
  ): number;

  /**
   * 블록명 셀 렌더링 (공통)
   * 실제 구현은 하위 클래스에서 스타일을 적용하여 오버라이드 가능
   */
  protected renderBlockNameCell(
    block: BlockInstance,
    context: RenderCellContext,
    styles: any
  ): React.ReactNode {
    const { 
      blockIdToSubjectNames, 
      hoveredBlockId, 
      setHoveredBlockId,
      combineState,
      onBlockChange,
      onBlockDelete,
      onBlockCombine,
      readOnly
    } = context;

    // 블록 타입별 색상 매핑
    const getBlockColor = (blockType: number): string => {
      const colorMap: { [key: number]: string } = {
        [BLOCK_TYPE.DIVISION]: '#10b981',
        [BLOCK_TYPE.APPLY_SUBJECT]: '#3b82f6',
        [BLOCK_TYPE.GRADE_RATIO]: '#3b82f6',
        [BLOCK_TYPE.APPLY_TERM]: '#3b82f6',
        [BLOCK_TYPE.TOP_SUBJECT]: '#3b82f6',
        [BLOCK_TYPE.SUBJECT_GROUP_RATIO]: '#3b82f6',
        [BLOCK_TYPE.SEPARATION_RATIO]: '#3b82f6',
        [BLOCK_TYPE.SCORE_MAP]: '#3b82f6',
        [BLOCK_TYPE.FORMULA]: '#3b82f6',
        [BLOCK_TYPE.VARIABLE]: '#ef4444',
        [BLOCK_TYPE.CONDITION]: '#8b5cf6',
        [BLOCK_TYPE.AGGREGATION]: '#8b5cf6',
      };
      return colorMap[blockType] || '#6b7280';
    };

    const tooltip = (blockIdToSubjectNames[block.block_id] || []).filter(Boolean).join(', ');
    const blockTypeName = this.getBlockTypeName(block.block_type);
    const isColEditable = block.getStructure()?.col_editable || false;
    const isHovered = hoveredBlockId === block.block_id;
    const shouldShowActions = isHovered || combineState?.isCombineMode;

    return (
      <td
        className={styles.blockNameCell}
        style={{ backgroundColor: getBlockColor(block.block_type) }}
        onClick={async (e) => {
          e.stopPropagation();
          try {
            await navigator.clipboard.writeText(String(block.block_id));
            // toast는 외부에서 처리
          } catch (error) {
            console.error(error);
          }
        }}
        onMouseEnter={() => {
          setHoveredBlockId?.(block.block_id);
        }}
        onMouseLeave={() => {
          setHoveredBlockId?.(null);
        }}
      >
        <span title={tooltip || undefined}>{blockTypeName} 블록</span>
        <div 
          className={`${styles.blockActions} ${combineState?.isCombineMode ? styles.combineMode : ''}`}
          style={{ opacity: shouldShowActions ? 1 : 0 }}
        >
          {/* 삭제 버튼 */}
          {onBlockDelete && !readOnly && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBlockDelete(block.block_id);
              }}
              className={styles.deleteButton}
              title="삭제"
            >
              🗑️
            </button>
          )}
          {/* 열 추가 버튼 */}
          {isColEditable && !readOnly && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                block.addColumn();
                onBlockChange?.(block.block_id, block);
              }}
              className={styles.addColumnButton}
              title="열 추가"
            >
              +열
            </button>
          )}
          {/* 결합 버튼 */}
          {onBlockCombine && !readOnly && (
            <>
              {!combineState?.isCombineMode ? (
                // 결합 모드가 아닌 경우: 일반 결합 버튼 표시
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onBlockCombine(block.block_id);
                  }}
                  className={styles.combineButton}
                  title="결합"
                >
                  <Link2 className="w-4 h-4" />
                </button>
              ) : combineState.sourceBlockId === block.block_id ? (
                // 결합 모드에서 소스 블록인 경우: 취소 버튼 표시
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onBlockCombine(block.block_id);
                  }}
                  className={`${styles.combineButton} ${styles.combineButtonSource}`}
                  title="결합 취소"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                // 결합 모드에서 다른 블록인 경우: 방향 버튼들 표시
                <div className={styles.combineButtons}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onBlockCombine(block.block_id, 'left');
                    }}
                    className={styles.combineDirectionButton}
                    title="왼쪽에 결합"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onBlockCombine(block.block_id, 'right');
                    }}
                    className={styles.combineDirectionButton}
                    title="오른쪽에 결합"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </td>
    );
  }

  /**
   * 블록 타입 이름 가져오기
   */
  protected getBlockTypeName(blockType: number): string {
    const blockTypeMap: Record<number, string> = {
      [BLOCK_TYPE.DIVISION]: '구분',
      [BLOCK_TYPE.APPLY_SUBJECT]: '반영교과',
      [BLOCK_TYPE.GRADE_RATIO]: '학년비율',
      [BLOCK_TYPE.APPLY_TERM]: '반영학기',
      [BLOCK_TYPE.TOP_SUBJECT]: '상위교과',
      [BLOCK_TYPE.SUBJECT_GROUP_RATIO]: '교과그룹비율',
      [BLOCK_TYPE.SEPARATION_RATIO]: '분리비율',
      [BLOCK_TYPE.SCORE_MAP]: '점수매핑',
      [BLOCK_TYPE.FORMULA]: '수식',
      [BLOCK_TYPE.VARIABLE]: '변수',
      [BLOCK_TYPE.CONDITION]: '조건',
      [BLOCK_TYPE.AGGREGATION]: '집계',
      [BLOCK_TYPE.RATIO]: '비율',
      [BLOCK_TYPE.DECIMAL]: '소수점',
    };
    return blockTypeMap[blockType] || '알 수 없음';
  }
}

