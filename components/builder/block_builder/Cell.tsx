'use client'

import * as React from 'react'
import { CellElement } from '@/types/block-structure'
import { Token, Text, InputField, Formula, Table, List, ConditionChain, SelectionInput, OrderToken } from './CellElement'
import type { TokenMenu, BlockData } from '@/types/block-data'
import { BLOCK_TYPE } from '@/types/block-types'
import { useBlockDataStore } from '@/store/useBlockDataStore'
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
  tokenMenus?: TokenMenu[]
}> = ({ element, onChange, tokenMenus = [] }) => {
  // console.table(element);
  switch (element.type) {
    case 'Token':
      return <Token element={element as any} onChange={onChange} tokenMenus={tokenMenus} autoFit={true} />
    case 'Text':
      return <Text element={element as any} />
    case 'InputField':
      return <InputField element={element as any} onChange={onChange} autoFit={true} />
    case 'SelectionInput':
      return <SelectionInput element={element as any} onChange={onChange} tokenMenus={tokenMenus} />
    case 'Formula':
      return <Formula element={element as any} tokenMenus={tokenMenus} onChange={onChange} />
    case 'Table':
      return <Table element={element as any} onChange={onChange} />
    case 'List':
      return <List element={element as any} onChange={onChange} tokenMenus={tokenMenus} />
    case 'ConditionChain':
      return <ConditionChain element={element as any} onChange={onChange} tokenMenus={tokenMenus} />
    case 'OrderToken':
      return <OrderToken element={element as any} onChange={onChange} tokenMenus={tokenMenus} />
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
  // 전역 스토어에서 block_data와 token_menus 가져오기
  const { blockData, tokenMenus, getBlockDataByType } = useBlockDataStore();
  
  // 현재 블록의 block_data 가져오기
  const currentBlockData = blockType ? getBlockDataByType(blockType) : null;
  // if(blockType === BLOCK_TYPE.AGGREGATION){
  //   console.log('Cell: values:', currentBlockData);
  // }

  const processedElements = React.useMemo(() => {
    // console.log('Cell processedElements - currentBlockData:', currentBlockData, 'blockType:', blockType, 'isHeader:', isHeader, 'col_type:', col_type, 'values:', values);
    if (!currentBlockData || !blockType) {
      console.log('Cell: currentBlockData 또는 blockType이 없음');
      return [];
    }

    // isHeader에 따라 header_cell_type 또는 body_cell_type 사용
    const cellType = isHeader ? currentBlockData.header_cell_type : currentBlockData.body_cell_type;

    // cellType이 존재하지 않으면 빈 배열 반환
    if (!cellType) {
      console.warn('Cell type is undefined for block:', currentBlockData);
      return [];
    }
        
    if (blockType !== BLOCK_TYPE.DIVISION || (isHeader && blockType === BLOCK_TYPE.DIVISION)) {
      // 일반 블록의 경우
      if (!cellType.element_types || !Array.isArray(cellType.element_types)) {
        console.warn('element_types is not an array for block:', currentBlockData);
        return [];
      }
      return cellType.element_types.map((et: any, index: number) => {
        const raw = values && values[index] !== undefined ? values[index] : undefined
        const value = (et.type === 'List' || et.type === 'ConditionChain' || et.type === 'OrderToken')
          ? (Array.isArray(raw) ? raw : [])
          : (raw !== undefined ? raw : '')
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
    } else {
      // Division 블록의 경우 (Map 형태)
      if (typeof cellType !== 'object' || cellType === null) {
        console.warn('Division block cellType is not an object:', currentBlockData);
        return [];
      }
      const columnTypes = Object.keys(cellType);

      
      // col_type이 'element_types'인 경우 첫 번째 컬럼 타입 사용
      if (col_type === 'element_types' || col_type === null) {
        // 첫 번째 컬럼 타입을 사용하여 기본값 표시
        // const firstColumnType = columnTypes[0];
        // if (firstColumnType && cellType[firstColumnType]) {
        //   const firstColumnElements = cellType[firstColumnType];
        //   return firstColumnElements.map((et: any, index: number) => {
        //     const value = values && values[index] !== undefined ? values[index] : '';
        //     return {
        //       type: et.name,
        //       optional: et.optional || false,
        //       visible: et.visible !== false,
        //       menu_key: et.menu_key || '',
        //       value: value,
        //       content: et.content || ''
        //     };
        //   });
        // }
        
        // 컬럼 타입이 없는 경우 기본 텍스트 표시
        return [{
          type: 'Text',
          optional: false,
          visible: true,
          menu_key: '',
          value: '구분유형을 선택해주세요',
          content: '구분유형을 선택해주세요'
        }];
      }
      
      // col_type이 제공된 경우 해당 columnType만 사용, 그렇지 않으면 모든 columnType 사용
      const targetColumnTypes = col_type ? [col_type] : columnTypes;
      
      return targetColumnTypes.flatMap(columnType => {
        const columnElements = cellType[columnType];
        if (!columnElements || !Array.isArray(columnElements)) {
          console.warn(`Column type '${columnType}' not found in cellType:`, cellType);
          return [];
        }
        
        return columnElements.map((et: any, index: number) => {
          const raw = values && values[index] !== undefined ? values[index] : undefined
          const value = (et.type === 'List' || et.type === 'ConditionChain' || et.type === 'OrderToken')
            ? (Array.isArray(raw) ? raw : [])
            : (raw !== undefined ? raw : '')
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
      });
    }
  }, [values, currentBlockData, blockType, isHeader, col_type]);

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
            tokenMenus={tokenMenus}
          />
        ))}
      </div>
    </div>
  )
}