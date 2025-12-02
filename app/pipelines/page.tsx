'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePipelines } from '@/store/usePipelines';
import { useEffect, useMemo, useState } from 'react';
import { useUniversity } from '@/store/useUniversity';
import styles from './page.module.css';

export default function PipelinesPage() {
  const { pipelines, add, remove, setAll } = usePipelines();
  const { selectedUnivId } = useUniversity();
  const [showModal, setShowModal] = useState(false);
  const [configName, setConfigName] = useState('');

  // 선택된 대학교 변경 시 DB에서 목록 동기화
  useEffect(() => {
    const syncFromDb = async () => {
      console.log('🔍 syncFromDb 호출됨, selectedUnivId:', selectedUnivId);
      if (!selectedUnivId) { 
        console.log('❌ selectedUnivId가 없어서 빈 배열로 설정');
        setAll([]); 
        return; 
      }
      try {
        console.log('📡 API 호출 시작:', `/api/pipelines?univId=${selectedUnivId}`);
        const res = await fetch(`/api/pipelines?univId=${selectedUnivId}`);
        if (!res.ok) throw new Error('목록 조회 실패');
        const json = await res.json();
        console.log('📋 API 응답 전체:', json);
        console.log('📋 API 응답 pipelines:', json.data.pipelines);
        
        // 각 파이프라인 객체의 구조를 자세히 확인
        json.data.pipelines.forEach((p: any, index: number) => {
          console.log(`📋 파이프라인 ${index}:`, p);
          console.log(`📋 파이프라인 ${index} 속성들:`, Object.keys(p));
        });
        
        const mapped = json.data.pipelines.map((p: any) => ({
          id: `${selectedUnivId}:${p.configName}`,
          name: p.name,
          version: p.version,
          isActive: true,
          components: [],
        }));
        console.log('🔄 매핑된 파이프라인:', mapped);
        setAll(mapped);
        console.log('✅ setAll 호출 완료');
      } catch (e) {
        console.error('❌ syncFromDb 에러:', e);
        setAll([]);
      }
    };
    syncFromDb();
  }, [selectedUnivId, setAll]);

  // 선택된 대학교 기준 파이프라인 필터링 (id prefix 규칙)
  const filteredPipelines = useMemo(() => {
    console.log('🔍 필터링 시작');
    console.log('📊 전체 pipelines:', pipelines);
    console.log('🏫 selectedUnivId:', selectedUnivId);
    
    if (!selectedUnivId) {
      console.log('❌ selectedUnivId가 없어서 전체 pipelines 반환:', pipelines);
      return pipelines;
    }
    
    const filtered = pipelines.filter(p => {
      const hasCorrectPrefix = typeof p.id === 'string' && p.id.startsWith(`${selectedUnivId}:`);
      console.log(`🔍 파이프라인 ${p.id} 필터링:`, { hasCorrectPrefix, prefix: `${selectedUnivId}:` });
      return hasCorrectPrefix;
    });
    
    console.log('✅ 필터링 결과:', filtered);
    return filtered;
  }, [pipelines, selectedUnivId]);

  return (
    <>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>파이프라인</h1>
          <div className={styles.headerActions}>
            {!selectedUnivId && (
              <div className={styles.universityNotice}>사이드바에서 대학교를 선택하세요</div>
            )}
            <button
              className={styles.newPipelineButton}
              onClick={() => selectedUnivId && setShowModal(true)}
              disabled={!selectedUnivId}
            >
              새 파이프라인
            </button>
          </div>
        </div>

        <div className={styles.pipelineList}>
          {filteredPipelines.map(p => (
            <div key={p.id} className={styles.pipelineItem}>
              <div className={styles.pipelineInfo}>
                <div className={styles.pipelineName}>{p.name}</div>
                <div className={styles.pipelineMeta}>id: {p.id} · ver: {p.version}</div>
              </div>
              <div className={styles.pipelineActions}>
                <Link className={styles.actionButton} href={`/pipelines/${encodeURIComponent(String(p.id))}/edit`}>편집</Link>
                <Link 
                  className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
                  href={`/grade-results?pipelineId=${encodeURIComponent(String(p.id))}`}
                >
                  성적 결과
                </Link>
                <button
                  className={styles.actionButton}
                  onClick={async () => {
                    try {
                      const idStr = String(p.id);
                      if (!idStr.includes(':')) {
                        // 구형 로컬 아이디일 수 있으므로 로컬만 제거
                        remove(p.id);
                        return;
                      }
                      const [univId, configName] = idStr.split(':', 2);
                      const res = await fetch('/api/pipelines/delete', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ univId, configName })
                      });
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({} as any));
                        throw new Error(err.message || '삭제 실패');
                      }
                      remove(p.id);
                    } catch (e) {
                      alert('삭제 실패: ' + (e as Error).message);
                    }
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
          {filteredPipelines.length === 0 && (
            <div className={styles.emptyState}>파이프라인이 없습니다. "새 파이프라인"을 눌러 시작하세요.</div>
          )}
        </div>
      </div>

      {showModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalTitle}>모집시기명 입력</div>
            <input
              className={styles.modalInput}
              placeholder="예: 2026-수시"
              value={configName}
              onChange={e => setConfigName(e.target.value)}
            />
            <div className={styles.modalActions}>
              <button className={styles.modalButton} onClick={() => { setShowModal(false); setConfigName(''); }}>취소</button>
              <button
                className={`${styles.modalButton} ${styles.modalButtonPrimary}`}
                disabled={!configName.trim()}
                onClick={async () => {
                  try {
                    // 서버에 파이프라인 보장
                    const res = await fetch('/api/pipelines/ensure', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ univId: selectedUnivId, configName: configName.trim(), name: configName.trim(), version: 'v0' })
                    });
                    if (!res.ok) throw new Error('파이프라인 생성 실패');
                    const data = await res.json();
                    // 로컬 스토어에 추가(표시용)
                    add({ id: `${selectedUnivId}:${configName.trim()}`, name: configName.trim(), version: 'v0' });
                    setShowModal(false);
                    setConfigName('');
                  } catch (e) {
                    alert('생성 실패: ' + (e as Error).message);
                  }
                }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
