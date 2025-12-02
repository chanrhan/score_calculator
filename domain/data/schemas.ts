import { z } from 'zod';

// 공통 규칙
export const CodeSchema = z
  .string()
  .min(1, '코드는 필수입니다')
  .max(32, '코드는 32자 이하여야 합니다')
  .regex(/^[A-Z0-9\-]+$/, '코드는 대문자/숫자/하이픈만 허용됩니다');

export const NameSchema = z
  .string()
  .min(1, '이름은 필수입니다')
  .max(100, '이름은 100자 이하여야 합니다');

export const YearSchema = z
  .string()
  .regex(/^\d{4}$/u, '연도는 YYYY 형식이어야 합니다');

export const BooleanDefaultTrueSchema = z.boolean().optional().default(true);
export const SortDefaultZeroSchema = z.number().int().optional().default(0);

// 전형(admissions)
export const AdmissionRowSchema = z.object({
  code: CodeSchema,
  name: NameSchema,
  year: YearSchema,
  admissionType: z.string().min(1, '전형유형은 필수입니다'),
  note: z.string().optional(),
  active: BooleanDefaultTrueSchema,
  sort: SortDefaultZeroSchema,
});

// 단위(units)
export const UnitRowSchema = z.object({
  code: CodeSchema,
  name: NameSchema,
  credit: z.number().nonnegative('학점은 0 이상이어야 합니다'),
  subjectGroup: z.string().optional(),
  separationCode: z.string().optional(),
  active: BooleanDefaultTrueSchema,
  sort: SortDefaultZeroSchema,
});

// 편제(curricula)
const DateCoerceSchema = z
  .preprocess((v) => {
    if (v == null || v === '') return null;
    if (v instanceof Date) return v;
    const d = new Date(String(v));
    return isNaN(d.getTime()) ? v : d;
  }, z.date().nullable())
  .optional();

export const CurriculumRowSchema = z.object({
  term: z.string().min(1, '학기는 필수입니다'),
  subjectCode: CodeSchema,
  unitCode: CodeSchema,
  required: z.boolean(),
  credit: z.number().nonnegative('학점은 0 이상이어야 합니다'),
  order: z.number().int().optional(),
  validFrom: DateCoerceSchema,
  validTo: DateCoerceSchema,
});

// 배치 중복 검사 유틸
export type AdmissionRow = z.infer<typeof AdmissionRowSchema>;
export type UnitRow = z.infer<typeof UnitRowSchema>;
export type CurriculumRow = z.infer<typeof CurriculumRowSchema>;

export type ValidationIssue = {
  rowIndex: number;
  field: string;
  message: string;
  code: string;
};

export function findDuplicateAdmissions(rows: AdmissionRow[]): ValidationIssue[] {
  const seen = new Map<string, number>();
  const issues: ValidationIssue[] = [];
  rows.forEach((r, idx) => {
    const key = `${r.code}__${r.year}`;
    if (seen.has(key)) {
      issues.push({
        rowIndex: idx,
        field: 'code',
        message: '업로드 배치 내 중복 전형 (code, year)',
        code: 'DUPLICATE_CODE_YEAR',
      });
    } else {
      seen.set(key, idx);
    }
  });
  return issues;
}

export function findDuplicateUnits(rows: UnitRow[]): ValidationIssue[] {
  const seen = new Map<string, number>();
  const issues: ValidationIssue[] = [];
  rows.forEach((r, idx) => {
    const key = r.code;
    if (seen.has(key)) {
      issues.push({
        rowIndex: idx,
        field: 'code',
        message: '업로드 배치 내 중복 단위 code',
        code: 'DUPLICATE_CODE',
      });
    } else {
      seen.set(key, idx);
    }
  });
  return issues;
}

export function findDuplicateCurricula(rows: CurriculumRow[]): ValidationIssue[] {
  const seen = new Map<string, number>();
  const issues: ValidationIssue[] = [];
  rows.forEach((r, idx) => {
    const key = `${r.term}__${r.subjectCode}__${r.unitCode}`;
    if (seen.has(key)) {
      issues.push({
        rowIndex: idx,
        field: 'term,subjectCode,unitCode',
        message: '업로드 배치 내 중복 편제 (term, subjectCode, unitCode)',
        code: 'DUPLICATE_COMPOSITE',
      });
    } else {
      seen.set(key, idx);
    }
  });
  return issues;
}


