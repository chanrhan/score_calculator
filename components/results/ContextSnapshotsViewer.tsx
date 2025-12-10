'use client';

import * as React from 'react';
import type { Snapshot, CalculationLog } from '@/types/domain';
import { useResultsHighlight } from '@/components/results/ResultsHighlightContext';
import { useLogKeyHighlight } from './LogKeyHighlightContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import styles from './ContextSnapshotsViewer.module.css';
import keyStyles from './KeyHighlighter.module.css';

type Props = {
  snapshots: Snapshot[] | null | undefined;
};

// KeyDisplay Component for consistent key visualization
const KeyDisplay = ({ value }: { value: string | null | undefined }) => {
  const { keyColorMap, hoveredKey, setHoveredKey } = useLogKeyHighlight();

  if (!value) return <span className={keyStyles.keyText}>-</span>;

  const color = keyColorMap.get(value);
  const isHighlighted = hoveredKey === value;

  return (
    <div
      className={`${keyStyles.keyWrapper} ${isHighlighted ? keyStyles.highlighted : ''}`}
      onMouseEnter={() => setHoveredKey(value)}
      onMouseLeave={() => setHoveredKey(null)}
      role="button"
      tabIndex={0}
    >
      {color && <div className={keyStyles.keyDot} style={{ backgroundColor: color }} />}
      <span className={keyStyles.keyText}>{value}</span>
    </div>
  );
};


function formatValue(value: any): string {
  try {
    if (value == null) return '';
    const json = JSON.stringify(value);
    return json.length > 120 ? json.slice(0, 117) + '…' : json;
  } catch {
    return String(value);
  }
}

export default function ContextSnapshotsViewer({ snapshots }: Props) {
  const { setHighlights, focusBlockById } = useResultsHighlight();
  const [activeKey, setActiveKey] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    try { console.log('[ContextSnapshotViewer] mounted snapshots', { count: snapshots?.length || 0 }); } catch {}
  }, [snapshots]);

  // Context 로그가 변경될 때마다 block_id와 case_index 기반으로 하이라이트 정보 갱신
  // 모든 hooks는 조건부 return 전에 호출해야 합니다
  React.useEffect(() => {
    if (snapshots && snapshots.length > 0) {
      setHighlights({ snapshots });
    }
  }, [snapshots, setHighlights]);

  if (!snapshots || snapshots.length === 0) {
    return (
      <div className={styles.empty}>Context 로그가 없습니다.</div>
    );
  }

  // 모든 스냅샷의 로그를 하나의 배열로 평탄화
  const allLogs: Array<{ log: CalculationLog; blockId: number }> = [];
  snapshots.forEach((snap) => {
    if (snap.logs && snap.logs.length > 0) {
      snap.logs.forEach((log) => {
        allLogs.push({ log, blockId: snap.block_id });
      });
    }
  });

  if (allLogs.length === 0) {
    return (
      <div className={styles.viewer}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <div className={styles.titleBar}></div>
            <div className={styles.title}>Context 로그</div>
          </div>
        </div>
        <div className={styles.empty}>로그가 없습니다.</div>
      </div>
    );
  }

  return (  
    <div className={styles.viewer}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <div className={styles.titleBar}></div>
          <div className={styles.title}>Context 로그</div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={styles.tableHeaderCell}>입력</TableHead>
              <TableHead className={styles.tableHeaderCell}>출력</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allLogs.map((item, idx) => (
              <TableRow
                key={idx}
                className={styles.tableRow}
                onClick={() => {
                  try { console.log('[ContextSnapshotViewer] click row', { blockId: item.blockId }); } catch {};
                  focusBlockById(item.blockId);
                }}
                onMouseEnter={() => setActiveKey(`${item.blockId}:${idx}`)}
                onMouseLeave={() => setActiveKey(null)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    focusBlockById(item.blockId);
                  }
                }}
              >
                <TableCell className={styles.tableCell}>
                  <div className={styles.cellContent}>
                    <div className={styles.keyWrapper}>
                      <KeyDisplay value={item.log.input_key} />
                    </div>
                    <div className={styles.valueWrapper}>
                      <span className={styles.valueText}>{formatValue(item.log.input)}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className={styles.tableCell}>
                  <div className={styles.cellContent}>
                    <div className={styles.keyWrapper}>
                      <KeyDisplay value={item.log.output_key} />
                    </div>
                    <div className={styles.valueWrapper}>
                      <span className={styles.valueText}>{formatValue(item.log.output)}</span>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
