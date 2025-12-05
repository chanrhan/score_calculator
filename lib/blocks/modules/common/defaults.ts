// lib/blocks/modules/common/defaults.ts
// 기본값 유틸리티 (deprecated: 이제 각 BlockInstance에서 기본값을 직접 관리)

import { BlockPropertyValues } from './types';

/**
 * 블록 타입에 해당하는 기본값을 가져옴
 * @deprecated 이제 각 BlockInstance의 constructor에서 기본값을 직접 정의합니다.
 * @param blockType 블록 타입 ID
 * @returns 빈 객체 (기본값은 각 BlockInstance에서 관리)
 */
export function getBlockDefaults(blockType: number): BlockPropertyValues {
  // 구조가 제거되었으므로 빈 객체 반환
  // 각 BlockInstance의 constructor에서 기본값을 직접 정의하도록 변경됨
  return {};
}

/**
 * DB 데이터와 기본값을 병합
 * DB 데이터가 있으면 우선 사용, 없으면 기본값 사용
 * @param dbData DB에서 가져온 데이터
 * @param defaults BlockStructure의 기본값
 * @returns 병합된 데이터
 */
export function mergeWithDefaults(
  dbData: BlockPropertyValues,
  defaults: BlockPropertyValues
): BlockPropertyValues {
  const merged: BlockPropertyValues = { ...defaults };
  
  // DB 데이터가 있으면 우선 사용
  Object.keys(dbData).forEach(key => {
    const dbValue = dbData[key];
    // null, undefined, 빈 배열이 아닌 경우에만 사용
    if (dbValue !== null && dbValue !== undefined) {
      if (Array.isArray(dbValue) && dbValue.length === 0) {
        // 빈 배열은 기본값 유지 (선택사항: 기본값도 빈 배열이면 그대로)
        if (Array.isArray(defaults[key]) && defaults[key].length === 0) {
          merged[key] = [];
        }
      } else {
        merged[key] = dbValue;
      }
    }
  });
  
  return merged;
}

/**
 * BlockInstanceData를 BlockPropertyValues로 변환
 * DB 형식(header_cells, body_cells)을 속성 기반 형식으로 변환
 * @param blockType 블록 타입 ID
 * @param data BlockInstanceData
 * @returns 속성 기반 값 객체
 */
export function convertDbDataToProperties(
  blockType: number,
  data: { header_cells: any; body_cells: any }
): BlockPropertyValues {
  // 각 블록 타입별로 변환 로직이 필요하지만,
  // 현재는 BlockInstance의 constructor에서 처리하므로
  // 여기서는 기본값만 반환
  return getBlockDefaults(blockType);
}

