'use client'

import * as React from 'react'
import { CellElement } from '@/types/block-structure'
import { Token, Text, InputField, Formula, Table, List, ConditionChain, SelectionInput, OrderToken } from './CellElement'
import { BLOCK_TYPE } from '@/types/block-types'
import { getBlockTypeNameById } from '@/lib/blockManager'
import { getBlockType } from '@/types/block-structure'
import styles from './Cell.module.css'

interface CellProps {
  values?: any[] // 값들의 배열
  onChange?: (elementIndex: number, value: any) => void
  className?: string
  style?: React.CSSProperties
  blockType?: number // block_type을 파라미터로 추가
  isHeader?: boolean // 헤더 셀 여부
  col_type?: string | null // 구분 블록의 열 타입 (columnType key)
}

const CellElementRenderer: React.FC<{ 
  element: CellElement
  onChange?: (value: any) => void
}> = ({ element, onChange }) => {
  // console.table(element);
  switch (element.type) {
    case 'Token':
      return <Token element={element as any} onChange={onChange} autoFit={true} />
    case 'Text':
      return <Text element={element as any} />
    case 'InputField':
      return <InputField element={element as any} onChange={onChange} autoFit={true} />
    case 'SelectionInput':
      return <SelectionInput element={element as any} onChange={onChange} />
    case 'Formula':
      return <Formula element={element as any} onChange={onChange} />
    case 'Table':
      return <Table element={element as any} onChange={onChange} />
    case 'List':
      return <List element={element as any} onChange={onChange} />
    case 'ConditionChain':
      return <ConditionChain element={element as any} onChange={onChange} />
    case 'OrderToken':
      return <OrderToken element={element as any} onChange={onChange} />
    default:
      return <span className={styles.errorText}>??</span>
  }
}

export const Cell: React.FC<CellProps> = ({ 
  values = [], 
  onChange, 
  className = '', 
  style, 
  blockType,
  isHeader = false,
  col_type
}) => {
  // BLOCK_TYPES에서 직접 블록 구조 가져오기
  const blockTypeName = blockType ? getBlockTypeNameById(blockType) : null;
  const blockStructure = blockTypeName ? getBlockType(blockTypeName as keyof typeof import('@/types/block-structure').BLOCK_TYPES) : null;

  const processedElements = React.useMemo(() => {
    if (!blockStructure || !blockType) {
      return [];
    }

    // Division 블록인지 확인
    const isDivision = blockType === BLOCK_TYPE.DIVISION;
    
    if (isDivision) {
      // Division 블록의 경우
      if (isHeader) {
        // header: col_type에 해당하는 구조 가져오기
        if (col_type && blockStructure.header) {
          const headerCell = blockStructure.header.find((h: any) => h.type === 'Token' && h.menu_key === 'division_types');
          if (headerCell) {
            return [{
              type: 'Token',
              optional: false,
              visible: true,
              menu_key: 'division_types',
              value: col_type,
              content: ''
            }];
          }
        }
        return [];
      } else {
        // body: col_type에 해당하는 구조 가져오기
        if (col_type && blockStructure.children) {
          // children에서 col_type과 일치하는 구조 찾기
          // Division 블록의 경우 복잡한 구조이므로 기본 처리
          return [];
        }
        return [];
      }
    } else {
      // 일반 블록의 경우
      if (!blockStructure.cols || blockStructure.cols.length === 0) {
        return [];
      }
      
      // 첫 번째 열의 구조 사용 (일반적으로 한 열만 있음)
      const column = blockStructure.cols[0];
      const cellElements = isHeader ? column.header?.elements : column.rows?.[0]?.elements;
      
      if (!cellElements || !Array.isArray(cellElements)) {
        return [];
      }
      
      return cellElements.map((et: any, index: number) => {
        const raw = values && values[index] !== undefined ? values[index] : undefined;
        const value = (et.type === 'List' || et.type === 'ConditionChain' || et.type === 'OrderToken')
          ? (Array.isArray(raw) ? raw : [])
          : (raw !== undefined ? raw : '');
        return {
          ...et,
          type: et.type,
          optional: et.optional || false,
          visible: et.visible !== false,
          menu_key: et.menu_key || '',
          menu_key2: (et as any).menu_key2 || '',
          item_type: et.item_type,
          value: value,
          content: et.content || ''
        };
      });
    }
  }, [values, blockStructure, blockType, isHeader, col_type]);


  const visibleElements = processedElements.filter((element: any) => 
     element.visible
  )
  // Table 타입 요소가 있는지 확인
  const hasTableElement = visibleElements.some((element: any) => element.type === 'Table')
  
  return (
    <div 
      className={`${styles.cell} ${className}`}
      style={style}
    >
      <div className={hasTableElement ? styles.cellContentBlock : styles.cellContent}>
        {visibleElements.map((element: any, index: number) => (
          
          <CellElementRenderer
            key={index}
            element={element}
            onChange={(value) => onChange?.(index, value)}
          />
        ))}
      </div>
    </div>
  )
}