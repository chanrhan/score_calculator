// lib/utils/divisionHeadUtils.ts
// 구분 헤드 유틸리티 함수

import { DivisionHeadBody, DivisionHeadHeader, CellMergeInfo } from '@/types/division-head';

/**
 * 각 셀의 rowspan 계산
 * 열 인덱스가 낮을수록 더 많은 행과 병합됨
 */
export function calculateRowspan(
  body: DivisionHeadBody,
  rowIndex: number,
  colIndex: number
): number {
  if (!body || body.length === 0) return 1;
  if (rowIndex >= body.length) return 1;
  
  const totalCols = body[0]?.length || 0;
  if (colIndex >= totalCols) return 1;
  
  // 현재 열의 오른쪽 열 개수
  const rightColsCount = totalCols - colIndex - 1;
  
  // 현재 행부터 시작하여 같은 값이 연속되는 행 개수 계산
  let rowspan = 1;
  const currentCell = body[rowIndex]?.[colIndex];
  
  // 같은 열에서 아래로 내려가며 같은 부모 셀을 가진 행 개수 계산
  for (let r = rowIndex + 1; r < body.length; r++) {
    // 왼쪽 열들(0 ~ colIndex-1)이 모두 같은지 확인
    let isSame = true;
    for (let c = 0; c < colIndex; c++) {
      const prevCell = body[rowIndex]?.[c];
      const currCell = body[r]?.[c];
      
      // 객체 비교 (간단한 JSON 비교)
      if (JSON.stringify(prevCell) !== JSON.stringify(currCell)) {
        isSame = false;
        break;
      }
    }
    
    if (isSame) {
      rowspan++;
    } else {
      break;
    }
  }
  
  return rowspan;
}

/**
 * 행 추가 시 병합 로직
 * 선택된 셀의 열 인덱스가 n인 경우:
 * - 열 인덱스 [0, n-1]: 기존 셀의 rowspan 증가
 * - 열 인덱스 [n, 마지막]: 새로운 셀 추가
 */
export function addRowToDivisionHead(
  body: DivisionHeadBody,
  selectedRowIndex: number,
  selectedColIndex: number
): DivisionHeadBody {
  if (!body || body.length === 0) {
    // 빈 바디인 경우 기본 행 추가
    return [[{}]];
  }
  
  const newBody = body.map(row => [...row]);
  const totalCols = body[0]?.length || 0;
  
  // 새 행 생성
  const newRow: Array<Record<string, any>> = [];
  for (let colIndex = 0; colIndex < totalCols; colIndex++) {
    if (colIndex < selectedColIndex) {
      // 왼쪽 열들: 기존 셀의 rowspan이 증가하므로 빈 객체 (실제로는 병합 처리)
      newRow.push({});
    } else {
      // 오른쪽 열들: 새로운 셀 추가
      newRow.push({});
    }
  }
  
  // 새 행을 선택된 행 아래에 삽입
  newBody.splice(selectedRowIndex + 1, 0, newRow);
  
  return newBody;
}

/**
 * 행 삭제
 */
export function removeRowFromDivisionHead(
  body: DivisionHeadBody,
  rowIndex: number
): DivisionHeadBody {
  if (!body || body.length === 0) return [];
  if (body.length <= 1) return body; // 최소 1개 행 유지
  
  const newBody = body.map(row => [...row]);
  newBody.splice(rowIndex, 1);
  
  return newBody;
}

/**
 * 열 추가
 */
export function addColumnToDivisionHead(
  header: DivisionHeadHeader,
  body: DivisionHeadBody
): { header: DivisionHeadHeader; body: DivisionHeadBody } {
  const newHeader = [...header, { division_type: '' }];
  
  const newBody = body.map(row => {
    const newRow = [...row, {}];
    return newRow;
  });
  
  return { header: newHeader, body: newBody };
}

/**
 * 열 삭제
 */
export function removeColumnFromDivisionHead(
  header: DivisionHeadHeader,
  body: DivisionHeadBody,
  colIndex: number
): { header: DivisionHeadHeader; body: DivisionHeadBody } {
  if (header.length <= 1) {
    // 최소 1개 열 유지
    return { header, body };
  }
  
  const newHeader = header.filter((_, idx) => idx !== colIndex);
  
  const newBody = body.map(row => {
    const newRow = row.filter((_, idx) => idx !== colIndex);
    return newRow;
  });
  
  return { header: newHeader, body: newBody };
}

/**
 * 기본 DivisionHead 데이터 생성
 */
export function createDefaultDivisionHead(): {
  header: DivisionHeadHeader;
  body: DivisionHeadBody;
  isActive: boolean;
} {
  return {
    header: [{ division_type: 'gender' }],
    body: [[{}]],
    isActive: true,
  };
}

