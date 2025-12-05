// lib/blocks/modules/TopSubject/layout.tsx
// C 객체: TopSubject 블록의 레이아웃 렌더링 (새로운 방식)

import React from 'react';
import { BlockInstance } from '../../BlockInstance';
import { GenericBlockLayoutRenderer } from '../../layout/GenericBlockLayoutRenderer';
import { RenderCellContext } from '../../layout/BlockLayoutRenderer';
import { LayoutComponent, BlockPropertyValues, getLayoutComponent } from '../common/types';
import { createTokenElement } from '../common/elementHelpers';
import { Token } from '@/components/builder/block_builder/CellElement/Token';
import styles from '@/components/builder/Primitives/ComponentGrid.module.css';
import topSubjectStyles from './TopSubject.module.css';

/**
 * TopSubject 블록의 레이아웃 정의
 * 각 열별로 직접 HTML/CSS를 작성하고, 공통 컴포넌트만 사용
 */
export const TopSubjectLayout: {
  header: LayoutComponent;
  body: LayoutComponent;
} = {
  header: () => <span className={topSubjectStyles.label}>우수 N 과목</span>,
  body: ({ properties, readOnly, onChange }) => {
      const scope = properties.top_subject_scope || 'overall';
      const count = properties.top_subject_count || '3';
      
      return (
        <div className={topSubjectStyles.body}>
          <Token
            element={createTokenElement({
              menu_key: 'top_subject_scope',
              value: scope,
              optional: true,
              visible: true,
            })}
            onChange={(value) => {
              if (!readOnly) {
                onChange?.('top_subject_scope', value);
              }
            }}
            autoFit={true}
          />
          <Token
            element={createTokenElement({
              menu_key: 'top_subject_count',
              value: count,
              optional: false,
              visible: true,
            })}
            onChange={(value) => {
              if (!readOnly) {
                onChange?.('top_subject_count', value);
              }
            }}
            autoFit={true}
          />
        </div>
      );
    },
};

/**
 * TopSubject 블록의 레이아웃 렌더러
 */
export class TopSubjectLayoutRenderer extends GenericBlockLayoutRenderer {
  protected renderHeaderCell(
    block: BlockInstance,
    colIndex: number,
    context: RenderCellContext
  ): React.ReactNode {
    const LayoutComponent = getLayoutComponent(TopSubjectLayout.header, colIndex);
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
    const { readOnly, highlightedCaseSet, onBlockChange } = context;
    
    // 속성 값 직접 가져오기
    const properties = block.getBodyProperties(bodyRowIndex, colIndex);

    const LayoutComponent = getLayoutComponent(TopSubjectLayout.body, colIndex);
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
            onChange={(propertyName, value) => {
              if (readOnly) return;
              block.updateProperty(propertyName, value, bodyRowIndex, colIndex);
              onBlockChange?.(block.block_id, block);
            }}
          />
        </div>
      </td>
    );
  }
}
