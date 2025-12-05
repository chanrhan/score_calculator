// lib/blocks/modules/ApplySubject/layout.tsx
// C 객체: ApplySubject 블록의 레이아웃 렌더링 (새로운 방식)

import React from 'react';
import { BlockInstance } from '../../BlockInstance';
import { GenericBlockLayoutRenderer } from '../../layout/GenericBlockLayoutRenderer';
import { RenderCellContext } from '../../layout/BlockLayoutRenderer';
import { LayoutComponent, BlockPropertyValues, getLayoutComponent } from '../common/types';
import { createTokenElement, createListElement } from '../common/elementHelpers';
import { Token } from '@/components/builder/block_builder/CellElement/Token';
import { List } from '@/components/builder/block_builder/CellElement/List';
import styles from '@/components/builder/Primitives/ComponentGrid.module.css';
import applySubjectStyles from './ApplySubject.module.css';

/**
 * ApplySubject 블록의 레이아웃 정의
 * 각 열별로 직접 HTML/CSS를 작성하고, 공통 컴포넌트만 사용
 */
export const ApplySubjectLayout: {
  header: LayoutComponent;
  body: LayoutComponent;
} = {
  header: ({ properties, readOnly, onChange }) => {
      const includeOption = properties.include_option || 'include';
      
      return (
        <div className={applySubjectStyles.header}>
          <span className={applySubjectStyles.label}>반영교과</span>
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
            autoFit={true}
          />
        </div>
      );
    },
  body: ({ properties, readOnly, onChange }) => {
      const subjectGroups = properties.subject_groups || [];
      
      return (
        <div className={applySubjectStyles.body}>
          <List
            element={createListElement({
              item_type: 'Token',
              menu_key: 'subject_groups',
              value: subjectGroups,
              optional: false,
              visible: true,
            })}
            onChange={(value) => {
              if (!readOnly) {
                onChange?.('subject_groups', value);
              }
            }}
          />
        </div>
      );
    },
};

/**
 * ApplySubject 블록의 레이아웃 렌더러
 */
export class ApplySubjectLayoutRenderer extends GenericBlockLayoutRenderer {
  protected renderHeaderCell(
    block: BlockInstance,
    colIndex: number,
    context: RenderCellContext
  ): React.ReactNode {
    const { readOnly, onBlockChange } = context;
    
    // 속성 값 직접 가져오기
    const properties = block.getHeaderProperties(colIndex);

    const LayoutComponent = getLayoutComponent(ApplySubjectLayout.header, colIndex);
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

    const LayoutComponent = getLayoutComponent(ApplySubjectLayout.body, colIndex);
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
