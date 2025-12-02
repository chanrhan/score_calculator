'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePipelines } from '@/store/usePipelines';
import { useUniversity } from '@/store/useUniversity';
import Canvas from '@/components/builder/PipelineEditor/Canvas';
import { createFlowBlockFromKind, getBlockTypeNameById, getBlockTypeId } from '@/lib/blockManager';
import { convertComponentGridsToPipelineComponents, createEmptyPipeline } from '@/lib/adapters/pipelineLoader';
import { useBlockData } from '@/lib/hooks/useBlockData';
import { usePipelineVariables } from '@/store/usePipelineVariables';
import { toast } from 'sonner';
import styles from './page.module.css';

// DB pipeline id 사용 (ensure 후 세팅)

export default function PipelineEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { getById, update, add } = usePipelines();
  const { selectedUnivId } = useUniversity();
  const { blockData, tokenMenus } = useBlockData(selectedUnivId || '');
  const { load: loadVars, clear: clearVars } = usePipelineVariables();
  const [pipeline, setPipeline] = React.useState(() => getById(params.id));
  const [isSaving, setIsSaving] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [dbPipelineId, setDbPipelineId] = React.useState<number | null>(null);
  const [showSavedNotice, setShowSavedNotice] = React.useState(false);
  const [isCalculating, setIsCalculating] = React.useState(false);
  const [calculationProgress, setCalculationProgress] = React.useState(0);
  const [calculationMode, setCalculationMode] = React.useState<0 | 1>(0); // 0: 전체, 1: 조건부
  const [studentIds, setStudentIds] = React.useState<string[]>([]);

  // 파이프라인 보장 후 DB에서 파이프라인 데이터 로딩
  React.useEffect(() => {
    const loadPipelineFromDb = async () => {
      if (!params.id) return;
      
      setIsLoading(true);
      setLoadError(null);
      
      try {
        // params.id는 URL 인코딩되어 들어올 수 있으므로 우선 디코딩
        const rawId = decodeURIComponent(String(params.id));

        // params.id 형식: `${univId}:${configName}`
        // 콜론이 없으면 전역 선택된 대학교를 사용
        let parsedUnivId: string;
        let parsedConfigName: string;
        if (rawId.includes(':')) {
          const [u, c] = rawId.split(':', 2);
          parsedUnivId = u;
          parsedConfigName = c;
        } else {
          if (!selectedUnivId || selectedUnivId.length !== 3) {
            throw new Error('대학교가 선택되지 않았습니다. 사이드바에서 대학교를 선택해주세요.');
          }
          parsedUnivId = selectedUnivId;
          parsedConfigName = rawId;
        }

        // 로컬 스토어에서 사용할 정규화된 파이프라인 ID (항상 univId:configName 형태)
        const localPipelineId = `${parsedUnivId}:${parsedConfigName}`;

        // 파이프라인 보장 (복합키 기반)
        const ensureRes = await fetch('/api/pipelines/ensure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ univId: parsedUnivId, configName: parsedConfigName, name: parsedConfigName, version: 'v0' })
        });
        if (!ensureRes.ok) {
          const err = await ensureRes.json().catch(() => ({} as any));
          throw new Error(err.message || 'Failed to ensure pipeline');
        }
        const ensured = await ensureRes.json();
        const pipelineId = Number(ensured?.data?.id);
        setDbPipelineId(pipelineId);
        // 파이프라인 변수 로드
        if (parsedUnivId && Number.isFinite(pipelineId)) {
          try { await loadVars(parsedUnivId, pipelineId); } catch {}
        }
        
        
        // 로컬 스토어에 파이프라인 엔트리가 없으면 생성 (정규화된 ID 기준)
        if (!getById(localPipelineId)) {
          add({ id: localPipelineId, name: parsedConfigName, version: 'v0' });
        }

        // DB에서 모든 ComponentGrid 로드
        const response = await fetch(`/api/components/load?pipelineId=${pipelineId}`);
        
        
        if (!response.ok) {
          // 에러 응답 내용 확인
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (e) {
          }
          
          if (response.status === 404) {
            // 파이프라인 데이터가 없는 경우 빈 파이프라인 생성
            const emptyPipeline = createEmptyPipeline(localPipelineId, `Pipeline ${localPipelineId}`);
            update(localPipelineId, { components: emptyPipeline.components });
            setPipeline(getById(localPipelineId));
            return;
          }
          
          throw new Error(errorMessage);
        }
        
        const result = await response.json();
        
        const componentGrids: any[] = result.data?.components || [];
        
        // ComponentGrid를 Pipeline Component로 변환
        const components = convertComponentGridsToPipelineComponents(componentGrids);
        
        // usePipelines 스토어에 업데이트 (정규화된 ID 기준)
        update(localPipelineId, { components });
        
        // 로컬 상태 업데이트
        setPipeline(getById(localPipelineId));
        
        
      } catch (error) {
        console.error('파이프라인 로딩 중 오류:', error);
        setLoadError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPipelineFromDb();
    return () => { try { clearVars(); } catch {} }
  }, [params.id, update, getById]);

  React.useEffect(() => {
    if (!isLoading && !pipeline) router.replace('/pipelines');
  }, [pipeline, router, isLoading]);

  const handleSave = async () => {
    if (isSaving) return;
    
    // 저장 직전에 스토어에서 최신 파이프라인을 조회 (정규화된 ID 사용)
    const rawId = decodeURIComponent(String(params.id));
    const hasColon = rawId.includes(':');
    const u = hasColon ? rawId.split(':', 2)[0] : (selectedUnivId || '');
    const c = hasColon ? rawId.split(':', 2)[1] : rawId;
    const localPipelineId = `${u}:${c}`;
    const latest = getById(localPipelineId);
    if (!latest) return;
    if (!dbPipelineId) {
      toast.error("DB 파이프라인이 준비되지 않았습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    
    setIsSaving(true);
    
    try {
      // 컴포넌트를 업서트 포맷으로 변환 (id는 선택적)
      const components = latest.components.map(component => {
        const flowBlocks = component.blocks.map(block => {
          // FlowBlock 객체에서 kind 추출 (block_type 기반)
          let kind: string;
          
          if ((block as any).kind) {
            // 이미 kind가 있는 경우
            kind = (block as any).kind;
          } else if ((block as any).block_type) {
            // block_type에서 kind 추출
            kind = getBlockTypeNameById((block as any).block_type).toLowerCase();
          } else {
            console.error('❌ Block missing both kind and block_type:', block);
            return null;
          }

          try {
            // 미리 로드된 block_data에서 설정을 찾기
            const capitalizedKind = kind.charAt(0).toUpperCase() + kind.slice(1).toLowerCase();
            const blockDataItem = blockData?.find(bd => {
              const blockTypeName = typeof bd.block_type === 'number' ? 
                getBlockTypeNameById(bd.block_type) : bd.block_type;
              return blockTypeName === capitalizedKind;
            });

            // const body_cells = (block.block_type === BLOCK_TYPE.DIVISION) ? convertGridToHierarchical(block.body_cells as any) : block.body_cells;
            const body_cells = block.body_cells;

            // 기존 블록의 실제 데이터를 사용 (사용자가 추가한 열들 포함)
            return {
              block_id: (block as any).block_id || (block as any).id || 0,
              block_type: (block as any).block_type || getBlockTypeId(capitalizedKind),
              header_cells: (block as any).header_cells || [],
              body_cells: body_cells || []  
            };
          } catch (error) {
            console.error('❌ Error creating FlowBlock:', error, block);
            return null;
          }
        }).filter(Boolean); // null 값 제거

        const hierarchicalDataMap = component.ui?.hierarchicalDataMap ?? undefined;
        return {
          id: Number.isFinite(component.id) ? component.id : undefined,
          order: component.position,
          x: Math.round(component.ui?.x ?? 0),
          y: Math.round(component.ui?.y ?? 0),
          blocks: flowBlocks,
          ...(hierarchicalDataMap ? { hierarchicalDataMap } : {})
        } as any;
      });

      const batchSaveData = {
        pipelineId: dbPipelineId,
        components
      };

      // console.log('=== handleSave 디버깅 ===');
      // console.log('dbPipelineId:', dbPipelineId);
      // console.log('latest.components 개수:', latest.components.length);
      // console.log('변환된 components 개수:', components.length);
      // console.log('첫 번째 컴포넌트:', components[0]);
      // console.log('첫 번째 컴포넌트의 블록들:', components[0]?.blocks);
      // console.log('batchSaveData 전체:', JSON.stringify(batchSaveData, null, 2));
      // console.table(batchSaveData);

      
      const response = await fetch('/api/components/save', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batchSaveData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`저장 실패: ${errorData.message || response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // 저장 후 DB에서 다시 로드하여 ID 동기화
        const reload = await fetch(`/api/components/load?pipelineId=${batchSaveData.pipelineId}`);
        if (reload.ok) {
          const re = await reload.json();
          const componentGrids: any[] = re.data?.components || [];
          const nextComponents = convertComponentGridsToPipelineComponents(componentGrids);
          update(localPipelineId, { components: nextComponents });
          setPipeline(getById(localPipelineId));
        }
        setShowSavedNotice(true);
        setTimeout(() => setShowSavedNotice(false), 5000);
      } else {
        toast.error(`저장 중 일부 오류가 발생했습니다: ${result.message}`);
      }
    } catch (error) {
      console.error('저장 중 오류 발생:', error);
      toast.error(`저장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 성적 계산 시작 함수
  const handleStartCalculation = async () => {
    if (!dbPipelineId || !selectedUnivId) {
      toast.error("파이프라인 ID 또는 대학교 ID가 없습니다.");
      return;
    }

    // 조건부 계산 모드일 때 학생 식별번호 배열 검증
    if (calculationMode === 1 && (!studentIds || studentIds.length === 0)) {
      toast.error("학생 식별번호를 하나 이상 추가해주세요.");
      return;
    }

    setIsCalculating(true);
    setCalculationProgress(0);

    try {
      console.log('🚀 성적 계산 시작:', { 
        pipelineId: dbPipelineId, 
        schoolCode: selectedUnivId,
        calcMode: calculationMode,
        studentIds: calculationMode === 1 ? studentIds : undefined
      });

      const requestBody: any = {
        pipelineId: dbPipelineId,
        schoolCode: selectedUnivId,
        batchSize: 100,
        calcMode: calculationMode
      };

      // 조건부 계산 모드일 때 식별번호 배열 추가
      if (calculationMode === 1) {
        requestBody.studentIds = studentIds.map(s => s.trim()).filter(Boolean);
      }

      const response = await fetch('/api/grade-calculation/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '성적 계산 실패');
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 성적 계산 완료:', result.data);
        toast.success(`성적 계산이 완료되었습니다! 처리된 학생 수: ${result.data.processedStudents}명`);
      } else {
        throw new Error(result.message || '성적 계산 실패');
      }

    } catch (error) {
      console.error('❌ 성적 계산 에러:', error);
      toast.error(`성적 계산 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCalculating(false);
      setCalculationProgress(0);
    }
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>파이프라인을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 발생
  if (loadError) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2 className={styles.errorTitle}>파이프라인 로딩 실패</h2>
          <p className={styles.errorMessage}>{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className={styles.retryButton}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 파이프라인이 없음
  if (!pipeline) {
    return (
      <div className={styles.notFoundContainer}>
        <div className={styles.notFoundContent}>
          <div className={styles.notFoundIcon}>📝</div>
          <h2 className={styles.notFoundTitle}>파이프라인을 찾을 수 없습니다</h2>
          <p className={styles.notFoundMessage}>요청한 파이프라인이 존재하지 않습니다.</p>
          <button
            onClick={() => router.replace('/pipelines')}
            className={styles.backButton}
          >
            파이프라인 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.pipelineName}>
            {pipeline.name} <span className={styles.pipelineId}>/ {pipeline.id}</span>
          </span>
          {showSavedNotice && (
            <span className={styles.savedNotice}>저장 완료</span>
          )}
        </div>
        <div className={styles.headerActions}>
          <div className={styles.calculationControls}>
            <div className={styles.calculationModeToggle}>
              <label className={styles.toggleLabel}>
                <input
                  type="radio"
                  name="calculationMode"
                  value={0}
                  checked={calculationMode === 0}
                  onChange={() => setCalculationMode(0)}
                  className={styles.toggleInput}
                />
                <span className={styles.toggleText}>Run</span>
              </label>
              <label className={styles.toggleLabel}>
                <input
                  type="radio"
                  name="calculationMode"
                  value={1}
                  checked={calculationMode === 1}
                  onChange={() => setCalculationMode(1)}
                  className={styles.toggleInput}
                />
                <span className={styles.toggleText}>Debug</span>
              </label>
            </div>
            {calculationMode === 1 && (
              <div className={styles.studentIdInput}>
                {/* 다중 토큰 입력 */}
                <div className="flex items-center gap-2 flex-wrap">
                  {studentIds.map(id => (
                    <span key={id} className="px-2 py-1 rounded-full border text-sm bg-gray-50">
                      {id}
                      <button className="ml-1 text-gray-500" onClick={() => setStudentIds(studentIds.filter(x => x !== id))}>×</button>
                    </span>
                  ))}
                  <StudentIdAdder onAdd={(v) => setStudentIds(Array.from(new Set([...studentIds, v])))}/>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleStartCalculation}
            disabled={isCalculating || isSaving || !dbPipelineId}
            className={styles.calculateButton}
          >
            {isCalculating ? '계산 중...' : '계산 시작'}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={styles.saveButton}
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
      <div className={styles.canvasContainer}>
        <Canvas pipelineId={pipeline.id} dbPipelineId={dbPipelineId} />
      </div>
    </div>
  );
}

function StudentIdAdder({ onAdd }: { onAdd: (v: string) => void }) {
  const [buf, setBuf] = React.useState('');
  const add = () => {
    const v = buf.trim();
    if (!v) return;
    onAdd(v);
    setBuf('');
  };
  return (
    <>
      <input
        className={styles.studentIdField}
        placeholder="학생 식별번호 추가"
        value={buf}
        onChange={e => setBuf(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') add(); }}
      />
      <button className={styles.calculateButton} onClick={add}>추가</button>
    </>
  );
}
