// lib/blocks/modules/GradeRatio/layout.tsx
// C 객체: GradeRatio 블록의 레이아웃 렌더링 (새로운 방식)

import React from 'react';
import { BlockInstance } from '../../BlockInstance';
import { GenericBlockLayoutRenderer } from '../../layout/GenericBlockLayoutRenderer';
import { RenderCellContext } from '../../layout/BlockLayoutRenderer';
import { LayoutComponent, BlockPropertyValues, getLayoutComponent } from '../common/types';
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
    0: ({ properties, readOnly, onChange }) => {
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
          autoFit={true}
        />
      );
    },
    1: ({ properties, readOnly, onChange }) => {
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
          autoFit={true}
        />
      );
    },
    2: ({ properties, readOnly, onChange }) => {
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
    const LayoutComponent = getLayoutComponent(GradeRatioLayout.header, colIndex);
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
    const { readOnly, highlightedCaseSet, onBlockChange } = context;
    
    // 속성 값 직접 가져오기
    const properties = block.getBodyProperties(bodyRowIndex, colIndex);

    const LayoutComponent = getLayoutComponent(GradeRatioLayout.body, colIndex);
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
            onChange={(propertyName: string, value: any) => {
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
