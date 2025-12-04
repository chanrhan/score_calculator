// lib/blocks/modules/common/propertyExtractor.ts
// 블록 속성 값 추출 공통 유틸리티

import { BlockPropertyValues } from './types';

/**
 * DB 포맷에서 헤더 셀의 속성 값 추출
 * @param dbFormat BlockInstance.toDbFormat()의 결과
 * @param colIndex 열 인덱스
 * @param propertyExtractors 속성 추출 함수 맵 (속성명 -> 추출 함수)
 * @param defaults 기본값
 */
export function extractHeaderProperties(
  dbFormat: { header_cells: any; body_cells: any },
  colIndex: number,
  propertyExtractors: Record<string, (cellData: any) => any>,
  defaults: BlockPropertyValues = {}
): BlockPropertyValues {
  const properties: BlockPropertyValues = { ...defaults };
  
  if (dbFormat.header_cells && Array.isArray(dbFormat.header_cells) && dbFormat.header_cells[colIndex]) {
    const headerObj = dbFormat.header_cells[colIndex];
    
    // 객체 형태인 경우
    if (typeof headerObj === 'object' && headerObj !== null && !Array.isArray(headerObj)) {
      Object.keys(propertyExtractors).forEach(propName => {
        properties[propName] = propertyExtractors[propName](headerObj);
      });
    }
    // 배열 형태인 경우 (레거시 포맷)
    else if (Array.isArray(headerObj)) {
      Object.keys(propertyExtractors).forEach(propName => {
        properties[propName] = propertyExtractors[propName](headerObj);
      });
    }
  }
  
  return properties;
}

/**
 * DB 포맷에서 바디 셀의 속성 값 추출
 * @param dbFormat BlockInstance.toDbFormat()의 결과
 * @param rowIndex 행 인덱스
 * @param colIndex 열 인덱스
 * @param propertyExtractors 속성 추출 함수 맵 (속성명 -> 추출 함수)
 * @param defaults 기본값
 */
export function extractBodyProperties(
  dbFormat: { header_cells: any; body_cells: any },
  rowIndex: number,
  colIndex: number,
  propertyExtractors: Record<string, (cellData: any, rowData: any) => any>,
  defaults: BlockPropertyValues = {}
): BlockPropertyValues {
  const properties: BlockPropertyValues = { ...defaults };
  
  if (dbFormat.body_cells && Array.isArray(dbFormat.body_cells) && dbFormat.body_cells[rowIndex]) {
    const bodyRow = dbFormat.body_cells[rowIndex];
    
    // 객체 형태인 경우
    if (typeof bodyRow === 'object' && bodyRow !== null && !Array.isArray(bodyRow)) {
      Object.keys(propertyExtractors).forEach(propName => {
        properties[propName] = propertyExtractors[propName](bodyRow, bodyRow);
      });
    }
    // 배열 형태인 경우
    else if (Array.isArray(bodyRow)) {
      const cellData = bodyRow[colIndex];
      
      // 셀 데이터가 배열인 경우 (레거시 포맷: [[value1, value2, ...]])
      if (Array.isArray(cellData) && cellData.length > 0 && Array.isArray(cellData[0])) {
        Object.keys(propertyExtractors).forEach(propName => {
          properties[propName] = propertyExtractors[propName](cellData[0], bodyRow);
        });
      }
      // 셀 데이터가 객체인 경우
      else if (typeof cellData === 'object' && cellData !== null) {
        Object.keys(propertyExtractors).forEach(propName => {
          properties[propName] = propertyExtractors[propName](cellData, bodyRow);
        });
      }
      // 셀 데이터가 배열이지만 중첩이 아닌 경우
      else if (Array.isArray(cellData)) {
        Object.keys(propertyExtractors).forEach(propName => {
          properties[propName] = propertyExtractors[propName](cellData, bodyRow);
        });
      }
    }
  }
  
  return properties;
}

/**
 * 간단한 속성 추출 헬퍼 함수들
 */
export const PropertyExtractors = {
  // 객체에서 직접 속성 가져오기
  direct: (propName: string, defaultValue: any = null) => (obj: any) => {
    return obj?.[propName] ?? defaultValue;
  },
  
  // 배열에서 인덱스로 가져오기
  arrayIndex: (index: number, defaultValue: any = null) => (arr: any[]) => {
    return Array.isArray(arr) ? (arr[index] ?? defaultValue) : defaultValue;
  },
  
  // 중첩 배열에서 가져오기 (레거시 포맷: [[value1, value2, ...]])
  nestedArrayIndex: (index: number, defaultValue: any = null) => (arr: any[]) => {
    if (Array.isArray(arr) && arr.length > 0 && Array.isArray(arr[0])) {
      return arr[0][index] ?? defaultValue;
    }
    return defaultValue;
  },
  
  // 배열 전체 가져오기
  array: (defaultValue: any[] = []) => (arr: any) => {
    if (Array.isArray(arr)) {
      return arr.length > 0 && Array.isArray(arr[0]) ? arr[0] : arr;
    }
    return defaultValue;
  },
};

