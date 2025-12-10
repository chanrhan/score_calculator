// lib/blocks/modules/TopSubject/layout.tsx
// C 객체: TopSubject 블록의 레이아웃 렌더링 (새로운 방식)

import React from 'react';
import { BlockInstance } from '../../BlockInstance';
import { GenericBlockLayoutRenderer } from '../../layout/GenericBlockLayoutRenderer';
import { RenderCellContext } from '../../layout/BlockLayoutRenderer';
import { LayoutComponent, BlockPropertyValues, getLayoutComponent } from '../common/types';
import { createTokenElement, createListElement, createInputFieldElement } from '../common/elementHelpers';
import { Token } from '@/components/builder/block_builder/CellElement/Token';
import { List } from '@/components/builder/block_builder/CellElement/List';
import { InputField } from '@/components/builder/block_builder/CellElement/InputField';
import { TOKEN_MENU_KEYS } from '@/lib/data/token-menus';
import styles from '@/components/builder/Primitives/ComponentGrid.module.css';
import topSubjectStyles from './TopSubject.module.css';

/**
 * TopSubject 블록의 레이아웃 정의
 * 각 열별로 직접 HTML/CSS를 작성하고, 공통 컴포넌트만 사용
 */
export const TopSubjectLayout: {
  header: LayoutComponent;
  body: LayoutComponent;
} = {
  header: () => <span className={topSubjectStyles.label}>상위 과목 선정</span>,
  body: ({ properties, readOnly, onChange }) => {
      const topsubjectOption = properties.topsubject_option || '1';
      const target = properties.target || 'finalScore';
      const topCount = properties.top_count !== undefined ? String(properties.top_count) : '3';
      const topsubjectOrder = properties.topsubject_order || [];
      const useOrder = properties.use_order || false;
      
      const handleCheckboxClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (!readOnly && onChange) {
          const newValue = !useOrder;
          onChange('use_order', newValue);
        }
      };
      
      return (
        <div className={topSubjectStyles.body}>
          <div className={topSubjectStyles.row}>
            <Token
              element={createTokenElement({
                menu_key: TOKEN_MENU_KEYS.TOPSUBJECT_OPTION,
                value: topsubjectOption,
                optional: false,
                visible: true,
              })}
              onChange={(value) => {
                if (!readOnly) {
                  onChange?.('topsubject_option', value);
                }
              }}
              autoFit={true}
            />
            <span className={topSubjectStyles.label}>기준</span>
            <Token
              element={createTokenElement({
                menu_key: TOKEN_MENU_KEYS.SCORE_TYPE,
                value: target,
                optional: false,
                visible: true,
                var_use: true
              })}
              onChange={(value) => {
                if (!readOnly) {
                  onChange?.('target', value);
                }
              }}
              autoFit={true}
            />
            <span className={topSubjectStyles.label}>상위</span>
            <InputField
              element={createInputFieldElement({
                value: topCount,
                optional: false,
                visible: true,
              })}
              onChange={(value) => {
                if (!readOnly) {
                  onChange?.('top_count', Number(value) || 3);
                }
              }}
              autoFit={true}
            />
            <span className={topSubjectStyles.label}>개</span>
          </div>
          <div 
            className={topSubjectStyles.checkboxRow}
            onClick={handleCheckboxClick}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            style={{ cursor: readOnly ? 'not-allowed' : 'pointer', marginTop: '2px' }}
          >
            <div 
              className={`${topSubjectStyles.checkbox} ${useOrder ? topSubjectStyles.checkboxChecked : ''}`}
              onClick={handleCheckboxClick}
            >
              {useOrder && (
                <svg 
                  width="10" 
                  height="10" 
                  viewBox="0 0 10 10" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className={topSubjectStyles.checkIcon}
                >
                  <path 
                    d="M8.33334 2.5L3.75001 7.08333L1.66667 5" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className={topSubjectStyles.checkboxText}>추가 정렬</span>
          </div>
          {useOrder && (
            <div className={topSubjectStyles.row}>
              <span className={topSubjectStyles.label}>정렬:</span>
              <List
                element={createListElement({
                  item_type: 'OrderToken',
                  menu_key: TOKEN_MENU_KEYS.TOPSUBJECT_ORDER,
                  menu_key2: TOKEN_MENU_KEYS.ORDER,
                  value: topsubjectOrder,
                  optional: false,
                  visible: true,
                })}
                onChange={(value) => {
                  if (!readOnly) {
                    onChange?.('topsubject_order', Array.isArray(value) ? value : []);
                  }
                }}
              />
            </div>
          )}
        </div>
      );
    },
};

/**
 * TopSubject 블록의 레이아웃 렌더러
 */
export class TopSubjectLayoutRenderer extends GenericBlockLayoutRenderer {
  protected renderHeaderCell(
    block: BlockInstance,
    colIndex: number,
    context: RenderCellContext
  ): React.ReactNode {
    const LayoutComponent = getLayoutComponent(TopSubjectLayout.header, colIndex);
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

    const LayoutComponent = getLayoutComponent(TopSubjectLayout.body, colIndex);
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
