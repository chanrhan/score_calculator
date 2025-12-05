// lib/blocks/modules/Aggregation/layout.tsx
// C 객체: Aggregation 블록의 레이아웃 렌더링 (새로운 방식)

import React from 'react';
import { BlockInstance } from '../../BlockInstance';
import { GenericBlockLayoutRenderer } from '../../layout/GenericBlockLayoutRenderer';
import { RenderCellContext } from '../../layout/BlockLayoutRenderer';
import { LayoutComponent, BlockPropertyValues, getLayoutComponent } from '../common/types';
import { createTokenElement } from '../common/elementHelpers';
import { Token } from '@/components/builder/block_builder/CellElement/Token';
import styles from '@/components/builder/Primitives/ComponentGrid.module.css';
import aggregationStyles from './Aggregation.module.css';

/**
 * Aggregation 블록의 레이아웃 정의
 * 각 열별로 직접 HTML/CSS를 작성하고, 공통 컴포넌트만 사용
 */
export const AggregationLayout: {
  header: LayoutComponent;
  body: LayoutComponent;
} = {
  header: ({ properties, readOnly, onChange }) => {
      const variableScope = properties.variable_scope || '0';
      
      return (
        <div className={aggregationStyles.header}>
          <span className={aggregationStyles.label}>집계</span>
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
      const inputScoreType = properties.input_score_type || 'finalScore';
      const aggregationFunction = properties.aggregation_function || '0';
      const outputScoreType = properties.output_score_type || 'finalScore';
      
      return (
        <div className={aggregationStyles.body}>
          <Token
            element={createTokenElement({
              menu_key: 'score_types',
              value: inputScoreType,
              optional: false,
              visible: true,
            })}
            onChange={(value) => {
              if (!readOnly) {
                onChange?.('input_score_type', value);
              }
            }}
            autoFit={true}
          />
          <Token
            element={createTokenElement({
              menu_key: 'aggregation_functions',
              value: aggregationFunction,
              optional: false,
              visible: true,
            })}
            onChange={(value) => {
              if (!readOnly) {
                onChange?.('aggregation_function', value);
              }
            }}
            autoFit={true}
          />
          <span>→</span>
          <Token
            element={createTokenElement({
              menu_key: 'score_types',
              value: outputScoreType,
              optional: false,
              visible: true,
            })}
            onChange={(value) => {
              if (!readOnly) {
                onChange?.('output_score_type', value);
              }
            }}
            autoFit={true}
          />
        </div>
      );
    },
};

/**
 * Aggregation 블록의 레이아웃 렌더러
 */
export class AggregationLayoutRenderer extends GenericBlockLayoutRenderer {
  protected renderHeaderCell(
    block: BlockInstance,
    colIndex: number,
    context: RenderCellContext
  ): React.ReactNode {
    const { readOnly, onBlockChange } = context;
    
    // 속성 값 직접 가져오기
    const properties = block.getHeaderProperties(colIndex);

    const LayoutComponent = getLayoutComponent(AggregationLayout.header, colIndex);
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

    const LayoutComponent = getLayoutComponent(AggregationLayout.body, colIndex);
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
