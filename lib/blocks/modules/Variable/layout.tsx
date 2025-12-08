// lib/blocks/modules/Variable/layout.tsx
// C 객체: Variable 블록의 레이아웃 렌더링 (새로운 방식)

import React from 'react';
import { BlockInstance } from '../../BlockInstance';
import { GenericBlockLayoutRenderer } from '../../layout/GenericBlockLayoutRenderer';
import { RenderCellContext } from '../../layout/BlockLayoutRenderer';
import { LayoutComponent, BlockPropertyValues, getLayoutComponent } from '../common/types';
import { createInputFieldElement, createFormulaElement } from '../common/elementHelpers';
import { InputField } from '@/components/builder/block_builder/CellElement/InputField';
import { Formula } from '@/components/builder/block_builder/CellElement/Formula';
import styles from '@/components/builder/Primitives/ComponentGrid.module.css';
import variableStyles from './Variable.module.css';

/**
 * Variable 블록의 레이아웃 정의
 * 각 열별로 직접 HTML/CSS를 작성하고, 공통 컴포넌트만 사용
 */
export const VariableLayout: {
  header: LayoutComponent;
  body: LayoutComponent;
} = {
  header: () => <span className={variableStyles.label}>변수</span>,
  body: ({ properties, readOnly, onChange }) => {
      const varName = properties.var_name || '';
      const expr = properties.expr || '';
      
      return (
        <div className={variableStyles.body}>
          <div className={variableStyles.row}>
            <span className={variableStyles.label}>변수명:</span>
            <InputField
              element={createInputFieldElement({
                value: varName,
                optional: false,
                visible: true,
              })}
              onChange={(value) => {
                if (!readOnly) {
                  onChange?.('var_name', value);
                }
              }}
              autoFit={true}
            />
          </div>
          <div className={variableStyles.row}>
            <span className={variableStyles.label}>수식:</span>
            <Formula
              element={createFormulaElement({
                menu_key: 'expr',
                value: expr,
                optional: false,
                visible: true,
              })}
              onChange={(value) => {
                if (!readOnly) {
                  onChange?.('expr', value);
                }
              }}
            />
          </div>
        </div>
      );
    },
};

/**
 * Variable 블록의 레이아웃 렌더러
 */
export class VariableLayoutRenderer extends GenericBlockLayoutRenderer {
  protected renderHeaderCell(
    block: BlockInstance,
    colIndex: number,
    context: RenderCellContext
  ): React.ReactNode {
    const LayoutComponent = getLayoutComponent(VariableLayout.header, colIndex);
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

    const LayoutComponent = getLayoutComponent(VariableLayout.body, colIndex);
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
