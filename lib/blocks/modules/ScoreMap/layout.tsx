// lib/blocks/modules/ScoreMap/layout.tsx
// C 객체: ScoreMap 블록의 레이아웃 렌더링 (새로운 방식)

import React from 'react';
import { BlockInstance } from '../../BlockInstance';
import { GenericBlockLayoutRenderer } from '../../layout/GenericBlockLayoutRenderer';
import { RenderCellContext } from '../../layout/BlockLayoutRenderer';
import { LayoutComponent, BlockPropertyValues, getLayoutComponent } from '../common/types';
import { createTokenElement, createTableElement } from '../common/elementHelpers';
import { Token } from '@/components/builder/block_builder/CellElement/Token';
import { Table } from '@/components/builder/block_builder/CellElement/Table';
import { TOKEN_MENU_KEYS } from '@/lib/data/token-menus';
import styles from '@/components/builder/Primitives/ComponentGrid.module.css';
import scoreMapStyles from './ScoreMap.module.css';

/**
 * ScoreMap 블록의 레이아웃 정의
 * 각 열별로 직접 HTML/CSS를 작성하고, 공통 컴포넌트만 사용
 */
export const ScoreMapLayout: {
  header: LayoutComponent;
  body: LayoutComponent;
} = {
  header: ({ properties, readOnly, onChange }) => {
      const varScope = properties.var_scope || '0';
      
      return (
        <div className={scoreMapStyles.header}>
          <span className={scoreMapStyles.label}>배점표</span>
          <Token
            element={createTokenElement({
              menu_key: TOKEN_MENU_KEYS.VAR_SCOPE,
              value: varScope,
              optional: false,
              visible: true,
            })}
            onChange={(value) => {
              if (!readOnly) {
                onChange?.('var_scope', value);
              }
            }}
            autoFit={true}
          />
        </div>
      );
    },
  body: ({ properties, readOnly, onChange }) => {
      const inputProp = properties.input_prop || 'originalScore';
      const outputProp = properties.output_prop || 'score';
      const table = properties.table || [];
      
      return (
        <div className={scoreMapStyles.body}>
          <div className={scoreMapStyles.row}>
            <Token
              element={createTokenElement({
                menu_key: TOKEN_MENU_KEYS.SCORE_TYPE,
                value: inputProp,
                optional: false,
                visible: true,
              })}
              onChange={(value) => {
                if (!readOnly) {
                  onChange?.('input_prop', value);
                }
              }}
              autoFit={true}
            />
            <span className={scoreMapStyles.arrow}>→</span>
            <Token
              element={createTokenElement({
                menu_key: TOKEN_MENU_KEYS.SCORE_TYPE,
                value: outputProp,
                optional: false,
                visible: true,
              })}
              onChange={(value) => {
                if (!readOnly) {
                  onChange?.('output_prop', value);
                }
              }}
              autoFit={true}
            />
          </div>
          <div className={scoreMapStyles.row}>
            <Table
              element={createTableElement({
                init_rows: 2,
                init_cols: 3,
                input_type: '원점수',
                input_option: 'range',
                output_type: '배점',
                value: table,
                optional: false,
                visible: true,
              })}
              onChange={(value) => {
                if (!readOnly) {
                  onChange?.('table', Array.isArray(value) ? value : []);
                }
              }}
            />
          </div>
        </div>
      );
    },
};

/**
 * ScoreMap 블록의 레이아웃 렌더러
 */
export class ScoreMapLayoutRenderer extends GenericBlockLayoutRenderer {
  protected renderHeaderCell(
    block: BlockInstance,
    colIndex: number,
    context: RenderCellContext
  ): React.ReactNode {
    const { readOnly, onBlockChange } = context;
    
    // 속성 값 직접 가져오기
    const properties = block.getHeaderProperties(colIndex);

    const LayoutComponent = getLayoutComponent(ScoreMapLayout.header, colIndex);
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

    const LayoutComponent = getLayoutComponent(ScoreMapLayout.body, colIndex);
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
