// components/results/snapshot/SnapshotComponent.tsx
// 읽기 전용 컴포넌트 렌더러 - 편집용 ComponentGrid 사용 안 함

'use client';

import * as React from 'react';
import type { FlowBlock } from '@/types/block-structure';
import { SnapshotBlock } from './SnapshotBlock';
import { SnapshotCell } from './SnapshotCell';
import styles from '../snapshot.module.css';

interface SnapshotComponentProps {
  componentId: number;
  name?: string | null;
  divisionHeadHeader?: any;
  divisionHeadBody?: any;
  divisionHeadActive: boolean;
  blocks: FlowBlock[];
}

/**
 * 읽기 전용 컴포넌트 렌더러
 * 편집용 ComponentGrid 사용 안 함
 */
export const SnapshotComponent: React.FC<SnapshotComponentProps> = ({
  componentId,
  name,
  divisionHeadHeader,
  divisionHeadBody,
  divisionHeadActive,
  blocks
}) => {
  return (
    <div className={styles.snapshotComponentCard}>
      {/* 컴포넌트 헤더 */}
      <div className={styles.snapshotComponentHeader}>
        <span className={styles.componentOrder}>{componentId}</span>
        <h3 className={styles.componentName}>
          {name || `Component ${componentId}`}
        </h3>
      </div>

      {/* 컴포넌트 그리드 */}
      <div className={styles.snapshotComponentGrid}>
        {/* 구분 헤드 (활성화된 경우) */}
        {divisionHeadActive && (divisionHeadHeader || divisionHeadBody) && (
          <div className={styles.divisionHeadSection}>
            {divisionHeadHeader && Array.isArray(divisionHeadHeader) && divisionHeadHeader.length > 0 && (
              <div className={styles.divisionHeadHeader}>
                {divisionHeadHeader.map((cell: any, idx: number) => (
                  <div key={`dh-h-${idx}`} className={styles.divisionHeadCell}>
                    <SnapshotCell cell={cell} />
                  </div>
                ))}
              </div>
            )}
            {divisionHeadBody && Array.isArray(divisionHeadBody) && divisionHeadBody.length > 0 && (
              <div className={styles.divisionHeadBody}>
                {divisionHeadBody.map((row: any, rowIdx: number) => {
                  // row가 배열이 아닌 경우도 처리
                  const rowArray = Array.isArray(row) ? row : [row];
                  return (
                    <div key={`dh-b-${rowIdx}`} className={styles.divisionHeadRow}>
                      {rowArray.map((cell: any, colIdx: number) => (
                        <div key={`dh-b-${rowIdx}-${colIdx}`} className={styles.divisionHeadCell}>
                          <SnapshotCell cell={cell} />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 블록들 */}
        <div className={styles.blocksSection}>
          {blocks.map((block) => (
            <SnapshotBlock key={block.block_id} block={block} />
          ))}
        </div>
      </div>
    </div>
  );
};

