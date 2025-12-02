'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './GradeResultsSidebar.module.css';

type GradeResult = {
	studentId: string;
	finalScore: number;
	rank: number;
	admissionCode?: string | null;
	admissionName?: string | null;
};

type Props = {
	dbPipelineId?: number | null;
	onSelectStudent?: (studentId: string) => void;
	isExpanded?: boolean;
	onToggle?: (expanded: boolean) => void;
};

export default function GradeResultsSidebar({ dbPipelineId, onSelectStudent, isExpanded = false, onToggle }: Props) {
	const [results, setResults] = React.useState<GradeResult[]>([]);
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [query, setQuery] = React.useState('');
	const [offset, setOffset] = React.useState(0);
	const limit = 100;
	const [hasMore, setHasMore] = React.useState(false);
	const [activeStudentId, setActiveStudentId] = React.useState<string | null>(null);

	const fetchResults = React.useCallback(async () => {
		if (!dbPipelineId) return;
		setLoading(true);
		setError(null);
		try {
			const params = new URLSearchParams({
				pipelineId: String(dbPipelineId),
				limit: String(limit),
				offset: String(offset),
				orderBy: 'rank',
				order: 'asc',
				...(query.trim() && { studentId: query.trim() })
			});
			const res = await fetch(`/api/grade-results?${params.toString()}`);
			if (!res.ok) {
				const err = await res.json().catch(() => ({} as any));
				throw new Error(err.message || '결과 조회 실패');
			}
			const json = await res.json();
			const data = json?.data ?? {};
			setResults(Array.isArray(data.results) ? data.results : []);
			setHasMore(Boolean(data.pagination?.hasMore));
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Unknown error');
		} finally {
			setLoading(false);
		}
	}, [dbPipelineId, offset, query]);

	React.useEffect(() => {
		setOffset(0);
	}, [dbPipelineId]);

	// 검색어 변경 시 offset 리셋
	React.useEffect(() => {
		setOffset(0);
	}, [query]);

	// 검색어 변경 시 디바운스 처리
	React.useEffect(() => {
		const timeoutId = setTimeout(() => {
			fetchResults();
		}, 300); // 300ms 디바운스

		return () => clearTimeout(timeoutId);
	}, [query]);

	React.useEffect(() => {
		fetchResults();
	}, [fetchResults]);

	// 클라이언트 사이드 필터링 제거 - 서버에서 검색하므로 results를 그대로 사용
	const filtered = results;

	return (
		<div className={`${styles.sidebar} ${isExpanded ? styles.sidebarExpanded : styles.sidebarCollapsed}`}>
			{/* 아코디언 핸들 */}
			<div className={styles.header}>
				{isExpanded && (
					<div className={styles.headerTitle}>성적 결과</div>
				)}
				<button
					onClick={() => onToggle?.(!isExpanded)}
					className={styles.toggleButton}
					title={isExpanded ? "접기" : "펼치기"}
				>
					{isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
				</button>
			</div>

			{/* 패널 내용 - 펼쳐졌을 때만 표시 */}
			{isExpanded && (
				<>
					<div className={styles.searchContainer}>
						<input
							type="text"
							value={query}
							onChange={e => setQuery(e.target.value)}
							placeholder="식별번호 검색"
							className={styles.searchInput}
						/>
					</div>
					<div className={styles.content}>
						{loading ? (
							<div className={styles.loadingMessage}>불러오는 중...</div>
						) : error ? (
							<div className={styles.errorMessage}>{error}</div>
						) : (
						<table className={styles.table}>
								<thead className={styles.tableHeader}>
									<tr>
										<th className={`${styles.tableHeaderCell} ${styles.tableHeaderCellRank}`}>순위</th>
									<th className={styles.tableHeaderCell}>식별번호</th>
									<th className={`${styles.tableHeaderCell} ${styles.tableHeaderCellAdmission}`}>전형</th>
										<th className={`${styles.tableHeaderCell} ${styles.tableHeaderCellScore}`}>최종점수</th>
									</tr>
								</thead>
								<tbody>
									{filtered.map((r) => (
										<tr
											key={`${r.rank}-${r.studentId}`}
											className={`${styles.tableRow} ${activeStudentId === r.studentId ? styles.tableRowActive : styles.tableRowInactive}`}
											onClick={() => { setActiveStudentId(r.studentId); onSelectStudent?.(r.studentId); }}
										>
											<td className={styles.tableCell}>{r.rank ?? '-'}</td>
											<td className={styles.tableCell}>{r.studentId}</td>
										<td className={`${styles.tableCell} ${styles.tableCellAdmission}`}>{r.admissionName ?? r.admissionCode ?? '-'}</td>
											<td className={`${styles.tableCell} ${styles.tableCellScore}`}>{r.finalScore}</td>
										</tr>
									))}
									{!loading && filtered.length === 0 && (
										<tr>
										<td colSpan={4} className={styles.emptyMessage}>결과가 없습니다</td>
										</tr>
									)}
								</tbody>
							</table>
						)}
					</div>
					<div className={styles.pagination}>
						<button
							onClick={() => setOffset(Math.max(0, offset - limit))}
							disabled={offset === 0 || loading || !dbPipelineId}
							className={styles.paginationButton}
						>
							이전
						</button>
						<div className={styles.paginationInfo}>{offset + 1} - {offset + results.length}</div>
						<button
							onClick={() => setOffset(offset + limit)}
							disabled={!hasMore || loading || !dbPipelineId}
							className={styles.paginationButton}
						>
							다음
						</button>
					</div>
				</>
			)}

			{/* 접혔을 때 아이콘 표시 */}
			{!isExpanded && (
				<div className={styles.collapsedContent}>
					<div className={styles.collapsedText}>
						성적결과
					</div>
				</div>
			)}
		</div>
	);
}


