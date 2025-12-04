// lib/blocks/modules/Condition/layout.tsx
// C 객체: Condition 블록의 레이아웃 렌더링 (새로운 방식)

import React from 'react';
import { BlockInstance } from '../../BlockInstance';
import { GenericBlockLayoutRenderer } from '../../layout/GenericBlockLayoutRenderer';
import { RenderCellContext } from '../../layout/BlockLayoutRenderer';
import { LayoutComponent, BlockPropertyValues } from '../common/types';
import { extractHeaderProperties, extractBodyProperties, PropertyExtractors } from '../common/propertyExtractor';
import { createTokenElement, createConditionChainElement } from '../common/elementHelpers';
import { Token } from '@/components/builder/block_builder/CellElement/Token';
import { ConditionChain } from '@/components/builder/block_builder/CellElement/ConditionChain';
import styles from '@/components/builder/Primitives/ComponentGrid.module.css';
import conditionStyles from './Condition.module.css';

/**
 * Condition 블록의 레이아웃 정의
 * 각 열별로 직접 HTML/CSS를 작성하고, 공통 컴포넌트만 사용
 */
export const ConditionLayout: {
  header: { [columnIndex: number]: LayoutComponent };
  body: { [columnIndex: number]: LayoutComponent };
} = {
  header: {
    0: ({ properties, readOnly, tokenMenus = [], onChange }) => {
      const variableScope = properties.variable_scope || '0';
      
      return (
        <div className={conditionStyles.header}>
          <span className={conditionStyles.label}>조건</span>
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
            tokenMenus={tokenMenus}
            autoFit={true}
          />
        </div>
      );
    },
  },
  body: {
    0: ({ properties, readOnly, tokenMenus = [], onChange }) => {
      const conditions = properties.conditions || [];
      
      return (
        <div className={conditionStyles.body}>
          <ConditionChain
            element={createConditionChainElement({
              item_type: [
                { type: 'Token', menu_key: 'score_types' },
                { type: 'Token', menu_key: 'operators' },
                { type: 'InputField' },
              ],
              value: conditions,
              optional: false,
              visible: true,
            })}
            onChange={(value) => {
              if (!readOnly) {
                onChange?.('conditions', value);
              }
            }}
            tokenMenus={tokenMenus}
          />
        </div>
      );
    },
  },
};

/**
 * Condition 블록의 레이아웃 렌더러
 */
export class ConditionLayoutRenderer extends GenericBlockLayoutRenderer {
  protected renderHeaderCell(
    block: BlockInstance,
    colIndex: number,
    context: RenderCellContext
  ): React.ReactNode {
    const { readOnly, onBlockChange, tokenMenus } = context;
    const dbFormat = block.toDbFormat();
    
    // 속성 값 추출
    const properties = extractHeaderProperties(
      dbFormat,
      0,
      {
        variable_scope: PropertyExtractors.direct('variable_scope', '0'),
      },
      { variable_scope: '0' }
    );

    const LayoutComponent = ConditionLayout.header[colIndex];
    if (!LayoutComponent) {
      return <td key={colIndex} className={styles.tableCell}><div className={styles.headerCell} /></td>;
    }

    return (
      <td key={colIndex} className={styles.tableCell}>
        <div className={styles.headerCell}>
          <LayoutComponent
            properties={properties}
            readOnly={readOnly || false}
            tokenMenus={tokenMenus}
            onChange={(propertyName, value) => {
              if (readOnly) return;
              if (propertyName === 'variable_scope') {
                block.updateCellValue(-1, colIndex, 1, value);
                onBlockChange?.(block.block_id, block);
              }
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
    const { readOnly, highlightedCaseSet, onBlockChange, tokenMenus } = context;
    const dbFormat = block.toDbFormat();
    
    // 속성 값 추출
    const properties = extractBodyProperties(
      dbFormat,
      bodyRowIndex,
      colIndex,
      {
        conditions: (cellData: any) => {
          if (typeof cellData === 'object' && cellData !== null && !Array.isArray(cellData)) {
            return cellData.conditions || [];
          }
          if (Array.isArray(cellData)) {
            return cellData[0] || [];
          }
          return [];
        },
      },
      { conditions: [] }
    );

    const LayoutComponent = ConditionLayout.body[colIndex];
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
              if (propertyName === 'conditions') {
                block.updateCellValue(bodyRowIndex, colIndex, 0, value);
                onBlockChange?.(block.block_id, block);
              }
            }}
          />
        </div>
      </td>
    );
  }
}
