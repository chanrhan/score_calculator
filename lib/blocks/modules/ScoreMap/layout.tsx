// lib/blocks/modules/ScoreMap/layout.tsx
// C 객체: ScoreMap 블록의 레이아웃 렌더링 (새로운 방식)

import React from 'react';
import { BlockInstance } from '../../BlockInstance';
import { GenericBlockLayoutRenderer } from '../../layout/GenericBlockLayoutRenderer';
import { RenderCellContext } from '../../layout/BlockLayoutRenderer';
import { LayoutComponent, BlockPropertyValues } from '../common/types';
import { extractHeaderProperties, extractBodyProperties, PropertyExtractors } from '../common/propertyExtractor';
import { createTokenElement, createTextElement, createTableElement } from '../common/elementHelpers';
import { Token } from '@/components/builder/block_builder/CellElement/Token';
import { Table } from '@/components/builder/block_builder/CellElement/Table';
import { Text } from '@/components/builder/block_builder/CellElement/Text';
import styles from '@/components/builder/Primitives/ComponentGrid.module.css';
import scoreMapStyles from './ScoreMap.module.css';

/**
 * ScoreMap 블록의 레이아웃 정의
 * 각 열별로 직접 HTML/CSS를 작성하고, 공통 컴포넌트만 사용
 */
export const ScoreMapLayout: {
  header: { [columnIndex: number]: LayoutComponent };
  body: { [columnIndex: number]: LayoutComponent };
} = {
  header: {
    0: ({ properties, readOnly, tokenMenus = [], onChange }) => {
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
            tokenMenus={tokenMenus}
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
            tokenMenus={tokenMenus}
            autoFit={true}
          />
        </div>
      );
    },
  },
  body: {
    0: ({ properties, readOnly, tokenMenus = [], onChange }) => {
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
            tokenMenus={tokenMenus}
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
            tokenMenus={tokenMenus}
            autoFit={true}
          />
          <Text
            element={createTextElement({
              content: '→',
              optional: false,
              visible: true,
            })}
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
            tokenMenus={tokenMenus}
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
            tokenMenus={tokenMenus}
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
    const { readOnly, onBlockChange, tokenMenus } = context;
    const dbFormat = block.toDbFormat();
    
    // 속성 값 추출
    const properties = extractHeaderProperties(
      dbFormat,
      0,
      {
        variable_scope: (obj: any) => {
          if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
            return obj.variable_scope || '0';
          }
          if (Array.isArray(obj)) {
            return obj[1] || '0';
          }
          return '0';
        },
        filter_option: (obj: any) => {
          if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
            return obj.filter_option || '0';
          }
          if (Array.isArray(obj)) {
            return obj[2] || '0';
          }
          return '0';
        },
      },
      { variable_scope: '0', filter_option: '0' }
    );

    const LayoutComponent = ScoreMapLayout.header[colIndex];
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
              } else if (propertyName === 'filter_option') {
                block.updateCellValue(-1, colIndex, 2, value);
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
        input_type: (cellData: any) => {
          if (typeof cellData === 'object' && cellData !== null && !Array.isArray(cellData)) {
            return cellData.input_type || 'originalScore';
          }
          if (Array.isArray(cellData)) {
            return cellData[0] || 'originalScore';
          }
          return 'originalScore';
        },
        input_range: (cellData: any) => {
          if (typeof cellData === 'object' && cellData !== null && !Array.isArray(cellData)) {
            return cellData.input_range ?? 1;
          }
          if (Array.isArray(cellData)) {
            return cellData[1] === 'range' ? 1 : 0;
          }
          return 1;
        },
        output_type: (cellData: any) => {
          if (typeof cellData === 'object' && cellData !== null && !Array.isArray(cellData)) {
            return cellData.output_type || 'score';
          }
          if (Array.isArray(cellData)) {
            return cellData[3] || 'score';
          }
          return 'score';
        },
        table: (cellData: any) => {
          if (typeof cellData === 'object' && cellData !== null && !Array.isArray(cellData)) {
            return cellData.table || [];
          }
          if (Array.isArray(cellData)) {
            return cellData[5] || [];
          }
          return [];
        },
      },
      { input_type: 'originalScore', input_range: 1, output_type: 'score', table: [] }
    );

    const LayoutComponent = ScoreMapLayout.body[colIndex];
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
              if (propertyName === 'input_type') {
                block.updateCellValue(bodyRowIndex, colIndex, 0, value);
                onBlockChange?.(block.block_id, block);
              } else if (propertyName === 'input_range') {
                block.updateCellValue(bodyRowIndex, colIndex, 1, value === 1 ? 'range' : 'exact');
                onBlockChange?.(block.block_id, block);
              } else if (propertyName === 'output_type') {
                block.updateCellValue(bodyRowIndex, colIndex, 3, value);
                onBlockChange?.(block.block_id, block);
              } else if (propertyName === 'table') {
                block.updateCellValue(bodyRowIndex, colIndex, 5, value);
                onBlockChange?.(block.block_id, block);
              }
            }}
          />
        </div>
      </td>
    );
  }
}
