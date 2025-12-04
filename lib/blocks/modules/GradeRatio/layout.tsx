// lib/blocks/modules/GradeRatio/layout.tsx
// C 객체: GradeRatio 블록의 레이아웃 렌더링 (새로운 방식)

import React from 'react';
import { BlockInstance } from '../../BlockInstance';
import { GenericBlockLayoutRenderer } from '../../layout/GenericBlockLayoutRenderer';
import { RenderCellContext } from '../../layout/BlockLayoutRenderer';
import { LayoutComponent, BlockPropertyValues } from '../common/types';
import { extractBodyProperties, PropertyExtractors } from '../common/propertyExtractor';
import { createTokenElement } from '../common/elementHelpers';
import { Token } from '@/components/builder/block_builder/CellElement/Token';
import styles from '@/components/builder/Primitives/ComponentGrid.module.css';
import gradeRatioStyles from './GradeRatio.module.css';

/**
 * GradeRatio 블록의 레이아웃 정의
 * 각 열별로 직접 HTML/CSS를 작성하고, 공통 컴포넌트만 사용
 */
export const GradeRatioLayout: {
  header: { [columnIndex: number]: LayoutComponent };
  body: { [columnIndex: number]: LayoutComponent };
} = {
  header: {
    0: () => <span className={gradeRatioStyles.label}>1학년</span>,
    1: () => <span className={gradeRatioStyles.label}>2학년</span>,
    2: () => <span className={gradeRatioStyles.label}>3학년</span>,
  },
  body: {
    0: ({ properties, readOnly, tokenMenus = [], onChange }) => {
      const ratio = properties.grade1_ratio || '100';
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
              onChange?.('grade1_ratio', value);
            }
          }}
          tokenMenus={tokenMenus}
          autoFit={true}
        />
      );
    },
    1: ({ properties, readOnly, tokenMenus = [], onChange }) => {
      const ratio = properties.grade2_ratio || '100';
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
              onChange?.('grade2_ratio', value);
            }
          }}
          tokenMenus={tokenMenus}
          autoFit={true}
        />
      );
    },
    2: ({ properties, readOnly, tokenMenus = [], onChange }) => {
      const ratio = properties.grade3_ratio || '100';
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
              onChange?.('grade3_ratio', value);
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
 * GradeRatio 블록의 레이아웃 렌더러
 */
export class GradeRatioLayoutRenderer extends GenericBlockLayoutRenderer {
  protected renderHeaderCell(
    block: BlockInstance,
    colIndex: number,
    context: RenderCellContext
  ): React.ReactNode {
    const LayoutComponent = GradeRatioLayout.header[colIndex];
    if (!LayoutComponent) {
      return <td key={colIndex} className={styles.tableCell}><div className={styles.headerCell} /></td>;
    }

    return (
      <td key={colIndex} className={styles.tableCell}>
        <div className={styles.headerCell}>
          <LayoutComponent properties={{}} readOnly={false} />
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
    const ratioKey = `grade${colIndex + 1}_ratio`;
    const properties = extractBodyProperties(
      dbFormat,
      bodyRowIndex,
      colIndex,
      {
        [ratioKey]: (cellData: any) => {
          if (Array.isArray(cellData) && cellData[0]) {
            return cellData[0];
          }
          if (typeof cellData === 'object' && cellData !== null) {
            return (cellData as any)[ratioKey] || '100';
          }
          return '100';
        },
      },
      { [ratioKey]: '100' }
    );

    const LayoutComponent = GradeRatioLayout.body[colIndex];
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
              block.updateCellValue(bodyRowIndex, colIndex, 0, value);
              onBlockChange?.(block.block_id, block);
            }}
          />
        </div>
      </td>
    );
  }
}
