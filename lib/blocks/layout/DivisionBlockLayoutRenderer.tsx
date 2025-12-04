// lib/blocks/layout/DivisionBlockLayoutRenderer.tsx
// Division 블록의 특별한 레이아웃 렌더러 (계층 구조, rowspan 등)

import React from 'react';
import { BlockInstance } from '../BlockInstance';
import { BlockLayoutRenderer, RenderCellContext } from './BlockLayoutRenderer';
import { BLOCK_TYPE } from '@/types/block-types';
import { Cell } from '@/components/builder/block_builder/Cell';
import styles from '@/components/builder/Primitives/ComponentGrid.module.css';

export class DivisionBlockLayoutRenderer extends BlockLayoutRenderer {
  renderCell(
    block: BlockInstance,
    rowIndex: number,
    colIndex: number,
    totalRows: number,
    context: RenderCellContext
  ): React.ReactNode {
    if (rowIndex === 0) {
      // 1행: 블록명 (첫 번째 열에만 표시)
      if (colIndex === 0) {
        return this.renderBlockNameCell(block, context, styles);
      } else {
        return <td className={`${styles.emptyCell} ${styles.tableCell}`} />;
      }
    } else if (rowIndex === 1) {
      // 2행: Header 셀들
      return this.renderHeaderCell(block, colIndex, context);
    } else {
      // 3행부터: Body 셀들 (계층 구조 처리)
      return this.renderBodyCell(block, rowIndex - 2, colIndex, context);
    }
  }

  calculateRowSpan(
    block: BlockInstance,
    rowIndex: number,
    colIndex: number
  ): number {
    // Division 블록의 rowspan 계산
    const dbFormat = block.toDbFormat();
    const bodyCell = dbFormat.body_cells?.[rowIndex]?.[colIndex];
    
    if (bodyCell && typeof bodyCell === 'object' && 'rowspan' in bodyCell) {
      return (bodyCell as any).rowspan || 0;
    }
    
    return 1;
  }

  /**
   * Header 셀 렌더링 (Division 블록 특화)
   */
  private renderHeaderCell(
    block: BlockInstance,
    colIndex: number,
    context: RenderCellContext
  ): React.ReactNode {
    const { readOnly, onBlockChange } = context;
    
    // BlockInstance에서 직접 값 가져오기
    const headerValues = block.getHeaderCellValues(colIndex);
    
    // Division 블록의 col_type
    const dbFormat = block.toDbFormat();
    const colType = Array.isArray(dbFormat.header_cells) && dbFormat.header_cells[colIndex] 
      ? dbFormat.header_cells[colIndex] 
      : null;

    return (
      <td key={colIndex} className={styles.tableCell}>
        <div className={styles.headerCell}>
          <Cell
            values={headerValues}
            onChange={(elementIndex, value) => {
              if (readOnly) return;
              // BlockInstance의 메서드로 직접 수정
              block.updateCellValue(-1, colIndex, elementIndex, value);
              // 변경된 BlockInstance를 전달
              onBlockChange?.(block.block_id, block);
            }}
            blockType={block.block_type}
            isHeader={true}
            col_type={colType}
          />
        </div>
      </td>
    );
  }

  /**
   * Body 셀 렌더링 (Division 블록 특화 - 계층 구조, rowspan 처리)
   */
  private renderBodyCell(
    block: BlockInstance,
    bodyRowIndex: number,
    colIndex: number,
    context: RenderCellContext
  ): React.ReactNode {
    const { readOnly, highlightedCaseSet, onBlockChange, onInsertRow } = context;
    
    // rowspan 계산
    const rowSpan = this.calculateRowSpan(block, bodyRowIndex, colIndex);
    
    // rowspan이 0이면 빈 셀 반환
    if (rowSpan === 0) {
      return <td key={colIndex} />;
    }

    // BlockInstance에서 직접 값 가져오기
    const bodyValues = block.getBodyCellValues(bodyRowIndex, colIndex);
    
    // Division 블록의 col_type
    const dbFormat = block.toDbFormat();
    const colType = Array.isArray(dbFormat.header_cells) && dbFormat.header_cells[colIndex] 
      ? dbFormat.header_cells[colIndex] 
      : null;

    // 하이라이트 여부
    const isHighlighted = highlightedCaseSet.has(`${block.block_id}:${bodyRowIndex}`);

    return (
      <td 
        key={colIndex} 
        className={`${styles.tableCell} ${isHighlighted ? styles.bodyCellHighlighted : ''}`} 
        rowSpan={rowSpan > 1 ? rowSpan : undefined}
      >
        <div className={styles.bodyCell}>
          {isHighlighted && (
            <div className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></div>
          )}
          <Cell
            values={bodyValues}
            onChange={(elementIndex, value) => {
              if (readOnly) return;
              // BlockInstance의 메서드로 직접 수정
              block.updateCellValue(bodyRowIndex, colIndex, elementIndex, value);
              // 변경된 BlockInstance를 전달
              onBlockChange?.(block.block_id, block);
            }}
            blockType={block.block_type}
            col_type={colType}
            isHeader={false}
          />
          {!readOnly && (
            <div 
              className={styles.rowAddButton}
              onClick={(e) => {
                e.stopPropagation();
                // BlockInstance의 메서드로 직접 행 추가
                block.addRow(bodyRowIndex);
                // 변경된 BlockInstance를 전달
                onBlockChange?.(block.block_id, block);
              }}
              title="행 추가"
            />
          )}
        </div>
      </td>
    );
  }
}

