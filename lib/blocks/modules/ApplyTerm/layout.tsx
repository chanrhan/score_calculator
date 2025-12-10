// lib/blocks/modules/ApplyTerm/layout.tsx
// C 객체: ApplyTerm 블록의 레이아웃 렌더링 (새로운 방식)

import React from 'react';
import { BlockInstance } from '../../BlockInstance';
import { GenericBlockLayoutRenderer } from '../../layout/GenericBlockLayoutRenderer';
import { RenderCellContext } from '../../layout/BlockLayoutRenderer';
import { LayoutComponent, BlockPropertyValues, getLayoutComponent } from '../common/types';
import { createTokenElement } from '../common/elementHelpers';
import { Token } from '@/components/builder/block_builder/CellElement/Token';
import { TOKEN_MENU_KEYS } from '@/lib/data/token-menus';
import styles from '@/components/builder/Primitives/ComponentGrid.module.css';
import applyTermStyles from './ApplyTerm.module.css';

/**
 * ApplyTerm 블록의 레이아웃 정의
 * 각 열별로 직접 HTML/CSS를 작성하고, 공통 컴포넌트만 사용
 */
export const ApplyTermLayout: {
  header: LayoutComponent;
  body: LayoutComponent;
} = {
  header: ({ properties, readOnly, onChange }) => {
      const includeOption = properties.include_option || '0';
      
      return (
        <div className={applyTermStyles.header}>
          {/* <span className={applyTermStyles.label}>반영학기</span> */}
          <Token
            element={createTokenElement({
              menu_key: TOKEN_MENU_KEYS.INCLUDE_EXCLUDE,
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
      const term_1_1 = properties.term_1_1 || false;
      const term_1_2 = properties.term_1_2 || false;
      const term_2_1 = properties.term_2_1 || false;
      const term_2_2 = properties.term_2_2 || false;
      const term_3_1 = properties.term_3_1 || false;
      const term_3_2 = properties.term_3_2 || false;
      const topCount = properties.top_count !== undefined ? String(properties.top_count) : '0';
      const useTopCount = properties.use_top_count || false;
      
      const handleTermCheckboxClick = (termKey: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (!readOnly && onChange) {
          const currentValue = properties[termKey as keyof typeof properties] || false;
          onChange(termKey, !currentValue);
        }
      };

      const handleTopCountCheckboxClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (!readOnly && onChange) {
          const newValue = !useTopCount;
          onChange('use_top_count', newValue);
        }
      };
      
      const terms = [
        { key: 'term_1_1', label: '1-1', checked: term_1_1 },
        { key: 'term_1_2', label: '1-2', checked: term_1_2 },
        { key: 'term_2_1', label: '2-1', checked: term_2_1 },
        { key: 'term_2_2', label: '2-2', checked: term_2_2 },
        { key: 'term_3_1', label: '3-1', checked: term_3_1 },
        { key: 'term_3_2', label: '3-2', checked: term_3_2 },
      ];
      
      return (
        <div className={applyTermStyles.body}>
          <div className={applyTermStyles.termGrid}>
            {terms.map((term) => (
              <div
                key={term.key}
                className={applyTermStyles.termCheckboxRow}
                onClick={(e) => handleTermCheckboxClick(term.key, e)}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                style={{ cursor: readOnly ? 'not-allowed' : 'pointer' }}
              >
                <div 
                  className={`${applyTermStyles.checkbox} ${term.checked ? applyTermStyles.checkboxChecked : ''}`}
                  onClick={(e) => handleTermCheckboxClick(term.key, e)}
                >
                  {term.checked && (
                    <svg 
                      width="10" 
                      height="10" 
                      viewBox="0 0 10 10" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      className={applyTermStyles.checkIcon}
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
                <span className={applyTermStyles.termLabel}>{term.label}</span>
              </div>
            ))}
          </div>
          <div 
            className={applyTermStyles.checkboxRow}
            onClick={handleTopCountCheckboxClick}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            style={{ cursor: readOnly ? 'not-allowed' : 'pointer' }}
          >
            <div 
              className={`${applyTermStyles.checkbox} ${useTopCount ? applyTermStyles.checkboxChecked : ''}`}
              onClick={handleTopCountCheckboxClick}
            >
              {useTopCount && (
                <svg 
                  width="10" 
                  height="10" 
                  viewBox="0 0 10 10" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className={applyTermStyles.checkIcon}
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
            <span className={applyTermStyles.checkboxText}>우수 학기만 반영</span>
          </div>
          {useTopCount && (
            <div className={applyTermStyles.row}>
              <span className={applyTermStyles.label}>상위</span>
              <input
                type="number"
                value={topCount}
                onChange={(e) => {
                  if (!readOnly) {
                    onChange?.('top_count', Number(e.target.value) || 0);
                  }
                }}
                className={applyTermStyles.numberInput}
                disabled={readOnly}
                min="0"
              />
              <span className={applyTermStyles.label}>개</span>
            </div>
          )}
        </div>
      );
    },
};

/**
 * ApplyTerm 블록의 레이아웃 렌더러
 */
export class ApplyTermLayoutRenderer extends GenericBlockLayoutRenderer {
  protected renderHeaderCell(
    block: BlockInstance,
    colIndex: number,
    context: RenderCellContext
  ): React.ReactNode {
    const { readOnly, onBlockChange } = context;
    
    // 속성 값 직접 가져오기
    const properties = block.getHeaderProperties(colIndex);

    const LayoutComponent = getLayoutComponent(ApplyTermLayout.header, colIndex);
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

    const LayoutComponent = getLayoutComponent(ApplyTermLayout.body, colIndex);
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
