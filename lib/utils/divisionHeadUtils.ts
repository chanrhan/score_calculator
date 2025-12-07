// lib/utils/divisionHeadUtils.ts
// 구분 헤드 유틸리티 함수

import { DivisionHeadBody, DivisionHeadHeader, CellMergeInfo } from '@/types/division-head';

/**
 * 각 셀의 rowspan 계산
 * 열 인덱스가 낮을수록 더 많은 행과 병합됨
 * 단, colIndex = 0일 때는 왼쪽 열이 없으므로 병합이 일어나지 않음 (명세: C = 0이라면 병합되지 않음)
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
  
  // colIndex = 0일 때는 왼쪽 열이 없으므로 병합이 일어나지 않음
  // 명세: C = 0이라면 병합되지 않음
  if (colIndex === 0) {
    return 1;
  }
  
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
    
    // 현재 열의 셀도 비교하여 실제로 같은 셀인지 확인
    // 빈 객체 {}끼리는 같은 것으로 간주하되, 행이 추가되었으면 다른 행으로 간주
    const currentCell = body[rowIndex]?.[colIndex];
    const nextCell = body[r]?.[colIndex];
    const currentCellStr = JSON.stringify(currentCell || {});
    const nextCellStr = JSON.stringify(nextCell || {});
    
    // 현재 열의 셀이 같고, 왼쪽 열들도 모두 같으면 병합
    if (isSame && currentCellStr === nextCellStr) {
      rowspan++;
    } else {
      break;
    }
  }
  
  return rowspan;
}

/**
 * 행 추가 시 병합 로직
 * 명세서 division-head-row-col.md에 따른 구현:
 * (R,C)를 기준으로 "행 추가"를 실행했을 경우:
 * 1. R+1 자리에 행이 하나 삽입된다
 * 2. (R,C-1) 셀과 (R+1, C-1) 셀은 병합된다 (rowspan) - C = 0이라면 병합되지 않음
 * 3. 병합되지 않은 독립된 (R+1,C) 셀이 하나 추가된다
 *    - 구분 헤드 블록의 열 개수가 M개라면, (R+1,C), (R+1,C+1), (R+1,C+2), ... , (R+1, M) 셀이 추가된다
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
      // 왼쪽 열들 (0 ~ C-1): 병합 처리
      // (R,C-1) 셀과 (R+1, C-1) 셀은 병합되므로, 
      // 병합된 셀은 데이터에 존재하지 않음 (빈 객체로 표시)
      // 실제 병합은 calculateRowspan에서 처리됨
      newRow.push({});
    } else {
      // 오른쪽 열들 (C ~ M-1): 독립된 셀 추가
      // (R+1,C), (R+1,C+1), ..., (R+1,M-1) 셀이 추가됨
      newRow.push({});
    }
  }
  
  // 새 행을 선택된 행 아래에 삽입 (R+1 자리)
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
 * 명세서 division-head-row-col.md에 따른 구현:
 * - 구분 헤드 블록에 새로운 열을 추가한다 (맨 오른쪽)
 * - N개의 열이 있다면, N+1 열은 N열의 병합 상태를 그대로 복사한다
 * 
 * 병합 상태 복사:
 * - N열의 각 행에서 rowspan을 계산하여 N+1 열의 각 행에서도 같은 rowspan을 가지도록 셀을 추가
 * - 병합 상태는 셀의 값에 의해 결정되므로, N+1 열의 각 행에 빈 셀을 추가하면
 *   calculateRowspan에서 자동으로 병합 상태를 계산함
 * - N열에서 병합된 셀은 N+1 열에서도 같은 병합 상태를 가지도록 빈 셀을 추가
 */
export function addColumnToDivisionHead(
  header: DivisionHeadHeader,
  body: DivisionHeadBody
): { header: DivisionHeadHeader; body: DivisionHeadBody } {
  const newHeader = [...header, { division_type: '' }];
  
  if (!body || body.length === 0) {
    return { header: newHeader, body: [[{}]] };
  }
  
  // N+1 열의 각 행에 빈 셀을 추가
  // 병합 상태는 calculateRowspan에서 자동으로 계산됨
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

