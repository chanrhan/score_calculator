// lib/utils/divisionHeadUtils.ts
// 구분 헤드 유틸리티 함수

import { DivisionHeadBody, DivisionHeadHeader, CellMergeInfo } from '@/types/division-head';

/**
 * 각 셀의 rowspan 값 반환
 * 셀 객체에 rowspan 속성이 있으면 그 값을 반환하고, 없으면 기본값 1 반환
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
  
  const cell = body[rowIndex]?.[colIndex];
  if (!cell) return 1;
  
  // 셀의 rowspan 속성을 읽어서 반환 (없으면 기본값 1)
  return cell.rowspan !== undefined ? cell.rowspan : 1;
}

/**
 * 행 추가 시 병합 로직
 * division-head-rowspan-rule.md 규칙에 따른 구현:
 * (r,c) 셀에서 행 추가 시:
 * 1. r+1번째 행 위치에 새로운 행이 하나 삽입된다
 *    - (r+1, k) (k >= c) 셀: rowspan = 1
 *    - (r+1, m) (m < c) 셀: rowspan = 0
 * 2. (c > 0) 일 경우, (r+1, c-1).rowspan = 0 이면
 *    - r+1에서 1씩 빼면서 셀을 순차적으로 방문
 *    - 방문한 셀의 rowspan > 0 인 경우, 해당 셀의 rowspan 값에 1을 더하고 반복문 종료
 */
export function addRowToDivisionHead(
  body: DivisionHeadBody,
  selectedRowIndex: number,
  selectedColIndex: number
): DivisionHeadBody {
  if (!body || body.length === 0) {
    // 빈 바디인 경우 기본 행 추가 (rowspan: 1)
    return [[{ rowspan: 1 }]];
  }
  
  // rowspan=0인 셀에서는 행 추가 불가
  const selectedCell = body[selectedRowIndex]?.[selectedColIndex];
  if (selectedCell?.rowspan === 0) {
    throw new Error('rowspan=0인 셀에서는 행을 추가할 수 없습니다.');
  }
  
  const newBody = body.map(row => row.map(cell => ({ ...cell })));
  const totalCols = body[0]?.length || 0;
  const insertRowIndex = selectedRowIndex + 1;
  
  // 새 행 생성
  const newRow: Array<Record<string, any>> = [];
  for (let colIndex = 0; colIndex < totalCols; colIndex++) {
    if (colIndex < selectedColIndex) {
      // (r+1, m) (m < c) 셀: rowspan = 0
      newRow.push({ rowspan: 0 });
    } else {
      // (r+1, k) (k >= c) 셀: rowspan = 1
      newRow.push({ rowspan: 1 });
    }
  }
  
  // 새 행을 삽입
  newBody.splice(insertRowIndex, 0, newRow);
  
  // c > 0일 경우, t < c 인 모든 (r+1, t)셀에 대해서 rowspan = 0 일 경우 rowspan 조정
  // 문서 규칙: "(c > 0) 일 경우, 1) t < c 인 모든 (r+1, t)셀에 대해서 rowspan = 0 일 경우, 
  //            r+1에서 1을 하나씩 빼면서 셀을 순차적으로 방문하여
  //            방문한 셀의 rowspan > 0 인 경우, 해당 셀의 rowspan 값에 1을 더하고 즉시 반복문 종료"
  if (selectedColIndex > 0) {
    // t < c 인 모든 열에 대해 각각 처리
    for (let t = 0; t < selectedColIndex; t++) {
      const cellInNewRow = newRow[t];
      
      // (r+1, t).rowspan = 0 일 경우에만 처리
      if (cellInNewRow.rowspan === 0) {
        // r+1에서 1씩 빼면서 셀을 순차적으로 방문
        for (let r = insertRowIndex - 1; r >= 0; r--) {
          const cell = newBody[r]?.[t];
          if (cell && cell.rowspan > 0) {
            cell.rowspan += 1;
            break; // 즉시 반복문 종료
          }
        }
      }
    }
  }
  
  return newBody;
}

/**
 * 행 복사
 * 선택한 행의 데이터를 복사하여 바로 아래에 새 행을 추가합니다.
 * - addRowToDivisionHead를 먼저 호출하여 빈 행 추가 (rowspan 규칙 적용)
 * - 추가된 새 행에 선택한 행의 데이터를 깊은 복사 (rowspan 속성 제외)
 */
export function copyRowInDivisionHead(
  body: DivisionHeadBody,
  selectedRowIndex: number,
  selectedColIndex: number
): DivisionHeadBody {
  if (!body || body.length === 0) {
    // 빈 바디인 경우 기본 행 추가 (rowspan: 1)
    return [[{ rowspan: 1 }]];
  }
  
  // rowspan=0인 셀에서는 행 복사 불가
  const selectedCell = body[selectedRowIndex]?.[selectedColIndex];
  if (selectedCell?.rowspan === 0) {
    throw new Error('rowspan=0인 셀에서는 행을 복사할 수 없습니다.');
  }
  
  // 먼저 addRowToDivisionHead를 호출하여 빈 행 추가 (rowspan 규칙 적용)
  const newBody = addRowToDivisionHead(body, selectedRowIndex, selectedColIndex);
  const insertRowIndex = selectedRowIndex + 1;
  const totalCols = body[0]?.length || 0;
  
  // 선택한 행의 데이터를 새 행에 깊은 복사 (rowspan 제외)
  const sourceRow = body[selectedRowIndex];
  if (sourceRow) {
    for (let colIndex = 0; colIndex < totalCols; colIndex++) {
      const sourceCell = sourceRow[colIndex];
      const newCell = newBody[insertRowIndex]?.[colIndex];
      
      if (sourceCell && newCell) {
        // rowspan 속성을 제외하고 나머지 모든 속성을 깊은 복사
        const { rowspan, ...cellDataWithoutRowspan } = sourceCell;
        // newCell의 rowspan은 유지하고 나머지 데이터만 복사
        Object.assign(newCell, JSON.parse(JSON.stringify(cellDataWithoutRowspan)));
      }
    }
  }
  
  return newBody;
}

/**
 * 행 삭제
 * division-head-rowspan-rule.md 규칙에 따른 구현:
 * r행을 삭제했을 경우:
 * - 삭제된 행에 rowspan=0인 셀이 있다면,
 *   - 해당 셀 위치에서 r에서 1씩 빼면서 셀을 순차적으로 방문
 *   - 방문한 셀의 rowspan > 0 인 경우, 해당 셀의 rowspan 값에 1을 빼고 반복문 종료
 * - 구분 헤드 바디의 행 수가 1이라면, 행은 삭제할 수 없다.
 */
export function removeRowFromDivisionHead(
  body: DivisionHeadBody,
  rowIndex: number
): DivisionHeadBody {
  if (!body || body.length === 0) return [];
  if (body.length <= 1) return body; // 최소 1개 행 유지
  
  const newBody = body.map(row => row.map(cell => ({ ...cell })));
  const rowToDelete = newBody[rowIndex];
  
  // 삭제된 행에 rowspan=0인 셀이 있는지 확인하고 rowspan 조정
  if (rowToDelete) {
    const totalCols = rowToDelete.length;
    
    for (let colIndex = 0; colIndex < totalCols; colIndex++) {
      const cell = rowToDelete[colIndex];
      
      if (cell?.rowspan === 0) {
        // 해당 셀 위치에서 r에서 1씩 빼면서 셀을 순차적으로 방문
        for (let r = rowIndex - 1; r >= 0; r--) {
          const prevCell = newBody[r]?.[colIndex];
          if (prevCell && prevCell.rowspan > 0) {
            // rowspan이 1보다 작아지지 않도록 보장 (최소값 1)
            prevCell.rowspan = Math.max(1, prevCell.rowspan - 1);
            break; // 즉시 반복문 종료
          }
        }
      }
    }
  }
  
  // 행 삭제
  newBody.splice(rowIndex, 1);
  
  return newBody;
}

/**
 * 열 추가
 * 새 열의 각 행에 rowspan: 1 기본값을 가진 셀 추가
 */
export function addColumnToDivisionHead(
  header: DivisionHeadHeader,
  body: DivisionHeadBody
): { header: DivisionHeadHeader; body: DivisionHeadBody } {
  const newHeader = [...header, { division_type: '' }];
  
  if (!body || body.length === 0) {
    return { header: newHeader, body: [[{ rowspan: 1 }]] };
  }
  
  // 새 열의 각 행에 rowspan: 1 기본값을 가진 셀 추가
  const newBody = body.map(row => {
    const newRow = [...row, { rowspan: 1 }];
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
    body: [[{ rowspan: 1 }]],
    isActive: true,
  };
}

