// lib/blocks/modules/ApplyTerm/layout.tsx
// C 객체: ApplyTerm 블록의 레이아웃 렌더링 (새로운 방식)

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
import applyTermStyles from './ApplyTerm.module.css';

/**
 * ApplyTerm 블록의 레이아웃 정의
 * 각 열별로 직접 HTML/CSS를 작성하고, 공통 컴포넌트만 사용
 */
export const ApplyTermLayout: {
  header: { [columnIndex: number]: LayoutComponent };
  body: { [columnIndex: number]: LayoutComponent };
} = {
  header: {
    0: ({ properties, readOnly, tokenMenus = [], onChange }) => {
      const includeOption = properties.include_option || 'include';
      
      return (
        <div className={applyTermStyles.header}>
          <span className={applyTermStyles.label}>반영학기</span>
          <Token
            element={createTokenElement({
              menu_key: 'include_exclude',
              value: includeOption,
              optional: false,
              visible: true,
            })}
            onChange={(value) => {
              if (!readOnly) {
                onChange?.('include_option', value);
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
            tokenMenus={tokenMenus}
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
            tokenMenus={tokenMenus}
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
            tokenMenus={tokenMenus}
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
            tokenMenus={tokenMenus}
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
            tokenMenus={tokenMenus}
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
            tokenMenus={tokenMenus}
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
              tokenMenus={tokenMenus}
              autoFit={true}
            />
          )}
        </div>
      );
    },
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
    const { readOnly, onBlockChange, tokenMenus } = context;
    const dbFormat = block.toDbFormat();
    
    // 속성 값 추출
    const properties = extractHeaderProperties(
      dbFormat,
      0,
      {
        include_option: (obj: any) => {
          if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
            return obj.include_option || 'include';
          }
          if (Array.isArray(obj)) {
            return obj[1] || 'include';
          }
          return 'include';
        },
      },
      { include_option: 'include' }
    );

    const LayoutComponent = ApplyTermLayout.header[colIndex];
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
              if (propertyName === 'include_option') {
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
        term_1_1: (cellData: any) => {
          if (Array.isArray(cellData)) {
            return cellData[1] || '1-1:on';
          }
          if (typeof cellData === 'object' && cellData !== null) {
            return cellData.term_1_1 || '1-1:on';
          }
          return '1-1:on';
        },
        term_1_2: (cellData: any) => {
          if (Array.isArray(cellData)) {
            return cellData[2] || '1-2:on';
          }
          if (typeof cellData === 'object' && cellData !== null) {
            return cellData.term_1_2 || '1-2:on';
          }
          return '1-2:on';
        },
        term_2_1: (cellData: any) => {
          if (Array.isArray(cellData)) {
            return cellData[3] || '2-1:on';
          }
          if (typeof cellData === 'object' && cellData !== null) {
            return cellData.term_2_1 || '2-1:on';
          }
          return '2-1:on';
        },
        term_2_2: (cellData: any) => {
          if (Array.isArray(cellData)) {
            return cellData[4] || '2-2:on';
          }
          if (typeof cellData === 'object' && cellData !== null) {
            return cellData.term_2_2 || '2-2:on';
          }
          return '2-2:on';
        },
        term_3_1: (cellData: any) => {
          if (Array.isArray(cellData)) {
            return cellData[5] || '3-1:on';
          }
          if (typeof cellData === 'object' && cellData !== null) {
            return cellData.term_3_1 || '3-1:on';
          }
          return '3-1:on';
        },
        term_3_2: (cellData: any) => {
          if (Array.isArray(cellData)) {
            return cellData[6] || '3-2:on';
          }
          if (typeof cellData === 'object' && cellData !== null) {
            return cellData.term_3_2 || '3-2:on';
          }
          return '3-2:on';
        },
        top_terms: (cellData: any) => {
          if (Array.isArray(cellData)) {
            return cellData[7] || null;
          }
          if (typeof cellData === 'object' && cellData !== null) {
            return cellData.top_terms || null;
          }
          return null;
        },
      },
      { term_1_1: '1-1:on', term_1_2: '1-2:on', term_2_1: '2-1:on', term_2_2: '2-2:on', term_3_1: '3-1:on', term_3_2: '3-2:on', top_terms: null }
    );

    const LayoutComponent = ApplyTermLayout.body[colIndex];
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
              const termIndexMap: Record<string, number> = {
                'term_1_1': 1,
                'term_1_2': 2,
                'term_2_1': 3,
                'term_2_2': 4,
                'term_3_1': 5,
                'term_3_2': 6,
                'top_terms': 7,
              };
              const elementIndex = termIndexMap[propertyName];
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
