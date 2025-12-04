// lib/blocks/modules/Decimal/layout.tsx
// C 객체: Decimal 블록의 레이아웃 렌더링 (새로운 방식)

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
import decimalStyles from './Decimal.module.css';

/**
 * Decimal 블록의 레이아웃 정의
 * 각 열별로 직접 HTML/CSS를 작성하고, 공통 컴포넌트만 사용
 */
export const DecimalLayout: {
  header: { [columnIndex: number]: LayoutComponent };
  body: { [columnIndex: number]: LayoutComponent };
} = {
  header: {
    0: ({ properties, readOnly, tokenMenus = [], onChange }) => {
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
            tokenMenus={tokenMenus}
            autoFit={true}
          />
        </div>
      );
    },
  },
  body: {
    0: ({ properties, readOnly, tokenMenus = [], onChange }) => {
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
            tokenMenus={tokenMenus}
            autoFit={true}
          />
          <Text
            element={createTextElement({
              content: '소수점',
              optional: false,
              visible: true,
            })}
          />
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
            tokenMenus={tokenMenus}
            autoFit={true}
          />
          <Text
            element={createTextElement({
              content: '자리',
              optional: false,
              visible: true,
            })}
          />
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
            tokenMenus={tokenMenus}
            autoFit={true}
          />
        </div>
      );
    },
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

    const LayoutComponent = DecimalLayout.header[colIndex];
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
        score_type: (cellData: any) => {
          if (Array.isArray(cellData)) {
            return cellData[0] || 'finalScore';
          }
          if (typeof cellData === 'object' && cellData !== null) {
            return cellData.score_type || 'finalScore';
          }
          return 'finalScore';
        },
        decimal_places: (cellData: any) => {
          if (Array.isArray(cellData)) {
            return cellData[2] || '2';
          }
          if (typeof cellData === 'object' && cellData !== null) {
            return cellData.decimal_places || '2';
          }
          return '2';
        },
        decimal_option: (cellData: any) => {
          if (Array.isArray(cellData)) {
            return cellData[4] || '0';
          }
          if (typeof cellData === 'object' && cellData !== null) {
            return cellData.decimal_option || '0';
          }
          return '0';
        },
      },
      { score_type: 'finalScore', decimal_places: '2', decimal_option: '0' }
    );

    const LayoutComponent = DecimalLayout.body[colIndex];
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
                'score_type': 0,
                'decimal_places': 2,
                'decimal_option': 4,
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
