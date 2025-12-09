// lib/blocks/modules/Formula/layout.tsx
// C 객체: Formula 블록의 레이아웃 렌더링 (새로운 방식)

import React from 'react';
import { BlockInstance } from '../../BlockInstance';
import { GenericBlockLayoutRenderer } from '../../layout/GenericBlockLayoutRenderer';
import { RenderCellContext } from '../../layout/BlockLayoutRenderer';
import { LayoutComponent, BlockPropertyValues, getLayoutComponent, LayoutRenderContext } from '../common/types';
import { createTokenElement, createFormulaElement } from '../common/elementHelpers';
import { Token } from '@/components/builder/block_builder/CellElement/Token';
import { Formula } from '@/components/builder/block_builder/CellElement/Formula';
import { TOKEN_MENU_KEYS } from '@/lib/data/token-menus';
import styles from '@/components/builder/Primitives/ComponentGrid.module.css';
import formulaStyles from './Formula.module.css';

/**
 * Formula 블록의 레이아웃 정의
 * 각 열별로 직접 HTML/CSS를 작성하고, 공통 컴포넌트만 사용
 */
export const FormulaLayout: {
  header: LayoutComponent;
  body: LayoutComponent;
} = {
  header: ({ properties, readOnly, onChange }) => {
      // 헤더에는 더 이상 var_scope가 없음
      return (
        <div className={formulaStyles.header}>
          <span className={formulaStyles.label}>수식</span>
        </div>
      );
    },
  body: ({ properties, readOnly, onChange, varScope }: LayoutRenderContext & { varScope?: '0' | '1' }) => {
      const expr = properties.expr || '';
      const outputProp = properties.output_prop || 'finalScore';
      
      return (
        <div className={formulaStyles.body}>
          <div className={formulaStyles.row}>
            <Formula
              element={createFormulaElement({
                menu_key: 'variable',
                value: expr,
                optional: false,
                visible: true,
                var_use: true,
                var_store: true,
              })}
              onChange={(value) => {
                if (!readOnly) {
                  onChange?.('expr', value);
                }
              }}
              varScope={varScope}
            />
            <span className={formulaStyles.equals}> = </span>
            <Token
              element={createTokenElement({
                menu_key: TOKEN_MENU_KEYS.VARIABLE,
                value: outputProp,
                optional: false,
                visible: true,
                var_use: true
                var_store: true
              })}
              onChange={(value) => {
                if (!readOnly) {
                  onChange?.('output_prop', value);
                }
              }}
              autoFit={true}
              varScope={varScope}
            />
          </div>
        </div>
      );
    },
};

/**
 * Formula 블록의 레이아웃 렌더러
 */
export class FormulaLayoutRenderer extends GenericBlockLayoutRenderer {
  protected renderHeaderCell(
    block: BlockInstance,
    colIndex: number,
    context: RenderCellContext
  ): React.ReactNode {
    const { readOnly, onBlockChange } = context;
    
    // 속성 값 직접 가져오기
    const properties = block.getHeaderProperties(colIndex);

    const LayoutComponent = getLayoutComponent(FormulaLayout.header, colIndex);
    if (!LayoutComponent) {
      return <td key={colIndex} className={styles.tableCell}><div className={styles.headerCell} /></td>;
    }

    return (
      <td key={colIndex} className={styles.tableCell}>
        <div className={styles.headerCell}>
          <LayoutComponent
            properties={properties}
            readOnly={readOnly || false}
            onChange={(propertyName, value) => {
              if (readOnly) return;
              block.updateProperty(propertyName, value, undefined, colIndex);
              onBlockChange?.(block.block_id, block);
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
    const { readOnly, highlightedCaseSet, onBlockChange } = context;
    
    // 속성 값 직접 가져오기
    const properties = block.getBodyProperties(bodyRowIndex, colIndex);
    
    // 블록 레벨에서 var_scope 값 가져오기
    const varScope = (block as any).getVarScope() as '0' | '1';

    const LayoutComponent = getLayoutComponent(FormulaLayout.body, colIndex);
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
              varScope: varScope as '0' | '1',
            } as any)}
          />
        </div>
      </td>
    );
  }
}
