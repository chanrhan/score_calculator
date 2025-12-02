// 공통 타입 & 유틸
// types/domain.ts
export type Score = { converted?: number|null; weighted?: number|null; final?: number|null };

export type Subject = {
  subjectName: string;
  organizationName: string;
  subjectSeparationCode: string; // 표준 필드명
  grade: number;
  term: 1|2;
  credit: number;
  originalScore?: number;
  rankingGrade?: number;
  achievement?: string;
  assessment?: string;
  studentCount?: number;
  avgScore?: number;
  standardDeviation?: number;
  achievementRatio?: number;
  score?: Score;
};

export type Context = {
  student: {
    admission: string; major: string; graduateYear: number;
    applicantScCode: string; identifyNumber: string;
  };
  subjects: Subject[]; // 삭제 금지: 교체/복사 후 수정만
  metrics: Record<string, number|string|boolean>;
  vars: {
    pipeline: Record<string, number|string|boolean>;
    components: Record<number, Record<string, number|string|boolean>>;
  };
};

export type Scalar = number|string|boolean;

// 공통 헬퍼
export const getSubjectFinal = (s: Subject): number|undefined =>
  s.score?.final ?? s.score?.weighted ?? s.score?.converted ?? s.originalScore ?? undefined;

export const cloneSubject = (s: Subject): Subject => JSON.parse(JSON.stringify(s)) as Subject;

// 타이브레이커: 표준편차 내림차순 → 이수단위 내림차순 → 과목명 오름차순
export const tieBreak = (a: Subject, b: Subject) => {
  const sdA = a.standardDeviation ?? -Infinity;
  const sdB = b.standardDeviation ?? -Infinity;
  if (sdA !== sdB) return sdB - sdA;

  const cA = a.credit ?? 0;
  const cB = b.credit ?? 0;
  if (cA !== cB) return cB - cA;

  return a.subjectName.localeCompare(b.subjectName);
};

export const sortByPreferredScore = (a: Subject, b: Subject) => {
  const av = getSubjectFinal(a) ?? -Infinity;
  const bv = getSubjectFinal(b) ?? -Infinity;
  if (av !== bv) return bv - av; // 내림
  return tieBreak(a, b);
};

// 기능형 서브 블록 타입(프론트 편집/실행 공용)
// types/functions.ts
export type FunctionKind =
  | 'apply_subject'
  | 'apply_term'
  | 'top_subject'
  | 'score_map'
  | 'grade_ratio'
  | 'subject_group_ratio'
  | 'separation_ratio'
  | 'multiply_ratio'
  | 'formula';

// 2-1. ApplySubject
export type ApplySubjectParams = {
  mode: 'include'|'exclude';
  // organizationName 또는 사전 정의된 교과군 문자열들
  groups?: string[]; // 예: ['수학','과학']
  organizationNames?: string[]; // 예: ['수학I','물리학']
};

// 2-2. ApplyTerm
export type ApplyTermParams = {
  terms: Array<{ grade: 1|2|3; term: 1|2; enabled: boolean }>;
  topTerms?: number; // 우수학기 N (옵션)
  // 정렬 기준: 기본은 score.final → weighted → converted → originalScore
  // 필요시 사용자 지정 식(DSL)을 넣을 수 있도록 확장 포인트
  sortExpr?: string; // 옵션
};

// 2-3. TopSubject
export type TopSubjectParams = {
  N: number;
  mode: 'perGroup'|'overall'; // 교과군별 상위N vs 전체 상위N
  groupBy?: 'organizationName'|'subjectSeparationCode'|'custom'; // perGroup일 때
  customKeyExpr?: string; // groupBy='custom'일 때 DSL로 그룹키
  sortExpr?: string; // 사용자 지정 정렬 표현식(옵션)
};

// 2-4. ScoreMap
export type ScoreMapParams = {
  inputType: 'original'|'rankingGrade'|'percentile'|'customExpr';
  match: 'exact'|'range_inclusive'|'linear';
  // 테이블: exact는 key→value; range는 [{min, max, value}] ; linear는 [{x,y}]들
  table: any; // 프론트에선 zod로 검증 (여기선 any로 선언)
  outOfRange: 'clip'|'error';
  customExpr?: string; // inputType='customExpr'일 때
};

// 2-5. GradeRatio
export type GradeRatioParams = { g1: number; g2: number; g3: number }; // 0~100

// 2-6. SubjectGroupRatio
export type SubjectGroupRatioRow = { groups: string[]; ratio: number }; // 한 행 합=100을 전체 행으로 맞춤
export type SubjectGroupRatioParams = { rows: SubjectGroupRatioRow[] };

// 2-7. SeparationRatio
export type SeparationRatioParams = { general: number; career: number; arts: number }; // 0~100

// 2-8. MultiplyRatio
export type MultiplyRatioParams = { ratio: number }; // 0~100

// 2-9. Formula
export type FormulaParams = {
  dsl: string; // 수식
  target?: 'score.final'|'score.weighted'|'score.converted'|'metrics.<name>'; // 기본 score.final
};

// 통합
export type FunctionParams =
  | ({ kind: 'apply_subject'; params: ApplySubjectParams })
  | ({ kind: 'apply_term'; params: ApplyTermParams })
  | ({ kind: 'top_subject'; params: TopSubjectParams })
  | ({ kind: 'score_map'; params: ScoreMapParams })
  | ({ kind: 'grade_ratio'; params: GradeRatioParams })
  | ({ kind: 'subject_group_ratio'; params: SubjectGroupRatioParams })
  | ({ kind: 'separation_ratio'; params: SeparationRatioParams })
  | ({ kind: 'multiply_ratio'; params: MultiplyRatioParams })
  | ({ kind: 'formula'; params: FormulaParams });


// DSL 평가기(간단 인터페이스)
// 프론트에선 간단 파서/인터프리터를 둔다고 가정. 여기선 시그니처만 사용.
  // lib/dsl/eval.ts
export type DslContext = {
  ctx: Context;
  subjects: Subject[];
  current?: Subject; // 단일 과목 컨텍스트가 필요할 때 사용
  componentVars?: Record<string, any>; // 선택
};

export function evalExpr(expr: string, env: DslContext): number|string|boolean {
  // 구현체는 jsep + 안전 인터프리터 등으로 구성
  throw new Error('Not implemented in snippet');
}

기능형 블록 실행 로직
// lib/engine/functions.ts

/** 공통: subjects 새 배열로 교체(불변성) */
const replaceSubjects = (ctx: Context, subs: Subject[]) => ({ ...ctx, subjects: subs.map(cloneSubject) });

/** -------- 4-1. ApplySubject -------- */
export function runApplySubject(ctx: Context, p: ApplySubjectParams): Context {
  const ok = (s: Subject) => {
    const inGroup = (p.groups?.length
      ? p.groups!.some(g => s.organizationName.includes(g)) // 간단 구현: 이름 포함 매칭
      : false);
    const inOrg = (p.organizationNames?.length
      ? p.organizationNames!.includes(s.organizationName)
      : false);
    const hit = inGroup || inOrg;
    return p.mode === 'include' ? hit : !hit;
  };
  return replaceSubjects(ctx, ctx.subjects.filter(ok));
}

/** -------- 4-2. ApplyTerm -------- */
export function runApplyTerm(ctx: Context, p: ApplyTermParams): Context {
  const enabledSet = new Set(p.terms.filter(t => t.enabled).map(t => `${t.grade}-${t.term}`));
  let filtered = ctx.subjects.filter(s => enabledSet.has(`${s.grade}-${s.term}`));

  if (p.topTerms && p.topTerms > 0) {
    // 학기별 그룹 → 각 학기 대표점(평균 등)으로 정렬하여 상위 N 학기만 남김
    const byTerm = new Map<string, Subject[]>();
    for (const s of filtered) {
      const key = `${s.grade}-${s.term}`;
      if (!byTerm.has(key)) byTerm.set(key, []);
      byTerm.get(key)!.push(s);
    }

    const termScores = Array.from(byTerm.entries()).map(([key, subs]) => {
      // 정렬 기준: 사용자가 sortExpr 제공 시 DSL로 평가된 값의 평균 사용
      let score: number;
      if (p.sortExpr) {
        const vals = subs.map(s => Number(evalExpr(p.sortExpr!, { ctx, subjects: subs, current: s })));
        score = vals.reduce((a,b)=>a+b,0) / Math.max(vals.length,1);
      } else {
        const vals = subs.map(getSubjectFinal).filter((v): v is number => typeof v === 'number');
        score = vals.length ? vals.reduce((a,b)=>a+b,0) / vals.length : -Infinity;
      }
      return { key, score };
    });

    termScores.sort((a,b) => b.score - a.score);
    const keep = new Set(termScores.slice(0, p.topTerms).map(t => t.key));
    filtered = filtered.filter(s => keep.has(`${s.grade}-${s.term}`));
  }

  return replaceSubjects(ctx, filtered);
}

/** -------- 4-3. TopSubject -------- */
export function runTopSubject(ctx: Context, p: TopSubjectParams): Context {
  if (p.mode === 'overall') {
    const sorted = [...ctx.subjects].sort((a,b) => {
      if (p.sortExpr) {
        const av = Number(evalExpr(p.sortExpr!, { ctx, subjects: ctx.subjects, current: a }));
        const bv = Number(evalExpr(p.sortExpr!, { ctx, subjects: ctx.subjects, current: b }));
        if (av !== bv) return bv - av;
        return 0;
      }
      return sortByPreferredScore(a,b);
    });
    return replaceSubjects(ctx, sorted.slice(0, p.N));
  }

  // perGroup
  const keyOf = (s: Subject) => {
    if (p.groupBy === 'organizationName') return s.organizationName;
    if (p.groupBy === 'subjectSeparationCode') return s.subjectSeparationCode;
    if (p.groupBy === 'custom' && p.customKeyExpr) {
      return String(evalExpr(p.customKeyExpr, { ctx, subjects: ctx.subjects, current: s }));
    }
    return s.organizationName; // 기본
  };

  const byKey = new Map<string, Subject[]>();
  for (const s of ctx.subjects) {
    const k = keyOf(s);
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k)!.push(s);
  }

  const kept: Subject[] = [];
  for (const [k, arr] of byKey.entries()) {
    const sorted = [...arr].sort((a,b) => {
      if (p.sortExpr) {
        const av = Number(evalExpr(p.sortExpr!, { ctx, subjects: arr, current: a }));
        const bv = Number(evalExpr(p.sortExpr!, { ctx, subjects: arr, current: b }));
        if (av !== bv) return bv - av;
        return 0;
      }
      return sortByPreferredScore(a,b);
    });
    kept.push(...sorted.slice(0, p.N));
  }
  return replaceSubjects(ctx, kept);
}

/** -------- 4-4. ScoreMap -------- */
export function runScoreMap(ctx: Context, p: ScoreMapParams): Context {
  const readInput = (s: Subject): number => {
    if (p.inputType === 'original') return Number(s.originalScore ?? NaN);
    if (p.inputType === 'rankingGrade') return Number(s.rankingGrade ?? NaN);
    if (p.inputType === 'percentile') return Number(s.achievementRatio ? s.achievementRatio*100 : NaN);
    if (p.inputType === 'customExpr' && p.customExpr) {
      return Number(evalExpr(p.customExpr, { ctx, subjects: ctx.subjects, current: s }));
    }
    return NaN;
  };

  const mapExact = (x: number) => {
    const val = p.table?.[String(x)];
    if (val == null) return undefined;
    return Number(val);
  };

  const mapRange = (x: number) => {
    // table: [{min:number, max:number, value:number}]
    for (const r of (p.table ?? [])) {
      if (x >= r.min && x <= r.max) return Number(r.value);
    }
    return undefined;
  };

  const mapLinear = (x: number) => {
    // table: [{x:number, y:number}] 오름차순 가정
    const pts: Array<{x:number;y:number}> = (p.table ?? []).slice().sort((a:any,b:any)=>a.x-b.x);
    if (!pts.length) return undefined;
    if (x <= pts[0].x) return pts[0].y;
    if (x >= pts[pts.length-1].x) return pts[pts.length-1].y;
    for (let i=0;i<pts.length-1;i++){
      const a=pts[i], b=pts[i+1];
      if (x>=a.x && x<=b.x){
        const t=(x-a.x)/(b.x-a.x);
        return a.y + t*(b.y-a.y);
      }
    }
    return undefined;
  };

  const subs = ctx.subjects.map(s => {
    const x = readInput(s);
    let conv: number|undefined;
    if (Number.isNaN(x)) conv = undefined;
    else if (p.match === 'exact') conv = mapExact(x);
    else if (p.match === 'range_inclusive') conv = mapRange(x);
    else conv = mapLinear(x);

    if (conv == null) {
      if (p.outOfRange === 'error') throw new Error(`ScoreMap out of range for ${s.subjectName} (${x})`);
      // clip: 가장 가까운 값으로 대체
      if (p.match === 'linear') {
        const pts: Array<{x:number;y:number}> = (p.table ?? []).slice().sort((a:any,b:any)=>a.x-b.x);
        if (pts.length) conv = x <= pts[0].x ? pts[0].y : pts[pts.length-1].y;
      }
    }

    const ns = cloneSubject(s);
    ns.score = ns.score ?? {};
    ns.score.converted = conv ?? ns.score.converted ?? null;
    return ns;
  });

  return replaceSubjects(ctx, subs);
}

/** -------- 4-5. GradeRatio -------- */
export function runGradeRatio(ctx: Context, p: GradeRatioParams): Context {
  const ratioOf = (g: number) => (g===1? p.g1 : g===2? p.g2 : p.g3) / 100;
  const subs = ctx.subjects.map(s => {
    const base = s.score?.weighted ?? s.score?.converted ?? getSubjectFinal(s);
    const ns = cloneSubject(s);
    ns.score = ns.score ?? {};
    ns.score.weighted = (base ?? 0) * ratioOf(s.grade);
    return ns;
  });
  return replaceSubjects(ctx, subs);
}

/** -------- 4-6. SubjectGroupRatio -------- */
export function runSubjectGroupRatio(ctx: Context, p: SubjectGroupRatioParams): Context {
  // rows: 각 행에 groups[], ratio(0~100). 첫 매칭 행의 비율을 곱한다.
  const findRatio = (s: Subject) => {
    for (const row of p.rows) {
      const hit = row.groups.some(g => s.organizationName.includes(g) || s.subjectSeparationCode === g);
      if (hit) return row.ratio/100;
    }
    return 1; // 매칭 없으면 100%
  };
  const subs = ctx.subjects.map(s => {
    const base = s.score?.weighted ?? s.score?.converted ?? getSubjectFinal(s);
    const ns = cloneSubject(s);
    ns.score = ns.score ?? {};
    ns.score.weighted = (base ?? 0) * findRatio(s);
    return ns;
  });
  return replaceSubjects(ctx, subs);
}

/** -------- 4-7. SeparationRatio -------- */
export function runSeparationRatio(ctx: Context, p: SeparationRatioParams): Context {
  const ratioOf = (code: string) => {
    // code 분류 기준은 프로젝트 룰에 맞게 매핑(예: '일반','진로','예체능')
    if (/예체|체육|음악|미술/.test(code)) return p.arts/100;
    if (/진로|선택/.test(code)) return p.career/100;
    return p.general/100;
  };
  const subs = ctx.subjects.map(s => {
    const base = s.score?.weighted ?? s.score?.converted ?? getSubjectFinal(s);
    const ns = cloneSubject(s);
    ns.score = ns.score ?? {};
    ns.score.weighted = (base ?? 0) * ratioOf(s.subjectSeparationCode);
    return ns;
  });
  return replaceSubjects(ctx, subs);
}

/** -------- 4-8. MultiplyRatio -------- */
export function runMultiplyRatio(ctx: Context, p: MultiplyRatioParams): Context {
  const r = p.ratio/100;
  const subs = ctx.subjects.map(s => {
    const base = s.score?.weighted ?? s.score?.converted ?? getSubjectFinal(s);
    const ns = cloneSubject(s);
    ns.score = ns.score ?? {};
    ns.score.weighted = (base ?? 0) * r;
    return ns;
  });
  return replaceSubjects(ctx, subs);
}

/** -------- 4-9. Formula -------- */
export function runFormula(ctx: Context, p: FormulaParams): Context {
  const target = p.target ?? 'score.final';
  const subs = ctx.subjects.map(s => {
    const v = evalExpr(p.dsl, { ctx, subjects: ctx.subjects, current: s });
    const ns = cloneSubject(s);
    ns.score = ns.score ?? {};
    if (target === 'score.final') ns.score.final = Number(v);
    else if (target === 'score.weighted') ns.score.weighted = Number(v);
    else if (target === 'score.converted') ns.score.converted = Number(v);
    else if (target.startsWith('metrics.')) {
      const key = target.slice('metrics.'.length);
      // 과목 루프 안에서 metrics를 덮는 건 권장하지 않지만, 요구 시 허용 가능.
      // 여기선 과목 루프 내 마지막 값으로 기록(필요 시 별도 Aggregation에서 처리 권장)
      ctx.metrics[key] = Number(v);
    }
    return ns;
  });
  return replaceSubjects(ctx, subs);
}

// 실행 디스패처 
// lib/engine/dispatch.ts
import type { Context } from '@/types/domain';
import type { FunctionParams } from '@/types/functions';
import {
  runApplySubject, runApplyTerm, runTopSubject, runScoreMap,
  runGradeRatio, runSubjectGroupRatio, runSeparationRatio, runMultiplyRatio, runFormula
} from './functions';

export function runFunctionBlock(ctx: Context, fn: FunctionParams): Context {
  switch (fn.kind) {
    case 'apply_subject':        return runApplySubject(ctx, fn.params);
    case 'apply_term':           return runApplyTerm(ctx, fn.params);
    case 'top_subject':          return runTopSubject(ctx, fn.params);
    case 'score_map':            return runScoreMap(ctx, fn.params);
    case 'grade_ratio':          return runGradeRatio(ctx, fn.params);
    case 'subject_group_ratio':  return runSubjectGroupRatio(ctx, fn.params);
    case 'separation_ratio':     return runSeparationRatio(ctx, fn.params);
    case 'multiply_ratio':       return runMultiplyRatio(ctx, fn.params);
    case 'formula':              return runFormula(ctx, fn.params);
    default:
      // @ts-expect-error exhaustive
      throw new Error(`Unsupported function kind: ${(fn as any)?.kind}`);
  }
}
