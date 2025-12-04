// lib/blocks/modules/Ratio/layout.tsx
// C 객체: Ratio 블록의 레이아웃 렌더링 (새로운 방식)

import React from 'react';
import { BlockInstance } from '../../BlockInstance';
import { GenericBlockLayoutRenderer } from '../../layout/GenericBlockLayoutRenderer';
import { RenderCellContext } from '../../layout/BlockLayoutRenderer';
import { LayoutComponent, BlockPropertyValues } from '../common/types';
import { extractBodyProperties, PropertyExtractors } from '../common/propertyExtractor';
import { createTokenElement } from '../common/elementHelpers';
import { Token } from '@/components/builder/block_builder/CellElement/Token';
import styles from '@/components/builder/Primitives/ComponentGrid.module.css';
import ratioStyles from './Ratio.module.css';

/**
 * Ratio 블록의 레이아웃 정의
 * 각 열별로 직접 HTML/CSS를 작성하고, 공통 컴포넌트만 사용
 */
export const RatioLayout: {
  header: { [columnIndex: number]: LayoutComponent };
  body: { [columnIndex: number]: LayoutComponent };
} = {
  header: {
    0: () => <span className={ratioStyles.label}>반영비율</span>,
  },
  body: {
    0: ({ properties, readOnly, tokenMenus = [], onChange }) => {
      const ratio = properties.ratio || '100';
      const scoreType = properties.score_type || 'finalScore';
      
      return (
        <div className={ratioStyles.body}>
          <Token
            element={createTokenElement({
              menu_key: 'percentage_ratio',
              value: ratio,
              optional: false,
              visible: true,
            })}
            onChange={(value) => {
              if (!readOnly) {
                onChange?.('ratio', value);
              }
            }}
            tokenMenus={tokenMenus}
            autoFit={true}
          />
          <Token
            element={createTokenElement({
              menu_key: 'score_types',
              value: scoreType,
              optional: false,
              visible: true,
            })}
            onChange={(value) => {
              if (!readOnly) {
                onChange?.('score_type', value);
              }
            }}
            tokenMenus={tokenMenus}
            autoFit={true}
          />
        </div>
      );
    },
  },
};

/**
 * Ratio 블록의 레이아웃 렌더러
 */
export class RatioLayoutRenderer extends GenericBlockLayoutRenderer {
  protected renderHeaderCell(
    block: BlockInstance,
    colIndex: number,
    context: RenderCellContext
  ): React.ReactNode {
    const LayoutComponent = RatioLayout.header[colIndex];
    if (!LayoutComponent) {
      return <td key={colIndex} className={styles.tableCell}><div className={styles.headerCell} /></td>;
    }

    return (
      <td key={colIndex} className={styles.tableCell}>
        <div className={styles.headerCell}>
          <LayoutComponent properties={{}} readOnly={false} />
        </div>
      </td>
    );
  }

  protected renderBodyCell(
    block: BlockInstance,
    bodyRowIndex: number,
    colIndex: number,
    context: RenderCellContext
  ): React.ReactNode {
    const { readOnly, highlightedCaseSet, onBlockChange, tokenMenus } = context;
    const dbFormat = block.toDbFormat();
    
    // 속성 값 추출
    const properties = extractBodyProperties(
      dbFormat,
      bodyRowIndex,
      colIndex,
      {
        ratio: (cellData: any) => {
          if (Array.isArray(cellData)) {
            return cellData[0] || '100';
          }
          if (typeof cellData === 'object' && cellData !== null) {
            return cellData.ratio || '100';
          }
          return '100';
        },
        score_type: (cellData: any) => {
          if (Array.isArray(cellData)) {
            return cellData[1] || 'finalScore';
          }
          if (typeof cellData === 'object' && cellData !== null) {
            return cellData.score_type || 'finalScore';
          }
          return 'finalScore';
        },
      },
      { ratio: '100', score_type: 'finalScore' }
    );

    const LayoutComponent = RatioLayout.body[colIndex];
    if (!LayoutComponent) {
      return <td key={colIndex} className={styles.tableCell}><div className={styles.bodyCell} /></td>;
    }

    const isHighlighted = highlightedCaseSet.has(`${block.block_id}:${bodyRowIndex}`);

    return (
      <td 
        key={colIndex} 
        className={`${styles.tableCell} ${isHighlighted ? styles.bodyCellHighlighted : ''}`}
      >
        <div className={styles.bodyCell}>
          {isHighlighted && (
            <div className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></div>
          )}
          <LayoutComponent
            properties={properties}
            readOnly={readOnly || false}
            tokenMenus={tokenMenus}
            onChange={(propertyName, value) => {
              if (readOnly) return;
              if (propertyName === 'ratio') {
                block.updateCellValue(bodyRowIndex, colIndex, 0, value);
                onBlockChange?.(block.block_id, block);
              } else if (propertyName === 'score_type') {
                block.updateCellValue(bodyRowIndex, colIndex, 1, value);
                onBlockChange?.(block.block_id, block);
              }
            }}
          />
        </div>
      </td>
    );
  }
}
