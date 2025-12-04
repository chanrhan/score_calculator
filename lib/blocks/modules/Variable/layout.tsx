// lib/blocks/modules/Variable/layout.tsx
// C 객체: Variable 블록의 레이아웃 렌더링 (새로운 방식)

import React from 'react';
import { BlockInstance } from '../../BlockInstance';
import { GenericBlockLayoutRenderer } from '../../layout/GenericBlockLayoutRenderer';
import { RenderCellContext } from '../../layout/BlockLayoutRenderer';
import { LayoutComponent, BlockPropertyValues } from '../common/types';
import { extractBodyProperties, PropertyExtractors } from '../common/propertyExtractor';
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
  header: { [columnIndex: number]: LayoutComponent };
  body: { [columnIndex: number]: LayoutComponent };
} = {
  header: {
    0: () => <span className={variableStyles.label}>변수</span>,
  },
  body: {
    0: ({ properties, readOnly, tokenMenus = [], onChange }) => {
      const varName = properties.var_name || '';
      const expr = properties.expr || '';
      
      return (
        <div className={variableStyles.body}>
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
            tokenMenus={tokenMenus}
          />
        </div>
      );
    },
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
    const LayoutComponent = VariableLayout.header[colIndex];
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
    const properties = extractBodyProperties(
      dbFormat,
      bodyRowIndex,
      colIndex,
      {
        var_name: (cellData: any) => {
          if (Array.isArray(cellData)) {
            return cellData[0] || '';
          }
          if (typeof cellData === 'object' && cellData !== null) {
            return cellData.var_name || '';
          }
          return '';
        },
        expr: (cellData: any) => {
          if (Array.isArray(cellData)) {
            return cellData[1] || '';
          }
          if (typeof cellData === 'object' && cellData !== null) {
            return cellData.expr || '';
          }
          return '';
        },
      },
      { var_name: '', expr: '' }
    );

    const LayoutComponent = VariableLayout.body[colIndex];
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
              if (propertyName === 'var_name') {
                block.updateCellValue(bodyRowIndex, colIndex, 0, value);
                onBlockChange?.(block.block_id, block);
              } else if (propertyName === 'expr') {
                block.updateCellValue(bodyRowIndex, colIndex, 1, value);
                onBlockChange?.(block.block_id, block);
              }
            }}
          />
        </div>
      </td>
    );
  }
}
