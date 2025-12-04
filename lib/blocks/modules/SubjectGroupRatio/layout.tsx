// lib/blocks/modules/SubjectGroupRatio/layout.tsx
// C 객체: SubjectGroupRatio 블록의 레이아웃 렌더링 (새로운 방식)

import React from 'react';
import { BlockInstance } from '../../BlockInstance';
import { GenericBlockLayoutRenderer } from '../../layout/GenericBlockLayoutRenderer';
import { RenderCellContext } from '../../layout/BlockLayoutRenderer';
import { LayoutComponent, BlockPropertyValues } from '../common/types';
import { extractHeaderProperties, extractBodyProperties, PropertyExtractors } from '../common/propertyExtractor';
import { createTokenElement } from '../common/elementHelpers';
import { Token } from '@/components/builder/block_builder/CellElement/Token';
import styles from '@/components/builder/Primitives/ComponentGrid.module.css';
import subjectGroupRatioStyles from './SubjectGroupRatio.module.css';

/**
 * SubjectGroupRatio 블록의 레이아웃 정의
 * 각 열별로 직접 HTML/CSS를 작성하고, 공통 컴포넌트만 사용
 */
export const SubjectGroupRatioLayout: {
  header: { [columnIndex: number]: LayoutComponent };
  body: { [columnIndex: number]: LayoutComponent };
} = {
  header: {
    0: ({ properties, readOnly, tokenMenus = [], onChange }) => {
      const subjectGroup = properties.subject_group || null;
      
      return (
        <Token
          element={createTokenElement({
            menu_key: 'subject_groups',
            value: subjectGroup,
            optional: false,
              visible: true,
            })}
          onChange={(value) => {
            if (!readOnly) {
              onChange?.('subject_group', value);
            }
          }}
          tokenMenus={tokenMenus}
          autoFit={true}
        />
      );
    },
  },
  body: {
    0: ({ properties, readOnly, tokenMenus = [], onChange }) => {
      const ratio = properties.ratio || '100';
      
      return (
        <Token
          element={createTokenElement({
            menu_key: 'percentage_ratio',
            value: ratio,
            optional: false,
              visible: true,
            })}
          onChange={(value) => {
            if (!readOnly) {
              onChange?.('ratio', value);
            }
          }}
          tokenMenus={tokenMenus}
          autoFit={true}
        />
      );
    },
  },
};

/**
 * SubjectGroupRatio 블록의 레이아웃 렌더러
 */
export class SubjectGroupRatioLayoutRenderer extends GenericBlockLayoutRenderer {
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
      colIndex,
      {
        subject_group: (obj: any) => {
          if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
            return obj.subject_group || null;
          }
          if (Array.isArray(obj) && obj[0]) {
            return obj[0] || null;
          }
          return null;
        },
      },
      { subject_group: null }
    );

    const LayoutComponent = SubjectGroupRatioLayout.header[colIndex];
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
              if (propertyName === 'subject_group') {
                block.updateCellValue(-1, colIndex, 0, value);
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
        ratio: (cellData: any) => {
          if (Array.isArray(cellData) && cellData[0]) {
            return cellData[0];
          }
          if (typeof cellData === 'object' && cellData !== null) {
            return cellData.ratio || '100';
          }
          return '100';
        },
      },
      { ratio: '100' }
    );

    const LayoutComponent = SubjectGroupRatioLayout.body[colIndex];
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
              if (propertyName === 'ratio') {
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
