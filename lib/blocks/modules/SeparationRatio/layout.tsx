// lib/blocks/modules/SeparationRatio/layout.tsx
// C 객체: SeparationRatio 블록의 레이아웃 렌더링 (새로운 방식)

import React from 'react';
import { BlockInstance } from '../../BlockInstance';
import { GenericBlockLayoutRenderer } from '../../layout/GenericBlockLayoutRenderer';
import { RenderCellContext } from '../../layout/BlockLayoutRenderer';
import { LayoutComponent, BlockPropertyValues, getLayoutComponent } from '../common/types';
import { createTokenElement } from '../common/elementHelpers';
import { Token } from '@/components/builder/block_builder/CellElement/Token';
import styles from '@/components/builder/Primitives/ComponentGrid.module.css';
import separationRatioStyles from './SeparationRatio.module.css';

/**
 * SeparationRatio 블록의 레이아웃 정의
 * 각 열별로 직접 HTML/CSS를 작성하고, 공통 컴포넌트만 사용
 */
// colIndex에 따라 교과 라벨 생성 (일반교과, 진로선택과목, 예체능교과, ...)
const SEPARATION_LABELS = ['일반교과', '진로선택과목', '예체능교과'];
const getSeparationLabel = (colIndex: number): string => {
  if (colIndex < SEPARATION_LABELS.length) {
    return SEPARATION_LABELS[colIndex];
  }
  return `${colIndex + 1}번째 교과`;
};

export const SeparationRatioLayout: {
  header: LayoutComponent;
  body: LayoutComponent;
} = {
  header: ({ colIndex }) => {
    const label = colIndex !== undefined ? getSeparationLabel(colIndex) : '교과';
    return <span className={separationRatioStyles.label}>{label}</span>;
  },
  body: ({ properties, readOnly, onChange }) => {
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
        autoFit={true}
      />
    );
  },
};

/**
 * SeparationRatio 블록의 레이아웃 렌더러
 */
export class SeparationRatioLayoutRenderer extends GenericBlockLayoutRenderer {
  protected renderHeaderCell(
    block: BlockInstance,
    colIndex: number,
    context: RenderCellContext
  ): React.ReactNode {
    const LayoutComponent = SeparationRatioLayout.header;
    if (!LayoutComponent) {
      return <td key={colIndex} className={styles.tableCell}><div className={styles.headerCell} /></td>;
    }

    return (
      <td key={colIndex} className={styles.tableCell}>
        <div className={styles.headerCell}>
          <LayoutComponent properties={{}} readOnly={false} colIndex={colIndex} />
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

    const LayoutComponent = SeparationRatioLayout.body;
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
            colIndex={colIndex}
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
