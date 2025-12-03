// app/grade-results/page.tsx
// 성적 계산 결과 페이지

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Download, Search, Filter, Play, Clock, ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import { useUniversity } from '@/store/useUniversity';
import Canvas from '@/components/builder/PipelineEditor/Canvas';
import GradeResultsSidebar from '@/components/builder/PipelineEditor/GradeResultsSidebar';
import StudentSubjectsPanel from '@/components/builder/PipelineEditor/StudentSubjectsPanel';
import { ResultsHighlightProvider, useResultsHighlight } from '@/components/results/ResultsHighlightContext';
import { usePipelines } from '@/store/usePipelines';
import { convertComponentGridsToPipelineComponents } from '@/lib/adapters/pipelineLoader';
import styles from './page.module.css';
import type { Subject as DomainSubject, Snapshot } from '@/types/domain';
import SubjectSnapshotsViewer from '../../components/results/SubjectSnapshotsViewer';
import ContextSnapshotsViewer from '../../components/results/ContextSnapshotsViewer';

interface GradeResult {
  studentId: string;
  finalScore: number;
  rank: number;
  tieBreaker: any;
  createdAt: string;
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface Pipeline {
  id: string;
  name: string;
  version: string;
  configName: string;
  createdAt: string;
  resultCount: number;
}

export default function GradeResultsPage() {
  const searchParams = useSearchParams();
  const pipelineId = searchParams.get('pipelineId');
  const { selectedUnivId, universities } = useUniversity();

  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>(pipelineId || '');
  const [results, setResults] = useState<GradeResult[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    limit: 100,
    offset: 0,
    hasMore: false
  });
  const [isLoadingPipelines, setIsLoadingPipelines] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderBy, setOrderBy] = useState<'final_score' | 'rank'>('final_score');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  // 좌측 패널/과목 패널 상태
  const [isResultsPanelExpanded, setIsResultsPanelExpanded] = useState(true);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<DomainSubject | null>(null);
  const [contextSnapshots, setContextSnapshots] = useState<Snapshot[] | null>(null);

  // 파이프라인 스토어 연동 (캔버스 표시 목적)
  const { getById: getPipelineById, add: addPipeline, update: updatePipeline } = usePipelines();
  const [localCanvasPipelineId, setLocalCanvasPipelineId] = useState<string | null>(null);

  // 파이프라인 컴포넌트 로딩 (DB → store)
  const loadPipelineComponentsToStore = useCallback(async (dbId: string) => {
    try {
      const params = new URLSearchParams({ pipelineId: dbId });
      const res = await fetch(`/api/components/load?${params}`);
      if (!res.ok) throw new Error('파이프라인 컴포넌트 로딩 실패');
      const json = await res.json();
      const comps = convertComponentGridsToPipelineComponents(json?.data?.components || []);
      // store에 파이프라인가 없으면 추가, 있으면 갱신
      const existing = getPipelineById(dbId);
      if (!existing) {
        const created = addPipeline({ id: dbId, name: `Pipeline ${dbId}` });
        updatePipeline(created.id, { components: comps });
        setLocalCanvasPipelineId(created.id);
      } else {
        updatePipeline(existing.id, { components: comps });
        setLocalCanvasPipelineId(existing.id);
      }
    } catch (e) {
      console.error(e);
    }
  }, [addPipeline, getPipelineById, updatePipeline]);

  // 파이프라인 목록 조회 함수
  const fetchPipelines = async () => {
    if (!selectedUnivId) return;

    setIsLoadingPipelines(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        univId: selectedUnivId
      });

      console.log(`📋 파이프라인 목록 조회 중... (학교코드: ${selectedUnivId})`);

      const response = await fetch(`/api/pipelines?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '파이프라인 목록 조회 실패');
      }

      const data = await response.json();
      
      if (data.success) {
        setPipelines(data.data.pipelines);
        console.log(`✅ 파이프라인 목록 조회 완료: ${data.data.pipelines.length}개`);
        
        // URL에서 pipelineId가 있고 목록에 존재하면 자동 선택
        if (pipelineId && data.data.pipelines.some((p: Pipeline) => p.id === pipelineId)) {
          setSelectedPipelineId(pipelineId);
        }
      } else {
        throw new Error(data.message || '파이프라인 목록 조회 실패');
      }
    } catch (error) {
      console.error('❌ 파이프라인 목록 조회 에러:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoadingPipelines(false);
    }
  };

  // 결과 조회 함수
  const fetchResults = async (resetPagination = false) => {
    if (!selectedPipelineId) return;

    setIsLoading(true);
    setError(null);

    try {
      const offset = resetPagination ? 0 : pagination.offset;
      const params = new URLSearchParams({
        pipelineId: selectedPipelineId,
        limit: pagination.limit.toString(),
        offset: offset.toString(),
        orderBy,
        order
      });

      console.log(`📊 성적 계산 결과 조회 중... (Pipeline ID: ${selectedPipelineId})`);

      const response = await fetch(`/api/grade-results?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '결과 조회 실패');
      }

      const data = await response.json();
      
      if (data.success) {
        setResults(resetPagination ? data.data.results : [...results, ...data.data.results]);
        setPagination(data.data.pagination);
        console.log(`✅ 결과 조회 완료: ${data.data.results.length}개`);
      } else {
        throw new Error(data.message || '결과 조회 실패');
      }
    } catch (error) {
      console.error('❌ 결과 조회 에러:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    if (selectedUnivId) {
      fetchPipelines();
    }
  }, [selectedUnivId]);

  useEffect(() => {
    if (selectedPipelineId) {
      fetchResults(true);
      loadPipelineComponentsToStore(selectedPipelineId);
    }
  }, [selectedPipelineId, orderBy, order, loadPipelineComponentsToStore]);

  // 파이프라인 선택 핸들러
  const handlePipelineSelect = (pipelineId: string) => {
    setSelectedPipelineId(pipelineId);
    setResults([]); // 이전 결과 초기화
    setPagination({
      total: 0,
      limit: 100,
      offset: 0,
      hasMore: false
    });
  };

  // 검색 필터링
  const filteredResults = results.filter(result =>
    result.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 엑셀(xlsx) 내보내기: pipelineId 전체 결과(identifyNumber, finalScore) 다운로드
  const exportToExcel = async () => {
    if (!selectedPipelineId) return;
    try {
      const params = new URLSearchParams({ pipelineId: selectedPipelineId });
      const res = await fetch(`/api/grade-results/export?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || '엑셀 다운로드 실패');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `grade_results_pipeline_${selectedPipelineId}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  // 결과 복사: pipelineId 전체 결과의 finalScore만(식별번호 오름차순 기준) 클립보드로 복사
  const copyScoresToClipboard = async () => {
    if (!selectedPipelineId) return;
    try {
      const params = new URLSearchParams({ pipelineId: selectedPipelineId });
      const res = await fetch(`/api/grade-results/copy?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || '결과 복사 실패');
      }
      const text = await res.text();
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error(e);
    }
  };

  if (!selectedUnivId) {
    return (
      <div className={styles.container}>
        <div className={styles.noSelectionContainer}>
          <h1 className={styles.noSelectionTitle}>성적 계산 결과</h1>
          <p className={styles.noSelectionMessage}>학교를 먼저 선택해주세요.</p>
          <Button onClick={() => window.history.back()}>
            이전 페이지로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ResultsHighlightProvider>
      <div className={styles.mainContainer}>
        {/* 상단 헤더: 제목 + 소형 파이프라인 드롭다운 + 새로고침/CSV 버튼 */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerLeft}>
              <div className={styles.headerTitle}>성적 계산 결과</div>
              <div className={styles.headerSubtitle}>
                {universities.find(u => u.id === selectedUnivId)?.name || '선택된 학교'}
                {selectedPipelineId && ` · Pipeline ${selectedPipelineId}`}
              </div>
            </div>
            <div className={styles.headerRight}>
              <Select
                value={selectedPipelineId}
                onValueChange={handlePipelineSelect}
                disabled={isLoadingPipelines}
              >
                <SelectTrigger className={styles.selectTrigger}>
                  <SelectValue placeholder={isLoadingPipelines ? '파이프라인 로딩 중...' : '파이프라인 선택'} />
                </SelectTrigger>
                <SelectContent className={styles.selectContent}>
                  {pipelines.map((p) => (
                    <SelectItem key={p.id} value={p.id} className={styles.selectItem}>
                      <div className={styles.selectItemContent}>
                        <div className={styles.selectItemLeft}>
                          <div className={styles.selectItemName}>{p.name}</div>
                          <div className={styles.selectItemMeta}>v{p.version} • {p.resultCount.toLocaleString()}개</div>
                        </div>
                        <div className={styles.selectItemDate}>{new Date(p.createdAt).toLocaleDateString('ko-KR')}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className={styles.headerActions}>
              <Button onClick={() => fetchPipelines()} disabled={isLoadingPipelines} variant="outline" size="sm">
                <RefreshCw className={`${styles.actionButtonIcon} ${isLoadingPipelines ? styles.actionButtonIconSpinning : ''}`} />
              </Button>
              <Button onClick={copyScoresToClipboard} disabled={!selectedPipelineId} variant="outline" size="sm" aria-label="결과 복사">
                <Copy className={styles.actionButtonIcon} />
              </Button>
              <Button onClick={exportToExcel} disabled={!selectedPipelineId} variant="outline" size="sm">
                <Download className={styles.actionButtonIcon} />
              </Button>
            </div>
          </div>
        </div>

        {/* 본문: 좌측 패널 + 우측(캔버스/상세 패널) 2단 레이아웃 */}
        <div className={styles.contentArea}>
          {/* 좌측 학생 결과 패널 (오버레이 기준 컨테이너) */}
          <div className={styles.leftPanel}>
            <GradeResultsSidebar 
              dbPipelineId={selectedPipelineId ? Number(selectedPipelineId) : undefined}
              onSelectStudent={(sid) => { setActiveStudentId(sid); setIsResultsPanelExpanded(true); }}
              isExpanded={isResultsPanelExpanded}
              onToggle={setIsResultsPanelExpanded}
            />

            {activeStudentId && (
              <div className={styles.subjectsOverlay}>
                <StudentSubjectsPanel 
                  studentId={activeStudentId}
                  dbPipelineId={selectedPipelineId ? Number(selectedPipelineId) : undefined}
                  onClose={() => { setActiveStudentId(null); setSelectedSubject(null); setContextSnapshots(null); }}
                  onSelectSubject={(subject) => { setSelectedSubject(subject); setActiveTab('subject'); console.log('[GradeResultsPage] onSelectSubject', { subjectName: subject.subjectName, snapshots: subject.snapshot?.length }); }}
                  onContextSnapshotsLoaded={(snapshots) => { setContextSnapshots(snapshots); }}
                />
              </div>
            )}
          </div>

          {/* 우측 영역: 상단 캔버스 + 중간 Context 로그 + 하단 과목 상세 패널 */}
          <div className={styles.rightArea}>
            <div className={styles.canvasArea}>
              {localCanvasPipelineId ? (
                <div className={styles.canvasContainer}>
                  <Canvas pipelineId={localCanvasPipelineId} dbPipelineId={selectedPipelineId ? Number(selectedPipelineId) : undefined} readOnly />
                </div>
              ) : (
                <div className={styles.canvasPlaceholder}>
                  파이프라인을 선택하면 캔버스가 표시됩니다.
                </div>
              )}
            </div>

            {/* 중간: Context 로그 패널 (학생 선택 시 표시) */}
            {activeStudentId && contextSnapshots && contextSnapshots.length > 0 && (
              <div className={styles.contextLogPanel}>
                <ContextSnapshotsViewer snapshots={contextSnapshots} />
              </div>
            )}

            {/* 하단: 과목 상세 패널 */}
            <div className={styles.bottomPanel}>
              {selectedSubject ? (
                <SubjectSnapshotsViewer subject={selectedSubject} />
              ) : (
                <div className={styles.bottomPanelPlaceholder}>
                  과목을 선택하면 스냅샷 상세가 표시됩니다.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ResultsHighlightProvider>
  );
}