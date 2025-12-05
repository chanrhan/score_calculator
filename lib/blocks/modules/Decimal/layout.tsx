// lib/blocks/modules/Decimal/layout.tsx
// C 객체: Decimal 블록의 레이아웃 렌더링 (새로운 방식)

import React from 'react';
import { BlockInstance } from '../../BlockInstance';
import { GenericBlockLayoutRenderer } from '../../layout/GenericBlockLayoutRenderer';
import { RenderCellContext } from '../../layout/BlockLayoutRenderer';
import { LayoutComponent, BlockPropertyValues, getLayoutComponent } from '../common/types';
import { createTokenElement } from '../common/elementHelpers';
import { Token } from '@/components/builder/block_builder/CellElement/Token';
import styles from '@/components/builder/Primitives/ComponentGrid.module.css';
import decimalStyles from './Decimal.module.css';

/**
 * Decimal 블록의 레이아웃 정의
 * 각 열별로 직접 HTML/CSS를 작성하고, 공통 컴포넌트만 사용
 */
export const DecimalLayout: {
  header: LayoutComponent;
  body: LayoutComponent;
} = {
  header: ({ properties, readOnly, onChange }) => {
      const variableScope = properties.variable_scope || '0';
      
      return (
        <div className={decimalStyles.header}>
          <span className={decimalStyles.label}>소수점 처리</span>
          <Token
            element={createTokenElement({
              menu_key: 'variable_scope',
              value: variableScope,
              optional: false,
              visible: true,
            })}
            onChange={(value) => {
              if (!readOnly) {
                onChange?.('variable_scope', value);
              }
            }}
            autoFit={true}
          />
        </div>
      );
    },
  body: ({ properties, readOnly, onChange }) => {
      const scoreType = properties.score_type || 'finalScore';
      const decimalPlaces = properties.decimal_places || '2';
      const decimalOption = properties.decimal_option || '0';
      
      return (
        <div className={decimalStyles.body}>
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
            autoFit={true}
          />
          <span>소수점</span>
          <Token
            element={createTokenElement({
              menu_key: 'decimal_places',
              value: decimalPlaces,
              optional: false,
              visible: true,
            })}
            onChange={(value) => {
              if (!readOnly) {
                onChange?.('decimal_places', value);
              }
            }}
            autoFit={true}
          />
          <span>자리</span>
          <Token
            element={createTokenElement({
              menu_key: 'decimal_options',
              value: decimalOption,
              optional: false,
              visible: true,
            })}
            onChange={(value) => {
              if (!readOnly) {
                onChange?.('decimal_option', value);
              }
            }}
            autoFit={true}
          />
        </div>
      );
    },
};

/**
 * Decimal 블록의 레이아웃 렌더러
 */
export class DecimalLayoutRenderer extends GenericBlockLayoutRenderer {
  protected renderHeaderCell(
    block: BlockInstance,
    colIndex: number,
    context: RenderCellContext
  ): React.ReactNode {
    const { readOnly, onBlockChange } = context;
    
    // 속성 값 직접 가져오기
    const properties = block.getHeaderProperties(colIndex);

    const LayoutComponent = getLayoutComponent(DecimalLayout.header, colIndex);
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

    const LayoutComponent = getLayoutComponent(DecimalLayout.body, colIndex);
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
