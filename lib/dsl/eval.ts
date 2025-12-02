// /lib/dsl/eval.ts
// 안전한 소규모 평가기. eval/Function 미사용.
// 지원: 숫자/문자열/불리언, + - * / % , 비교, && || !
// 집계함수: SUM/AVG/COUNT/MAX/MIN/STD
// 식별자: metrics.name, vars.name, subject.field(.score.final 등)

import type { Context } from '@/types/domain';
import type { Subject } from '@/types/domain';

export type DslContext = {
  ctx: Context;
  subjects: Subject[];
  current?: Subject;                // 단일 과목 컨텍스트(필터/포뮬러 등)
  componentVars?: Record<string, any>; // 현재 컴포넌트 로컬 vars 우선 조회용(선택)
};

// ──────────────────────────────────────────────────────────────
// 토크나이저
type Tok =
  | { t: 'num'; v: number }
  | { t: 'str'; v: string }
  | { t: 'id'; v: string } // metrics.x / vars.x / subject.x...
  | { t: 'op'; v: string }
  | { t: 'lp' } | { t: 'rp' } | { t: 'comma' };

const isSpace = (c: string) => /\s/.test(c);
const isDigit = (c: string) => /[0-9]/.test(c);
const isIdStart = (c: string) => /[A-Za-z_]/.test(c);
const isIdPart  = (c: string) => /[A-Za-z0-9_.]/.test(c);

function tokenize(src: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  const push = (t: Tok) => toks.push(t);

  while (i < src.length) {
    const ch = src[i];

    if (isSpace(ch)) { i++; continue; }

    // number
    if (isDigit(ch) || (ch === '.' && isDigit(src[i+1] ?? ''))) {
      let j = i+1;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      push({ t: 'num', v: Number(src.slice(i, j)) });
      i = j; continue;
    }

    // string: '...'
    if (ch === "'") {
      let j = i+1, buf = '';
      while (j < src.length && src[j] !== "'") {
        if (src[j] === '\\' && j+1 < src.length) { buf += src[j+1]; j += 2; continue; }
        buf += src[j++]; 
      }
      if (src[j] !== "'") throw new Error("Unterminated string literal");
      push({ t: 'str', v: buf });
      i = j+1; continue;
    }

    // parentheses / comma
    if (ch === '(') { push({ t: 'lp' }); i++; continue; }
    if (ch === ')') { push({ t: 'rp' }); i++; continue; }
    if (ch === ',') { push({ t: 'comma' }); i++; continue; }

    // operators (multi-char first)
    const two = src.slice(i, i+2);
    const ops2 = ['>=','<=','==','!=','&&','||'];
    if (ops2.includes(two)) { push({ t: 'op', v: two }); i += 2; continue; }
    const ops1 = ['+','-','*','/','%','>','<','!'];
    if (ops1.includes(ch)) { push({ t: 'op', v: ch }); i++; continue; }

    // identifier
    if (isIdStart(ch)) {
      let j = i+1;
      while (j < src.length && isIdPart(src[j])) j++;
      push({ t: 'id', v: src.slice(i, j) });
      i = j; continue;
    }

    throw new Error(`Unexpected char: ${ch}`);
  }

  return toks;
}

// ──────────────────────────────────────────────────────────────
// 셔팅야드로 산술/비교/논리 표현식 RPN 변환

const prec: Record<string, number> = {
  '!' : 4,
  '*' : 3, '/' : 3, '%' : 3,
  '+' : 2, '-' : 2,
  '>' : 1, '>=':1, '<':1, '<=':1, '==':1, '!=':1,
  '&&': 0.5,
  '||': 0.4,
};

const rightAssoc = new Set<string>(['!']);

function toRPN(toks: Tok[]): Tok[] {
  const out: Tok[] = [];
  const st: Tok[] = [];

  const pushOp = (op: Tok & { t:'op' }) => {
    while (st.length) {
      const top = st[st.length-1];
      if (top.t !== 'op') break;
      if ((rightAssoc.has(op.v) && prec[op.v] < prec[top.v]) || (!rightAssoc.has(op.v) && prec[op.v] <= prec[top.v])) {
        out.push(st.pop()!);
      } else break;
    }
    st.push(op);
  };

  for (let i=0;i<toks.length;i++) {
    const t = toks[i];
    if (t.t === 'num' || t.t === 'str' || t.t === 'id') out.push(t);
    else if (t.t === 'op') pushOp(t);
    else if (t.t === 'lp') st.push(t);
    else if (t.t === 'rp') {
      while (st.length && st[st.length-1].t !== 'lp') out.push(st.pop()!);
      if (!st.length) throw new Error('Mismatched parentheses');
      st.pop(); // pop '('
    } else if (t.t === 'comma') {
      // 쉼표는 파서 레벨에서만 필요(함수호출 대비). 여기선 무시.
      // 집계함수는 별도 처리하므로 RPN 경로에선 등장하지 않게 사용.
    }
  }
  while (st.length) {
    const x = st.pop()!;
    if (x.t === 'lp') throw new Error('Mismatched parentheses');
    out.push(x);
  }
  return out;
}

// ──────────────────────────────────────────────────────────────
// 경로 해석
function getPath(obj: any, path: string): any {
  // 지원 경로: metrics.x, vars.x, subject.x(.score.final 등)
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function resolveIdentifier(id: string, env: DslContext): any {
  if (id === 'true') return true;
  if (id === 'false') return false;

  // if (id.startsWith('metrics.')) return getPath(env.ctx, id);
  // if (id.startsWith('vars.')) {
  //   const name = id.slice('vars.'.length);
  //   // 컴포넌트 우선 조회
  //   if (env.componentVars && Object.prototype.hasOwnProperty.call(env.componentVars, name)) {
  //     return env.componentVars[name];
  //   }
  //   const v = env.ctx.vars.pipeline[name];
  //   if (v !== undefined) return v;
  //   // 컴포넌트 맵 중 첫 히트(백업)
  //   for (const cid of Object.keys(env.ctx.vars.components)) {
  //     const mv = env.ctx.vars.components[Number(cid)][name];
  //     if (mv !== undefined) return mv;
  //   }
  //   return undefined;
  // }
  // if (id.startsWith('subject.') && env.current) return getPath({ subject: env.current }, id);

  // 숫자처럼 보이는 식별자는 넘버로 캐스팅
  if (/^\d+(\.\d+)?$/.test(id)) return Number(id);

  // 알 수 없는 식별자
  return undefined;
}

// ──────────────────────────────────────────────────────────────
// 단일 표현식(RPN) 평가
function evalRPN(rpn: Tok[], env: DslContext): any {
  const st: any[] = [];
  for (const t of rpn) {
    if (t.t === 'num' || t.t === 'str') st.push(t.v);
    else if (t.t === 'id') st.push(resolveIdentifier(t.v, env));
    else if (t.t === 'op') {
      if (t.v === '!') { const a = st.pop(); st.push(!a); continue; }
      const b = st.pop(); const a = st.pop();
      switch (t.v) {
        case '+': st.push(Number(a) + Number(b)); break;
        case '-': st.push(Number(a) - Number(b)); break;
        case '*': st.push(Number(a) * Number(b)); break;
        case '/': st.push(Number(a) / Number(b)); break;
        case '%': st.push(Number(a) % Number(b)); break;
        case '==': st.push(a == b); break; // 느슨 비교 허용(프로토타입)
        case '!=': st.push(a != b); break;
        case '>': st.push(Number(a) > Number(b)); break;
        case '>=': st.push(Number(a) >= Number(b)); break;
        case '<': st.push(Number(a) < Number(b)); break;
        case '<=': st.push(Number(a) <= Number(b)); break;
        case '&&': st.push(Boolean(a) && Boolean(b)); break;
        case '||': st.push(Boolean(a) || Boolean(b)); break;
        default: throw new Error(`Unknown operator: ${t.v}`);
      }
    }
  }
  return st.pop();
}

// ──────────────────────────────────────────────────────────────
// 집계함수 처리: 패턴 매칭으로 간단 처리
const aggNames = ['SUM','AVG','COUNT','MAX','MIN','STD'] as const;
type AggName = typeof aggNames[number];

function isAggCall(expr: string): { name: AggName; inner: string } | null {
  const m = expr.match(/^(SUM|AVG|COUNT|MAX|MIN|STD)\((.*)\)$/i);
  if (!m) return null;
  const name = m[1].toUpperCase() as AggName;
  const inner = m[2].trim();
  return { name, inner };
}

function evalInnerForSubjects(inner: string, env: DslContext): number[] {
  // inner는 산술/경로 표현식이라고 가정하고, 각 subject에 대해 평가
  const toks = tokenize(inner);
  const rpn = toRPN(toks);
  const vals: number[] = [];
  for (const s of env.subjects) {
    const v = evalRPN(rpn, { ...env, current: s });
    const n = Number(v);
    if (!Number.isNaN(n)) vals.push(n);
  }
  return vals;
}

function aggregate(name: AggName, vals: number[]): number {
  if (name === 'COUNT') return vals.length;
  if (vals.length === 0) return 0;
  switch (name) {
    case 'SUM': return vals.reduce((a,b)=>a+b,0);
    case 'AVG': return vals.reduce((a,b)=>a+b,0) / vals.length;
    case 'MAX': return Math.max(...vals);
    case 'MIN': return Math.min(...vals);
    case 'STD': {
      const mean = vals.reduce((a,b)=>a+b,0)/vals.length;
      const varp = vals.reduce((a,b)=>a+(b-mean)*(b-mean),0)/vals.length;
      return Math.sqrt(varp);
    }
    default: return 0;
  }
}

// ──────────────────────────────────────────────────────────────
// 공개 API
export function evalExpr(expr: string, env: DslContext): any {
  const e = expr.trim();

  // 최상위가 집계함수면 즉시 처리
  const agg = isAggCall(e);
  if (agg) {
    if (agg.name === 'COUNT' && (!agg.inner || agg.inner === '')) {
      return env.subjects.length;
    }
    const vals = evalInnerForSubjects(agg.inner, env);
    return aggregate(agg.name, vals);
  }

  // 일반식: 토큰화 → RPN → 평가
  const toks = tokenize(e);
  const rpn  = toRPN(toks);
  return evalRPN(rpn, env);
}
