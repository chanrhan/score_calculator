// /lib/validators/functions.ts
import { z } from 'zod';

// 1) ApplySubject
export const ApplySubjectParamsSchema = z.object({
  mode: z.enum(['include', 'exclude']),
  groups: z.array(z.string().min(1)).optional(),
  organizationNames: z.array(z.string().min(1)).optional(),
});

// 2) ApplyTerm
export const ApplyTermParamsSchema = z.object({
  terms: z.array(
    z.object({
      grade: z.union([z.literal(1), z.literal(2), z.literal(3)]),
      term: z.union([z.literal(1), z.literal(2)]),
      enabled: z.boolean(),
    })
  ).min(1, '적어도 한 학기는 지정되어야 합니다.'),
  topTerms: z.number().int().positive().optional(),
  sortExpr: z.string().min(1).optional(),
});

// 3) TopSubject
export const TopSubjectParamsSchema = z.object({
  N: z.number().int().positive(),
  mode: z.enum(['perGroup', 'overall']),
  groupBy: z.enum(['organizationName', 'subjectSeparationCode', 'custom']).optional(),
  customKeyExpr: z.string().min(1).optional(),
  sortExpr: z.string().min(1).optional(),
}).superRefine((val, ctx) => {
  if (val.mode === 'perGroup' && val.groupBy === 'custom' && !val.customKeyExpr) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'groupBy=custom이면 customKeyExpr가 필요합니다.',
      path: ['customKeyExpr'],
    });
  }
});

// 4) ScoreMap
const ExactTableSchema = z.record(z.string(), z.number());
const RangeRowSchema = z.object({ min: z.number(), max: z.number(), value: z.number() })
  .refine(r => r.min <= r.max, { message: 'range row: min ≤ max' });
const RangeTableSchema = z.array(RangeRowSchema).min(1);

const LinearPointSchema = z.object({ x: z.number(), y: z.number() });
const LinearTableSchema = z.array(LinearPointSchema).min(2).superRefine((rows, ctx) => {
  // x 오름차순/중복 금지
  for (let i = 1; i < rows.length; i++) {
    if (!(rows[i-1].x < rows[i].x)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'linear table은 x가 오름차순이며 중복되면 안 됩니다.',
        path: [i, 'x'],
      });
      break;
    }
  }
});

export const ScoreMapParamsSchema = z.object({
  inputType: z.enum(['original', 'rankingGrade', 'percentile', 'customExpr']),
  match: z.enum(['exact', 'range_inclusive', 'linear']),
  table: z.any(), // 구체 스키마는 아래 refine에서 결정
  outOfRange: z.enum(['clip', 'error']),
  customExpr: z.string().min(1).optional(),
}).superRefine((val, ctx) => {
  if (val.inputType === 'customExpr' && !val.customExpr) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'inputType=customExpr면 customExpr가 필요합니다.', path: ['customExpr'] });
  }
  // table 형태 검증
  try {
    if (val.match === 'exact') ExactTableSchema.parse(val.table ?? {});
    else if (val.match === 'range_inclusive') RangeTableSchema.parse(val.table ?? []);
    else LinearTableSchema.parse(val.table ?? []);
  } catch (e: any) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `table 형식 오류: ${e?.message ?? e}`, path: ['table'] });
  }
});

// 5) GradeRatio
export const GradeRatioParamsSchema = z.object({
  g1: z.number().min(0).max(100),
  g2: z.number().min(0).max(100),
  g3: z.number().min(0).max(100),
});

// 6) SubjectGroupRatio
export const SubjectGroupRatioParamsSchema = z.object({
  rows: z.array(
    z.object({
      groups: z.array(z.string().min(1)).min(1),
      ratio: z.number().min(0).max(100),
    })
  ).min(1),
});

// 7) SeparationRatio
export const SeparationRatioParamsSchema = z.object({
  general: z.number().min(0).max(100),
  career: z.number().min(0).max(100),
  arts: z.number().min(0).max(100),
});

// 8) MultiplyRatio
export const MultiplyRatioParamsSchema = z.object({
  ratio: z.number().min(0).max(100),
});

// 9) Formula
export const FormulaParamsSchema = z.object({
  dsl: z.string().min(1),
  target: z.union([
    z.literal('score.final'),
    z.literal('score.weighted'),
    z.literal('score.converted'),
    z.string().regex(/^metrics\.[A-Za-z_][A-Za-z0-9_]*$/, 'metrics.<name> 형식을 따라야 합니다.'),
  ]).optional(),
});

// 통합 매핑 (Block validator에서 사용)
export const FunctionParamSchemaByKind = {
  apply_subject: ApplySubjectParamsSchema,
  apply_term: ApplyTermParamsSchema,
  top_subject: TopSubjectParamsSchema,
  score_map: ScoreMapParamsSchema,
  grade_ratio: GradeRatioParamsSchema,
  subject_group_ratio: SubjectGroupRatioParamsSchema,
  separation_ratio: SeparationRatioParamsSchema,
  multiply_ratio: MultiplyRatioParamsSchema,
  formula: FormulaParamsSchema,
} as const;

export type FunctionKindKey = keyof typeof FunctionParamSchemaByKind;

// helpers
export function validateFunctionParams(kind: FunctionKindKey, params: unknown) {
  const schema = FunctionParamSchemaByKind[kind];
  if (!schema) return { success: false as const, error: `Unknown function kind: ${kind}` };
  return schema.safeParse(params);
}
