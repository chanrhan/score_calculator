// /lib/validators/blocks.ts
import { z } from 'zod';
import { FunctionParamSchemaByKind, type FunctionKindKey } from './functions';

// BlockBase
const BlockBaseSchema = z.object({
  id: z.number().int().nonnegative(),
  position: z.number().int().positive(),
  isInCase: z.boolean().optional(),
});

// ─────────────────────────────────────────────────────────────
// Forward declarations (self-recursive unions)
type AnyBlock = z.infer<typeof AnyBlockSchema>;
export type AnyBlockInput = AnyBlock;

// Division
export const DivisionSpecRowSchema = z.object({
  type: z.string().min(1),
  values: z.array(z.union([z.string(), z.number()])).min(1),
});
export const DivisionSpecSchema = z.object({
  rows: z.array(DivisionSpecRowSchema).min(1),
});

export const DivisionCaseSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.number().int(),
    caseKey: z.string().min(1),
    criteria: z.record(z.any()),
    position: z.number().int().positive(),
    isImplicit: z.boolean().optional(),
    rightChain: z.array(AnyBlockSchema).default([]),
  })
);

export const DivisionBlockSchema: z.ZodType<any> = z.lazy(() =>
  BlockBaseSchema.extend({
    kind: z.literal('division'),
    skipPolicy: z.enum(['skip_empty_case', 'error_empty_case']),
    spec: DivisionSpecSchema,
    cases: z.array(DivisionCaseSchema).min(1, 'Division 케이스가 최소 1개 이상 필요합니다.'),
  })
);

// Function
const FunctionKindSchema = z.enum([
  'apply_subject',
  'apply_term',
  'top_subject',
  'score_map',
  'grade_ratio',
  'subject_group_ratio',
  'separation_ratio',
  'multiply_ratio',
  'formula',
] as const);

export const FunctionBlockSchema = BlockBaseSchema.extend({
  kind: z.literal('function'),
  caseId: z.number().int().positive(),
  funcType: FunctionKindSchema,
  params: z.any(),
}).superRefine((val, ctx) => {
  const schema = (FunctionParamSchemaByKind as any)[val.funcType as FunctionKindKey];
  if (!schema) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `알 수 없는 function kind: ${val.funcType}`, path: ['funcType'] });
    return;
  }
  const r = schema.safeParse(val.params);
  if (!r.success) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `params 검증 실패: ${r.error.message}`, path: ['params'] });
  }
});

// Condition
export const ConditionBlockSchema: z.ZodType<any> = z.lazy(() =>
  BlockBaseSchema.extend({
    kind: z.literal('condition'),
    expr: z.string().min(1),
    thenChain: z.array(AnyBlockSchema).default([]),
    elseChain: z.array(AnyBlockSchema).optional(),
  })
);

// Aggregation
export const AggregationBlockSchema = BlockBaseSchema.extend({
  kind: z.literal('aggregation'),
  agg: z.enum(['SUM', 'AVG', 'COUNT', 'MAX', 'MIN', 'STD']),
  target: z.string().min(1).optional(),
  filter: z.string().min(1).optional(),
  outputName: z.string().min(1).optional(),
}).superRefine((val, ctx) => {
  if (val.agg !== 'COUNT' && !val.target) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'COUNT가 아닌 집계에는 target이 필요합니다.', path: ['target'] });
  }
});

// Variable
export const VariableBlockSchema = BlockBaseSchema.extend({
  kind: z.literal('variable'),
  name: z.string().min(1),
  scope: z.enum(['component', 'pipeline']),
  overwrite: z.enum(['allow', 'deny']),
});

// Finalize
export const FinalizeBlockSchema = BlockBaseSchema.extend({
  kind: z.literal('finalize'),
  mode: z.enum(['snapshot', 'terminate']),
  note: z.string().optional(),
});

// AnyBlock (discriminated union)
export const AnyBlockSchema: z.ZodType<any> = z.discriminatedUnion('kind', [
  DivisionBlockSchema,
  FunctionBlockSchema,
  ConditionBlockSchema,
  AggregationBlockSchema,
  VariableBlockSchema,
  FinalizeBlockSchema,
]);

// helpers
export function validateBlock(block: unknown) {
  return AnyBlockSchema.safeParse(block);
}
export function validateBlocks(blocks: unknown) {
  return z.array(AnyBlockSchema).safeParse(blocks);
}
