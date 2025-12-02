// /lib/dsl/ast.ts
// 간단한 AST 타입 (전체 구현이 아닌, eval 전용 최소 구조)

export type Node =
  | { type: 'Literal'; value: number | string | boolean }
  | { type: 'Identifier'; name: string } // metrics.x, vars.x, subject.y 와 같은 경로는 eval에서 처리
  | { type: 'UnaryExpression'; operator: '!' | '-'; argument: Node }
  | { type: 'BinaryExpression'; operator: '+'|'-'|'*'|'/'|'%'|'>'|'>='|'<'|'<='|'=='|'!='; left: Node; right: Node }
  | { type: 'LogicalExpression'; operator: '&&'|'||'; left: Node; right: Node }
  | { type: 'CallExpression'; callee: { type: 'Identifier'; name: string }; arguments: Node[] };
