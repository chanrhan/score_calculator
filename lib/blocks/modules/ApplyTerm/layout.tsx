// lib/blocks/modules/ApplyTerm/layout.tsx
// C 객체: ApplyTerm 블록의 레이아웃 렌더링 (새로운 방식)

import React from 'react';
import { BlockInstance } from '../../BlockInstance';
import { GenericBlockLayoutRenderer } from '../../layout/GenericBlockLayoutRenderer';
import { RenderCellContext } from '../../layout/BlockLayoutRenderer';
import { LayoutComponent, BlockPropertyValues, getLayoutComponent } from '../common/types';
import { createTokenElement } from '../common/elementHelpers';
import { Token } from '@/components/builder/block_builder/CellElement/Token';
import { TOKEN_MENU_KEYS } from '@/lib/data/token-menus';
import styles from '@/components/builder/Primitives/ComponentGrid.module.css';
import applyTermStyles from './ApplyTerm.module.css';

/**
 * ApplyTerm 블록의 레이아웃 정의
 * 각 열별로 직접 HTML/CSS를 작성하고, 공통 컴포넌트만 사용
 */
export const ApplyTermLayout: {
  header: LayoutComponent;
  body: LayoutComponent;
} = {
  header: ({ properties, readOnly, onChange }) => {
      const includeOption = properties.include_option || 'include';
      
      return (
        <div className={applyTermStyles.header}>
          <span className={applyTermStyles.label}>반영학기</span>
          <Token
            element={createTokenElement({
              menu_key: TOKEN_MENU_KEYS.INCLUDE_EXCLUDE,
              value: includeOption,
              optional: false,
              visible: true,
            })}
            onChange={(value) => {
              if (!readOnly) {
                onChange?.('include_option', value);
              }
            }}
            autoFit={true}
          />
        </div>
      );
    },
  body: ({ properties, readOnly, onChange }) => {
      const term1_1 = properties.term_1_1 || '1-1:on';
      const term1_2 = properties.term_1_2 || '1-2:on';
      const term2_1 = properties.term_2_1 || '2-1:on';
      const term2_2 = properties.term_2_2 || '2-2:on';
      const term3_1 = properties.term_3_1 || '3-1:on';
      const term3_2 = properties.term_3_2 || '3-2:on';
      const topTerms = properties.top_terms || null;
      
      return (
        <div className={applyTermStyles.body}>
          <span className={applyTermStyles.label}>학기 선택</span>
          <Token
            element={createTokenElement({
              menu_key: 'term_1_1',
              value: term1_1,
              optional: false,
              visible: true,
            })}
            onChange={(value) => {
              if (!readOnly) {
                onChange?.('term_1_1', value);
              }
            }}
            autoFit={true}
          />
          <Token
            element={createTokenElement({
              menu_key: 'term_1_2',
              value: term1_2,
              optional: false,
              visible: true,
            })}
            onChange={(value) => {
              if (!readOnly) {
                onChange?.('term_1_2', value);
              }
            }}
            autoFit={true}
          />
          <Token
            element={createTokenElement({
              menu_key: 'term_2_1',
              value: term2_1,
              optional: false,
              visible: true,
            })}
            onChange={(value) => {
              if (!readOnly) {
                onChange?.('term_2_1', value);
              }
            }}
            autoFit={true}
          />
          <Token
            element={createTokenElement({
              menu_key: 'term_2_2',
              value: term2_2,
              optional: false,
              visible: true,
            })}
            onChange={(value) => {
              if (!readOnly) {
                onChange?.('term_2_2', value);
              }
            }}
            autoFit={true}
          />
          <Token
            element={createTokenElement({
              menu_key: 'term_3_1',
              value: term3_1,
              optional: false,
              visible: true,
            })}
            onChange={(value) => {
              if (!readOnly) {
                onChange?.('term_3_1', value);
              }
            }}
            autoFit={true}
          />
          <Token
            element={createTokenElement({
              menu_key: 'term_3_2',
              value: term3_2,
              optional: false,
              visible: true,
            })}
            onChange={(value) => {
              if (!readOnly) {
                onChange?.('term_3_2', value);
              }
            }}
            autoFit={true}
          />
          {topTerms !== null && (
            <Token
              element={{
                type: 'Token',
                menu_key: 'top_terms',
                value: topTerms,
                optional: true,
                visible: true,
              }}
              onChange={(value) => {
                if (!readOnly) {
                  onChange?.('top_terms', value);
                }
              }}
              autoFit={true}
            />
          )}
        </div>
      );
    },
};

/**
 * ApplyTerm 블록의 레이아웃 렌더러
 */
export class ApplyTermLayoutRenderer extends GenericBlockLayoutRenderer {
  protected renderHeaderCell(
    block: BlockInstance,
    colIndex: number,
    context: RenderCellContext
  ): React.ReactNode {
    const { readOnly, onBlockChange } = context;
    
    // 속성 값 직접 가져오기
    const properties = block.getHeaderProperties(colIndex);

    const LayoutComponent = getLayoutComponent(ApplyTermLayout.header, colIndex);
    if (!LayoutComponent) {
      return <td key={colIndex} className={styles.tableCell}><div className={styles.headerCell} /></td>;
    }

    return (
      <td key={colIndex} className={styles.tableCell}>
        <div className={styles.headerCell}>
          <LayoutComponent
            properties={properties}
            readOnly={readOnly || false}
            onChange={(propertyName, value) => {
              if (readOnly) return;
              block.updateProperty(propertyName, value, undefined, colIndex);
              onBlockChange?.(block.block_id, block);
            }}
          />
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

    const LayoutComponent = getLayoutComponent(ApplyTermLayout.body, colIndex);
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
