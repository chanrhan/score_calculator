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
      const variableScope = properties.variable_scope || '0';
      const filterOption = properties.filter_option || '0';
      
      return (
        <div className={scoreMapStyles.header}>
          <span className={scoreMapStyles.label}>배점표</span>
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
          <Token
            element={createTokenElement({
              menu_key: 'filter_option',
              value: filterOption,
              optional: false,
              visible: true,
            })}
            onChange={(value) => {
              if (!readOnly) {
                onChange?.('filter_option', value);
              }
            }}
            autoFit={true}
          />
        </div>
      );
    },
  body: ({ properties, readOnly, onChange }) => {
      const inputType = properties.input_type || 'originalScore';
      const inputRange = properties.input_range === 1 ? 'range' : 'exact';
      const outputType = properties.output_type || 'score';
      const table = properties.table || [];
      
      return (
        <div className={scoreMapStyles.body}>
          <Token
            element={{
              type: 'Token',
              menu_key: 'score_types',
              value: inputType,
              optional: false,
              visible: true,
            }}
            onChange={(value) => {
              if (!readOnly) {
                onChange?.('input_type', value);
              }
            }}
            autoFit={true}
          />
          <Token
            element={{
              type: 'Token',
              menu_key: 'match_types',
              value: inputRange,
              optional: false,
              visible: true,
            }}
            onChange={(value) => {
              if (!readOnly) {
                onChange?.('input_range', value === 'range' ? 1 : 0);
              }
            }}
            autoFit={true}
          />
          <span>→</span>
          <Token
            element={{
              type: 'Token',
              menu_key: 'score_types',
              value: outputType,
              optional: false,
              visible: true,
            }}
            onChange={(value) => {
              if (!readOnly) {
                onChange?.('output_type', value);
              }
            }}
            autoFit={true}
          />
          <Token
            element={{
              type: 'Token',
              menu_key: 'match_types',
              value: 'exact',
              optional: false,
              visible: true,
            }}
            onChange={() => {}}
            autoFit={true}
          />
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
                onChange?.('table', value);
              }
            }}
          />
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
