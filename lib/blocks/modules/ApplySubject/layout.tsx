// lib/blocks/modules/ApplySubject/layout.tsx
// C 객체: ApplySubject 블록의 레이아웃 렌더링 (새로운 방식)

import React from 'react';
import { BlockInstance } from '../../BlockInstance';
import { GenericBlockLayoutRenderer } from '../../layout/GenericBlockLayoutRenderer';
import { RenderCellContext } from '../../layout/BlockLayoutRenderer';
import { LayoutComponent, BlockPropertyValues } from '../common/types';
import { extractHeaderProperties, extractBodyProperties, PropertyExtractors } from '../common/propertyExtractor';
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
  header: { [columnIndex: number]: LayoutComponent };
  body: { [columnIndex: number]: LayoutComponent };
} = {
  header: {
    0: ({ properties, readOnly, tokenMenus = [], onChange }) => {
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
            tokenMenus={tokenMenus}
            autoFit={true}
          />
        </div>
      );
    },
  },
  body: {
    0: ({ properties, readOnly, tokenMenus = [], onChange }) => {
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
            tokenMenus={tokenMenus}
          />
        </div>
      );
    },
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
    const { readOnly, onBlockChange, tokenMenus } = context;
    const dbFormat = block.toDbFormat();
    
    // 속성 값 추출
    const properties = extractHeaderProperties(
      dbFormat,
      0,
      {
        include_option: (obj: any) => {
          if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
            return obj.include_option || 'include';
          }
          if (Array.isArray(obj)) {
            return obj[1] || 'include';
          }
          return 'include';
        },
      },
      { include_option: 'include' }
    );

    const LayoutComponent = ApplySubjectLayout.header[colIndex];
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
              // 속성 업데이트를 BlockInstance에 반영
              if (propertyName === 'include_option') {
                block.updateCellValue(-1, colIndex, 1, value);
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
        subject_groups: (cellData: any, rowData: any) => {
          if (typeof cellData === 'object' && cellData !== null && 'subject_groups' in cellData) {
            return Array.isArray(cellData.subject_groups) ? cellData.subject_groups : [];
          }
          if (Array.isArray(cellData)) {
            return Array.isArray(cellData) ? cellData : [];
          }
          if (typeof rowData === 'object' && rowData !== null && 'subject_groups' in rowData) {
            return Array.isArray(rowData.subject_groups) ? rowData.subject_groups : [];
          }
          return [];
        },
      },
      { subject_groups: [] }
    );

    const LayoutComponent = ApplySubjectLayout.body[colIndex];
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
              // 속성 업데이트를 BlockInstance에 반영
              if (propertyName === 'subject_groups') {
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
