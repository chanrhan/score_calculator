// /types/domain.ts
// 도메인 공통 타입 (컨텍스트, 파이프라인 골격, 공통 유틸 타입)

export type ID = string | number;

export type Score = {
  converted?: number | null;
  weighted?: number | null;
  final?: number | null;
};

export type CalculationLog = {
  input_key: any;
  input: any;
  output_key: any;
  output: any;
}

export type Snapshot = {
  block_id: number;
  case_index: number;
  block_type: number;
  logs: CalculationLog[];
}

export type Subject = {
  yearterm: number;
  seqNumber: number;
  // calculation_rules.md 스펙에 맞는 필드명 사용
  grade: number;
  term: number;
  unit: number;
  organizationCode: string;
  subjectGroup: string;
  subjectName: string;
  courseCode: string;
  subjectCode: string;
  assessment: string;
  achievement: string;
  achievementRatio: string;
  studentCount: number;
  originalScore: number;
  avgScore: number;
  standardDeviation: number;
  rankingGrade: number;
  subjectSeparationCode: string;
  filtered_block_id: number;
  score: number | null;
  vars?: Map<string, any>;
  snapshot: Snapshot[];

  // 기존 호환성을 위한 필드들 (선택적)
  
  credit?: number;
};

export type StudentContext = {
  // calculation_rules.md 스펙에 맞는 필드명 사용
  identifyNumber: number;
  admissionCode: string;
  majorCode: string;
  graduateYear: number;
  applicantScCode: number;

  // 기존 호환성을 위한 필드들 (선택적)
  admission?: string;
  major?: string;
};

// calculation_rules.md 스펙에 맞게 vars를 Map<string, string>으로 변경
export type VarsScope = Map<string, any>;

export type Context = {
  // calculation_rules.md 스펙에 맞는 Context 구조
  identifyNumber: number;
  admissionCode: string;
  majorCode: string;
  graduateYear: number;
  graduateGrade: number;
  applicantScCode: number;
  finalScore: number;
  finalRank: number;
  subjects: Subject[];
  vars: VarsScope;
  metrics?: Record<string, number | string | boolean>;
  snapshot?: Snapshot[];
};

export type Scalar = number | string | boolean;

/** 파이프라인 구조(프론트 로컬 보관용) */
export type Pipeline = {
  id: string;
  name: string;
  version: string;
  isActive: boolean;
  components: Component[];
};

export type Component = {
  id: number;
  name: string;
  predecessorId?: number | null; // 선행 최대 1
  position: number; // 토폴로지/좌→우 실행 우선순위
  blocks: FlowBlock[]; // 좌→우 (새로운 FlowBlock 타입 사용)
  ui: { x: number; y: number; hierarchicalDataMap?: Record<number, import('@/types/hierarchicalCell').HierarchicalCell[]> };
  divisionHead?: import('@/types/division-head').DivisionHeadData;
};

/** 블록 공통 베이스 */
export type BlockKind =
  | 'division'
  | 'function'
  | 'condition'
  | 'aggregation'
  | 'variable'
  | 'finalize';

export type BlockBase = {
  id: number;
  kind: BlockKind;
  /** 컴포넌트 내 좌→우 순서 */
  position: number;
  /** 케이스 오른쪽 체인 소속 여부 (Division 우측에 붙은 블록) */
  isInCase?: boolean;
};

// ── block-structure.ts 기반 새로운 타입 시스템 ──
export type FlowBlock = {
  block_id: number;
  block_type: number;
  header_cells: any[][];
  body_cells: any[][][];
  col_types?: string[]; // 구분 블록의 열 타입 배열
};

// 기존 AnyBlock은 하위 호환성을 위해 유지 (점진적 마이그레이션용)
export type AnyBlock = import('@/types/blocks').AnyBlock;

/** 학생/과목 로컬 데이터 포맷 */
export type Student = StudentContext & { id: string };
export type StudentWithSubjects = { student: Student; subjects: Subject[] };

/** 배치 실행(프론트 전용) */
export type BatchStatus = 'running' | 'succeeded' | 'failed';
export type Batch = {
  id: string;
  pipelineId: string;
  status: BatchStatus;
  startedAt: number;
  finishedAt?: number;
  items: BatchItem[];
  results?: BatchResult[];
};

export type AuditStatus = 'ok' | 'skipped' | 'error';
export type AuditLog = {
  ts: number;
  componentId: number;
  blockId: number;
  caseId?: number | null;
  status: AuditStatus;
  lastScalar?: Scalar;
  ctxBefore?: Partial<Context>;
  ctxAfter?: Partial<Context>;
  message?: string;
};

export type BatchItem = {
  id: string;
  studentId: string;
  status: BatchStatus;
  startedAt: number;
  finishedAt?: number;
  finalScore?: number;
  metrics?: Context['metrics'];
  vars?: Context['vars'];
  ctxHash?: string;
  error?: string;
  audit: AuditLog[];
};

export type BatchResult = {
  studentId: string;
  finalScore: number;
  rank: number;
  tieBreaker: Record<string, any>;
};

/** 공용 헬퍼 타입 (함수 시그니처에서 사용) */
export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

// ============ 새로운 성적 계산 엔진용 타입들 ============

/** ComponentGrid 실행 결과 */
export type ComponentGridResult = {
  ctx: Context;
  finalScore: number;
  finalRank: number;
};

/** Case 실행 결과 */
export type CaseResult = {
  ctx: Context;
  processingSubjects: Subject[];
};

/** Division 블록의 리프 셀 (케이스) */
export type DivisionCase = {
  caseKey: string;
  caseName: string;
  criteria: string;
  leafCellId: string;
  processingSubjects?: Subject[]; // DFS 탐색을 통해 처리된 과목들
  processingContext?: Context;    // 참조용 context
};

/** 블록 실행기 인터페이스 */
export type BlockExecutor = (
  ctx: Context,
  subjects: Subject[],
  bodyCellValue: any[],
  headerCellValue: any[],
  blockId: number,
  caseIndex: number
) => Promise<{ ctx: Context; subjects: Subject[]}>;

/** Token Menu Store 타입 */
export type TokenMenuStore = Map<string, any>;

/** 성적 계산 배치 타입 */
export type GradeCalculationBatch = {
  id: string;
  pipelineId: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  finishedAt?: Date;
  totalStudents: number;
  processedStudents: number;
  results: Context[];
};

/** 개별 학생의 성적 계산 결과 */
export type GradeResult = {
  identifyNumber: number;
  admissionCode: string;
  majorCode: string;
  graduateYear: number;
  applicantScCode: number;
  finalScore: number;
  finalRank: number;
  tieBreaker?: any;
  calculatedAt: Date;
  metaVariables?: any;
  subjects?: any;
};
