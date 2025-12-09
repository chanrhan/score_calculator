// lib/blocks/modules/Decimal/layout.tsx
// C 객체: Decimal 블록의 레이아웃 렌더링 (새로운 방식)

import React from 'react';
import { BlockInstance } from '../../BlockInstance';
import { GenericBlockLayoutRenderer } from '../../layout/GenericBlockLayoutRenderer';
import { RenderCellContext } from '../../layout/BlockLayoutRenderer';
import { LayoutComponent, BlockPropertyValues, getLayoutComponent, LayoutRenderContext } from '../common/types';
import { createTokenElement, createInputFieldElement } from '../common/elementHelpers';
import { Token } from '@/components/builder/block_builder/CellElement/Token';
import { InputField } from '@/components/builder/block_builder/CellElement/InputField';
import { TOKEN_MENU_KEYS } from '@/lib/data/token-menus';
import styles from '@/components/builder/Primitives/ComponentGrid.module.css';
import decimalStyles from './Decimal.module.css';

/**
 * Decimal 블록의 레이아웃 정의
 * 각 열별로 직접 HTML/CSS를 작성하고, 공통 컴포넌트만 사용
 */
export const DecimalLayout: {
  header: LayoutComponent;
  body: LayoutComponent;
} = {
  header: () => <span className={decimalStyles.label}>소수점 처리</span>,
  body: ({ properties, readOnly, onChange, varScope }: LayoutRenderContext & { varScope?: '0' | '1' }) => {
      const inputProp = properties.input_prop || 'finalScore';
      const decimalPlace = properties.decimal_place !== undefined ? String(properties.decimal_place) : '2';
      const decimalFunc = properties.decimal_func || '0';
      
      return (
        <div className={decimalStyles.body}>
          <div className={decimalStyles.row}>
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
            <span className={decimalStyles.label}>을(를) 소수점 </span>
            <InputField
              element={createInputFieldElement({
                value: decimalPlace,
                optional: false,
                visible: true,
              })}
              onChange={(value) => {
                if (!readOnly) {
                  onChange?.('decimal_place', Number(value) || 2);
                }
              }}
              autoFit={true}
            />
            <span className={decimalStyles.label}>자리까지</span>
            <Token
              element={createTokenElement({
                menu_key: TOKEN_MENU_KEYS.DECIMAL_FUNC,
                value: decimalFunc,
                optional: false,
                visible: true,
              })}
              onChange={(value) => {
                if (!readOnly) {
                  onChange?.('decimal_func', value);
                }
              }}
              autoFit={true}
            />
          </div>
        </div>
      );
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
    const LayoutComponent = getLayoutComponent(DecimalLayout.header, colIndex);
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

    const LayoutComponent = getLayoutComponent(DecimalLayout.body, colIndex);
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
