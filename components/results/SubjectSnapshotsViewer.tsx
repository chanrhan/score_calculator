'use client';

import * as React from 'react';
import type { Subject, Snapshot, CalculationLog } from '@/types/domain';
import { useResultsHighlight } from '@/components/results/ResultsHighlightContext';
import { useLogKeyHighlight } from './LogKeyHighlightContext';
import styles from './SubjectSnapshotsViewer.module.css';
import keyStyles from './KeyHighlighter.module.css';
import { BLOCK_TYPE_MAP } from '@/types/block-types';
import { Subject_Separation } from '@/types/text-mapping';

type Props = {
  subject: Subject | null;
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

export default function SubjectSnapshotsViewer({ subject }: Props) {
  const { setHighlights, setSelectedSubject, focusBlockById } = useResultsHighlight();
  const [activeKey, setActiveKey] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    try { console.log('[SnapshotViewer] mounted snapshots', { count: subject?.snapshot?.length || 0, subject: subject?.subjectName }); } catch {}
  }, [subject]);

  const snapshots: Snapshot[] = subject?.snapshot || [];

  // 과목이 변경될 때마다 block_id와 case_index 기반으로 하이라이트 정보 갱신
  // 모든 hooks는 조건부 return 전에 호출해야 합니다
  React.useEffect(() => {
    if (subject) {
      setHighlights({ snapshots });
      setSelectedSubject(subject);
    }
  }, [subject, snapshots, setHighlights, setSelectedSubject]);

  if (!subject) {
    return (
      <div className={styles.empty}>과목이 선택되지 않았습니다.</div>
    );
  }

  return (  
    <div className={styles.viewer}>
      <div className={styles.header}>
        <div className={styles.title}>{subject.subjectName}</div>
        <div className={styles.meta}>
          <span>{subject.subjectGroup}</span>
          <span>· {subject.unit}학점</span>
          <span>· {subject.grade}학년 {subject.term}학기</span>
          <span>· {Subject_Separation[subject.subjectSeparationCode as keyof typeof Subject_Separation]}</span>
        </div>
      </div>

      {snapshots.length === 0 ? (
        <div className={styles.empty}>스냅샷이 없습니다.</div>
      ) : (
        <div className={styles.horizontalList}>
          {snapshots.map((snap, idx) => (
            <div
              key={`${snap.block_id}-${snap.case_index}-${idx}`}
              className={`${styles.card} ${activeKey === `${snap.block_id}:${snap.case_index}` ? styles.cardActive : ''}`}
              onMouseEnter={() => setActiveKey(`${snap.block_id}:${snap.case_index}`)}
              onMouseLeave={() => setActiveKey(prev => (prev === `${snap.block_id}:${snap.case_index}` ? null : prev))}
              onClick={() => {
                try { console.log('[SnapshotViewer] click card', { blockId: snap.block_id, caseIndex: snap.case_index }); } catch {}
                setActiveKey(`${snap.block_id}:${snap.case_index}`);
                focusBlockById(snap.block_id);
              }}
              onMouseDown={() => { try { console.log('[SnapshotViewer] mousedown', { blockId: snap.block_id }); } catch {} }}
              onMouseUp={() => { try { console.log('[SnapshotViewer] mouseup', { blockId: snap.block_id }); } catch {} }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  try { console.log('[SnapshotViewer] key activate card', { blockId: snap.block_id, caseIndex: snap.case_index }); } catch {}
                  setActiveKey(`${snap.block_id}:${snap.case_index}`);
                  focusBlockById(snap.block_id);
                }
              }}
            >
              <div className={styles.cardHeader}>
                {/* 보조 클릭 영역 */}
                <div onClick={(e) => { e.stopPropagation(); try { console.log('[SnapshotViewer] click header'); } catch {}; focusBlockById(snap.block_id); }} />
                <div className={styles.cardTitle}>{BLOCK_TYPE_MAP[snap.block_type as keyof typeof BLOCK_TYPE_MAP]}</div>
                <div className={styles.cardMeta}>Block ID #{snap.block_id}</div>
              </div>
              <div className={styles.cardBody} onClick={(e) => { e.stopPropagation(); try { console.log('[SnapshotViewer] click body'); } catch {}; focusBlockById(snap.block_id); }}>
                {snap.logs && snap.logs.length > 0 ? (
                  <div className={styles.logs}>
                    {snap.logs.map((log: CalculationLog, lidx) => (
                      <div key={lidx} className={styles.logRow}>
                        <div className={styles.logGrid}>
                          <div className={`${styles.ioCard} ${styles.inputCard}`}>
                            <div className={styles.ioHeader}>입력</div>
                            <div className={styles.ioKey}><KeyDisplay value={log.input_key} /></div>
                            <div className={styles.ioValue}>{formatValue(log.input)}</div>
                          </div>
                          <div className={`${styles.ioCard} ${styles.outputCard}`}>
                            <div className={styles.ioHeader}>출력</div>
                            <div className={styles.ioKey}><KeyDisplay value={log.output_key} /></div>
                            <div className={styles.ioValue}>{formatValue(log.output)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.noLogs}>로그가 없습니다.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
