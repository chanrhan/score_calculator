// /lib/validators/context.ts
import { z } from 'zod';

// Primitive
const Primitive = z.union([z.number(), z.string(), z.boolean()]);

// Score
export const ScoreSchema = z.object({
  converted: z.number().nullable().optional(),
  weighted: z.number().nullable().optional(),
  final: z.number().nullable().optional(),
});

// Subject
export const SubjectSchema = z.object({
  subjectName: z.string().min(1),
  organizationName: z.string().min(1),
  subjectSeparationCode: z.string().min(1),
  grade: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  term: z.union([z.literal(1), z.literal(2)]),
  credit: z.number().nonnegative(),

  originalScore: z.number().optional(),
  rankingGrade: z.number().optional(),
  achievement: z.string().optional(),
  assessment: z.string().optional(),

  studentCount: z.number().optional(),
  avgScore: z.number().optional(),
  standardDeviation: z.number().optional(),
  achievementRatio: z.number().optional(),

  score: ScoreSchema.optional(),
});

// StudentContext
export const StudentContextSchema = z.object({
  admission: z.string().min(1),
  major: z.string().min(1),
  graduateYear: z.number().int(),
  applicantScCode: z.string().min(1),
  identifyNumber: z.string().min(1),
});

// Vars
export const VarsScopeSchema = z.object({
  pipeline: z.record(Primitive),
  components: z.record(z.string(), z.record(Primitive)).transform((rec) => {
    // 키를 number로도 사용하므로, 문자열 키 허용
    return rec;
  }),
});

// Context
export const ContextSchema = z.object({
  student: StudentContextSchema,
  subjects: z.array(SubjectSchema),
  metrics: z.record(Primitive),
  vars: VarsScopeSchema,
});

export type SubjectInput = z.infer<typeof SubjectSchema>;
export type ContextInput = z.infer<typeof ContextSchema>;

// helpers
export function validateContext(input: unknown) {
  return ContextSchema.safeParse(input);
}
export function validateSubjects(input: unknown) {
  return z.array(SubjectSchema).safeParse(input);
}
