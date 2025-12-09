// lib/blocks/modules/Ratio/layout.tsx
// C 객체: Ratio 블록의 레이아웃 렌더링 (새로운 방식)

import React from 'react';
import { BlockInstance } from '../../BlockInstance';
import { GenericBlockLayoutRenderer } from '../../layout/GenericBlockLayoutRenderer';
import { RenderCellContext } from '../../layout/BlockLayoutRenderer';
import { LayoutComponent, BlockPropertyValues, getLayoutComponent, LayoutRenderContext } from '../common/types';
import { createInputFieldElement, createTokenElement } from '../common/elementHelpers';
import { InputField } from '@/components/builder/block_builder/CellElement/InputField';
import { Token } from '@/components/builder/block_builder/CellElement/Token';
import { TOKEN_MENU_KEYS } from '@/lib/data/token-menus';
import styles from '@/components/builder/Primitives/ComponentGrid.module.css';
import ratioStyles from './Ratio.module.css';

/**
 * Ratio 블록의 레이아웃 정의
 * 각 열별로 직접 HTML/CSS를 작성하고, 공통 컴포넌트만 사용
 */
export const RatioLayout: {
  header: LayoutComponent;
  body: LayoutComponent;
} = {
  header: () => <span className={ratioStyles.label}>반영비율</span>,
  body: ({ properties, readOnly, onChange, varScope }: LayoutRenderContext & { varScope?: '0' | '1' }) => {
      const inputProp = properties.input_prop || 'finalScore';
      const ratio = properties.ratio !== undefined ? String(properties.ratio) : '100';
      
      return (
        <>
          <Token
            element={createTokenElement({
              menu_key: TOKEN_MENU_KEYS.SCORE_TYPE,
              value: inputProp,
              optional: false,
              visible: true,
              var_use: true
            })}
            onChange={(value) => {
              if (!readOnly) {
                onChange?.('input_prop', value);
              }
            }}
            autoFit={true}
            varScope={varScope}
          />
          <InputField
            element={createInputFieldElement({
              value: ratio,
              optional: false,
              visible: true,
            })}
            onChange={(value) => {
              if (!readOnly) {
                onChange?.('ratio', Number(value) || 100);
              }
            }}
            autoFit={true}
          />
          <span>%</span>
        </>
      );
    },
};

/**
 * Ratio 블록의 레이아웃 렌더러
 */
export class RatioLayoutRenderer extends GenericBlockLayoutRenderer {
  protected renderHeaderCell(
    block: BlockInstance,
    colIndex: number,
    context: RenderCellContext
  ): React.ReactNode {
    const LayoutComponent = getLayoutComponent(RatioLayout.header, colIndex);
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
    
    // 블록 레벨에서 var_scope 값 가져오기
    const varScope = (block as any).getVarScope() as '0' | '1';

    const LayoutComponent = getLayoutComponent(RatioLayout.body, colIndex);
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
            {...({
              properties,
              readOnly: readOnly || false,
              onChange: (propertyName: string, value: any) => {
                if (readOnly) return;
                block.updateProperty(propertyName, value, bodyRowIndex, colIndex);
                onBlockChange?.(block.block_id, block);
              },
              varScope: varScope,
            } as any)}
          />
        </div>
      </td>
    );
  }
}
