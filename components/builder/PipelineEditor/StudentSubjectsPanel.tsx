'use client';

import * as React from 'react';
import { X, CheckCircle, XCircle, Search } from 'lucide-react';
import styles from './StudentSubjectsPanel.module.css';
import type { Subject as DomainSubject } from '@/types/domain';
import { useResultsHighlight } from '@/components/results/ResultsHighlightContext';
import { filterSubjects, getSubjectFilterOptions } from '@/lib/utils/subjectFilter';
import { Subject_Separation } from '@/types/text-mapping';

type Props = {
  studentId: string | null;
  dbPipelineId?: number | null;
  onClose: () => void;
  onSelectSubject?: (subject: DomainSubject) => void;
  onContextSnapshotsLoaded?: (snapshots: any) => void;
};

export default function StudentSubjectsPanel({ studentId, dbPipelineId, onClose, onSelectSubject, onContextSnapshotsLoaded }: Props) {
  const [subjects, setSubjects] = React.useState<DomainSubject[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { selectedSubject, setSelectedSubject } = useResultsHighlight();
  const [finalScore, setFinalScore] = React.useState<number | null>(null);
  const [studentInfo, setStudentInfo] = React.useState<{
    identifyNumber: string;
    mogib2Code: string;
    admissionCode: string;
    majorCode: string;
    admissionName: string;
    majorName: string;
    graduateGrade: number | null;
    graduateYear: number | null;
  } | null>(null);

  // 필터/검색 상태
  const [search, setSearch] = React.useState('');
  const [selectedSeparationCodes, setSelectedSeparationCodes] = React.useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = React.useState<number[]>([]);
  const [selectedTerms, setSelectedTerms] = React.useState<number[]>([]);
  const [selectedReflected, setSelectedReflected] = React.useState<Array<'반영' | '필터'>>([]);

  const fetchSubjects = React.useCallback(async () => {
    if (!dbPipelineId || !studentId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({ 
        pipelineId: String(dbPipelineId), 
        studentId 
      });
      const res = await fetch(`/api/grade-results/student-details?${params.toString()}`);
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any));
        throw new Error(err.message || '학생 상세 조회 실패');
      }
      
      const json = await res.json();
      const subjectsData: DomainSubject[] = json?.data?.subjects || [];
      console.log(json);
      setSubjects(subjectsData);
      setFinalScore(json?.data?.finalScore || null);
      setStudentInfo(json?.data?.studentInfo || null);
      if (onContextSnapshotsLoaded) {
        onContextSnapshotsLoaded(json?.data?.contextSnapshots || null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [dbPipelineId, studentId]);

  React.useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // 과목을 반영 여부에 따라 정렬 (반영된 과목 위로, 반영 안된 과목 아래로)
  const sortedSubjects = React.useMemo(() => {
    return [...subjects].sort((a, b) => {
      const aIsReflected = a.filtered_block_id === 0;
      const bIsReflected = b.filtered_block_id === 0;
      
      // 반영된 과목을 위로
      if (aIsReflected && !bIsReflected) return -1;
      if (!aIsReflected && bIsReflected) return 1;
      
      // 같은 그룹 내에서는 (이수학년 asc, 학기 asc, 과목명 asc)
      const ag = (a.grade ?? 0) - (b.grade ?? 0);
      if (ag !== 0) return ag;
      const at = (a.term ?? 0) - (b.term ?? 0);
      if (at !== 0) return at;
      return a.subjectName.localeCompare(b.subjectName);
    });
  }, [subjects]);

  // 필터 옵션 계산
  const filterOptions = React.useMemo(() => getSubjectFilterOptions(subjects), [subjects]);

  // 필터 적용 결과
  const visibleSubjects = React.useMemo(() => {
    return filterSubjects(sortedSubjects, {
      subjectSeparationCode: selectedSeparationCodes,
      grade: selectedGrades,
      term: selectedTerms,
      reflected: selectedReflected,
    }, search);
  }, [sortedSubjects, selectedSeparationCodes, selectedGrades, selectedTerms, selectedReflected, search]);

  // 토큰 토글 핸들러
  const toggleToken = React.useCallback(<T,>(list: T[], value: T, setList: (v: T[]) => void) => {
    if (list.includes(value)) setList(list.filter(v => v !== value));
    else setList([...list, value]);
  }, []);

  // 반영된 과목 이수(unit) 총합
  const reflectedUnitSum = React.useMemo(() => {
    return visibleSubjects
    .filter(s => s.filtered_block_id === 0)
    .reduce((acc, s) => acc + (Number(s.unit ?? 0) || 0), 0);
  }, [visibleSubjects]);

  if (!studentId) return null;

  return (
    <div className={styles.panel}>
      {/* 헤더 */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>과목 목록</div>
        <button
          onClick={onClose}
          className={styles.closeButton}
          title="닫기"
        >
          <X size={16} />
        </button>
      </div>

      {/* 검색 + 학생 정보 */}
      <div className={styles.studentInfo}>
        <div className={styles.studentId}>
          <span>학생 ID: <span className={styles.studentIdValue}>{studentId}</span></span>
          <span> · 최종 점수 : {finalScore ?? '-'}</span>
        </div>
        {studentInfo && (
          <>
            <div className={styles.studentDetails}>
              <span><span className={styles.codeValue}>{studentInfo.admissionName}</span></span>
              <span> · <span className={styles.codeValue}>{studentInfo.majorName}</span></span>
              <span> <span className={styles.codeValue}>{studentInfo.graduateYear}년</span></span>
              <span> · <span className={styles.codeValue}>{studentInfo.graduateGrade}학년 졸업</span></span>
            </div>
          </>
        )}
        {/* 검색 입력 */}
        <div className={styles.searchRow}>
          <div className={styles.searchInputWrapper}>
            <Search size={14} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="과목명 검색"
            />
          </div>
        </div>
        {/* 필터 토큰 */}
        <div className={styles.filtersRow}>
          {/* 과목구분 (subjectSeparationCode) */}
          <div className={styles.filterGroup}>
            <div className={styles.filterLabel}>과목구분</div>
            <div className={styles.tokens}>
              {filterOptions.subjectSeparationCodes.map((v) => (
                <button
                  key={`sg-${v}`}
                  type="button"
                  className={`${styles.token} ${selectedSeparationCodes.includes(v) ? styles.tokenActive : ''}`}
                  onClick={() => toggleToken(selectedSeparationCodes, v, setSelectedSeparationCodes)}
                >{Subject_Separation[v as keyof typeof Subject_Separation] ?? v}</button>
              ))}
            </div>
          </div>

          {/* 학년 */}
          <div className={styles.filterGroup}>
            <div className={styles.filterLabel}>학년</div>
            <div className={styles.tokens}>
              {filterOptions.grade.map((v) => (
                <button
                  key={`gr-${v}`}
                  type="button"
                  className={`${styles.token} ${selectedGrades.includes(v) ? styles.tokenActive : ''}`}
                  onClick={() => toggleToken(selectedGrades, v, setSelectedGrades)}
                >{v}</button>
              ))}
            </div>
          </div>

          {/* 학기 */}
          <div className={styles.filterGroup}>
            <div className={styles.filterLabel}>학기</div>
            <div className={styles.tokens}>
              {filterOptions.term.map((v) => (
                <button
                  key={`tm-${v}`}
                  type="button"
                  className={`${styles.token} ${selectedTerms.includes(v) ? styles.tokenActive : ''}`}
                  onClick={() => toggleToken(selectedTerms, v, setSelectedTerms)}
                >{v}</button>
              ))}
            </div>
          </div>

          {/* 반영여부 */}
          <div className={styles.filterGroup}>
            <div className={styles.filterLabel}>반영여부</div>
            <div className={styles.tokens}>
              {filterOptions.reflected.map((v) => (
                <button
                  key={`rf-${v}`}
                  type="button"
                  className={`${styles.token} ${selectedReflected.includes(v) ? styles.tokenActive : ''}`}
                  onClick={() => toggleToken(selectedReflected, v, setSelectedReflected)}
                >{v}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 과목 목록 */}
      <div className={styles.content}>
        {loading ? (
          <div className={styles.loadingMessage}>불러오는 중...</div>
        ) : error ? (
          <div className={styles.errorMessage}>{error}</div>
        ) : (
          <div className={styles.subjectsList}>
            {visibleSubjects.map((s, index) => {
              const isReflected = s.filtered_block_id === 0;
              const isSelected = selectedSubject && 
                selectedSubject.subjectName === s.subjectName && 
                selectedSubject.grade === s.grade && 
                selectedSubject.term === s.term;
              
              
              return (
                <div
                  key={`${s.subjectName}-${index}`}
                  className={`${styles.subjectItem} ${isSelected ? styles.subjectItemSelected : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelectedSubject(s);
                    onSelectSubject?.(s);
                  }}
                  onKeyDown={(e) => { 
                    if (e.key === 'Enter' || e.key === ' ') { 
                      e.preventDefault(); 
                      setSelectedSubject(s);
                      onSelectSubject?.(s); 
                    } 
                  }}
                >
                  <div className={styles.subjectName}>{s.subjectName}</div>
                  
                  <div className={styles.subjectMeta}>
                    <span>{s.grade ?? '-'}학년</span>
                    <span>·</span>
                    <span>{s.term ?? '-'}학기</span>
                    <span>·</span>
                    <span>{s.unit ?? '-'}학점</span>
                  </div>

                  <div className={styles.score}>{s.score ?? '-'}</div>

                  <div className={styles.status}>
                    {isReflected ? (
                      <CheckCircle size={14} className={styles.statusIconReflected} />
                    ) : (
                      <XCircle size={14} className={styles.statusIconFiltered} />
                    )}
                    <span className={`${styles.statusText} ${isReflected ? styles.statusTextReflected : styles.statusTextFiltered}`}>
                      {isReflected ? '반영' : '필터'}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {!loading && visibleSubjects.length === 0 && (
              <div className={styles.emptyMessage}>
                과목이 없습니다
              </div>
            )}
          </div>
        )}
      </div>

      {/* 통계 정보 */}
      {!loading && !error && visibleSubjects.length > 0 && (
        <div className={styles.stats}>
          <div className={styles.statsContent}>
            <span>반영: {visibleSubjects.filter(s => s.filtered_block_id === 0).length}개</span>
            {/* <span>필터링: {visibleSubjects.filter(s => s.filtered_block_id !== 0).length}개</span> */}
            <span>표시: {visibleSubjects.length}개</span>
            <span>반영 이수단위: {reflectedUnitSum}</span>
          </div>
        </div>
      )}
    </div>
  );
}
