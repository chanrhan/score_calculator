// lib/blocks/modules/Aggregation/layout.tsx
// C 객체: Aggregation 블록의 레이아웃 렌더링 (새로운 방식)

import React from 'react';
import { BlockInstance } from '../../BlockInstance';
import { GenericBlockLayoutRenderer } from '../../layout/GenericBlockLayoutRenderer';
import { RenderCellContext } from '../../layout/BlockLayoutRenderer';
import { LayoutComponent, BlockPropertyValues } from '../common/types';
import { extractHeaderProperties, extractBodyProperties, PropertyExtractors } from '../common/propertyExtractor';
import { createTokenElement, createTextElement } from '../common/elementHelpers';
import { Token } from '@/components/builder/block_builder/CellElement/Token';
import { Text } from '@/components/builder/block_builder/CellElement/Text';
import styles from '@/components/builder/Primitives/ComponentGrid.module.css';
import aggregationStyles from './Aggregation.module.css';

/**
 * Aggregation 블록의 레이아웃 정의
 * 각 열별로 직접 HTML/CSS를 작성하고, 공통 컴포넌트만 사용
 */
export const AggregationLayout: {
  header: { [columnIndex: number]: LayoutComponent };
  body: { [columnIndex: number]: LayoutComponent };
} = {
  header: {
    0: ({ properties, readOnly, tokenMenus = [], onChange }) => {
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
            tokenMenus={tokenMenus}
            autoFit={true}
          />
        </div>
      );
    },
  },
  body: {
    0: ({ properties, readOnly, tokenMenus = [], onChange }) => {
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
            tokenMenus={tokenMenus}
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
            tokenMenus={tokenMenus}
            autoFit={true}
          />
          <Text
            element={createTextElement({
              content: '→',
              optional: false,
              visible: true,
            })}
          />
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
            tokenMenus={tokenMenus}
            autoFit={true}
          />
        </div>
      );
    },
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

    const LayoutComponent = AggregationLayout.header[colIndex];
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
        input_score_type: (cellData: any) => {
          if (Array.isArray(cellData)) {
            return cellData[0] || 'finalScore';
          }
          if (typeof cellData === 'object' && cellData !== null) {
            return cellData.input_score_type || 'finalScore';
          }
          return 'finalScore';
        },
        aggregation_function: (cellData: any) => {
          if (Array.isArray(cellData)) {
            return cellData[1] || '0';
          }
          if (typeof cellData === 'object' && cellData !== null) {
            return cellData.aggregation_function || '0';
          }
          return '0';
        },
        output_score_type: (cellData: any) => {
          if (Array.isArray(cellData)) {
            return cellData[3] || 'finalScore';
          }
          if (typeof cellData === 'object' && cellData !== null) {
            return cellData.output_score_type || 'finalScore';
          }
          return 'finalScore';
        },
      },
      { input_score_type: 'finalScore', aggregation_function: '0', output_score_type: 'finalScore' }
    );

    const LayoutComponent = AggregationLayout.body[colIndex];
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
              const indexMap: Record<string, number> = {
                'input_score_type': 0,
                'aggregation_function': 1,
                'output_score_type': 3,
              };
              const elementIndex = indexMap[propertyName];
              if (elementIndex !== undefined) {
                block.updateCellValue(bodyRowIndex, colIndex, elementIndex, value);
                onBlockChange?.(block.block_id, block);
              }
            }}
          />
        </div>
      </td>
    );
  }
}
