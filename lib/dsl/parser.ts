// /lib/dsl/parser.ts
// 프로토타입: 완전 파서는 아님. eval.ts에서 문자열 직접 처리하므로 여기선 placeholder.
import type { Node } from './ast';

export function parse(_expr: string): Node {
  throw new Error('Parser not implemented; use evalExpr from eval.ts directly.');
}
