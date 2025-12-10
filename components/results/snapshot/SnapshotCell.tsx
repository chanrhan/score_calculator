// components/results/snapshot/SnapshotCell.tsx
// 읽기 전용 셀 렌더러 - 텍스트만 표시, 편집 UI 요소 없음

'use client';

import * as React from 'react';
import styles from '../snapshot.module.css';

interface SnapshotCellProps {
  cell: any;
}

/**
 * 읽기 전용 셀 렌더러
 * FlowCell의 elements를 텍스트로만 렌더링
 */
export const SnapshotCell: React.FC<SnapshotCellProps> = ({ cell }) => {
  if (!cell || cell === null || cell === undefined) {
    return <div className={styles.emptyCell} />;
  }

  // FlowCell 형태 (elements 배열 포함)
  if (cell.elements && Array.isArray(cell.elements)) {
    return (
      <div className={styles.cellContent}>
        {cell.elements.map((element: any, idx: number) => (
          <SnapshotElement key={idx} element={element} />
        ))}
      </div>
    );
  }

  // CellElement 자체인 경우
  if (cell.type && typeof cell.type === 'string') {
    return (
      <div className={styles.cellContent}>
        <SnapshotElement element={cell} />
      </div>
    );
  }

  // 객체인 경우 (divisionHead 등)
  if (typeof cell === 'object' && !Array.isArray(cell)) {
    // elements가 있는 경우 먼저 처리
    if (cell.elements && Array.isArray(cell.elements)) {
      return (
        <div className={styles.cellContent}>
          {cell.elements.map((element: any, idx: number) => (
            <SnapshotElement key={idx} element={element} />
          ))}
        </div>
      );
    }

    // type이 있는 경우 (CellElement)
    if (cell.type) {
      return (
        <div className={styles.cellContent}>
          <SnapshotElement element={cell} />
        </div>
      );
    }

    // 일반 객체의 경우 키-값을 텍스트로 변환
    const entries = Object.entries(cell);
    if (entries.length > 0) {
      const texts: string[] = [];
      entries.forEach(([key, value]) => {
        // value가 객체가 아닌 경우만 추가
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          const text = Array.isArray(value) 
            ? value.map(v => String(v || '')).join(', ')
            : String(value || '');
          if (text) {
            texts.push(text);
          }
        }
      });
      
      if (texts.length > 0) {
        return (
          <div className={styles.cellContent}>
            <span className={styles.textElement}>{texts.join(' ')}</span>
          </div>
        );
      }
    }
    return <div className={styles.emptyCell} />;
  }

  // 배열인 경우
  if (Array.isArray(cell)) {
    return (
      <div className={styles.cellContent}>
        {cell.map((item: any, idx: number) => (
          <SnapshotCell key={idx} cell={item} />
        ))}
      </div>
    );
  }

  // 단순 값인 경우
  return (
    <div className={styles.cellContent}>
      <span className={styles.textElement}>{String(cell || '')}</span>
    </div>
  );
};

/**
 * Element 렌더링 - 텍스트만 표시
 */
function SnapshotElement({ element }: { element: any }): React.ReactNode {
  if (!element || element === null || element === undefined) {
    return null;
  }

  // element가 객체가 아닌 경우 (문자열, 숫자 등)
  if (typeof element !== 'object') {
    return (
      <span className={styles.textElement}>
        {String(element)}
      </span>
    );
  }

  // type이 없는 경우 (잘못된 데이터)
  if (!element.type) {
    // content나 value가 있으면 표시
    const text = element.content !== undefined ? element.content : element.value;
    if (text !== undefined && text !== null) {
      return (
        <span className={styles.textElement}>
          {String(text)}
        </span>
      );
    }
    return null;
  }

  switch (element.type) {
    case 'Text':
      return (
        <span className={styles.textElement}>
          {element.content || ''}
        </span>
      );

    case 'Table':
      return <SnapshotTable element={element} />;

    default:
      // 모든 타입은 텍스트로 표시
      const text = element.content !== undefined ? element.content : element.value;
      if (text !== undefined && text !== null) {
        return (
          <span className={styles.textElement}>
            {String(text)}
          </span>
        );
      }
      return null;
  }
}

/**
 * 테이블 렌더링 - 읽기 전용
 */
function SnapshotTable({ element }: { element: any }): React.ReactNode {
  const values = element.value || [];
  
  if (!Array.isArray(values) || values.length === 0) {
    return <div className={styles.emptyTable}>빈 테이블</div>;
  }

  // 2차원 배열로 변환
  const rows = Array.isArray(values[0]) ? values : [values];

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.readOnlyTable}>
        <thead>
          <tr>
            {rows[0] && rows[0].map((_, colIdx: number) => (
              <th key={colIdx} className={styles.tableHeader}>
                {element.input_type ? `입력` : element.output_type ? `출력` : `열 ${colIdx + 1}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any[], rowIdx: number) => (
            <tr key={rowIdx}>
              {row.map((cell: any, cellIdx: number) => (
                <td key={cellIdx} className={styles.tableCell}>
                  {safeStringify(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * 안전하게 문자열로 변환 (객체 방지)
 */
function safeStringify(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    // 객체인 경우 content나 value 속성이 있으면 사용
    if (value.content !== undefined) {
      return String(value.content);
    }
    if (value.value !== undefined) {
      return String(value.value);
    }
    // 객체의 키-값을 문자열로 변환
    const entries = Object.entries(value);
    const texts = entries
      .filter(([_, v]) => typeof v !== 'object' || v === null)
      .map(([_, v]) => String(v || ''));
    return texts.join(' ');
  }
  return String(value);
}

