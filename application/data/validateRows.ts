import { z } from 'zod';
import {
  AdmissionRow,
  AdmissionRowSchema,
  CurriculumRow,
  CurriculumRowSchema,
  UnitRow,
  UnitRowSchema,
  ValidationIssue,
  findDuplicateAdmissions,
  findDuplicateCurricula,
  findDuplicateUnits,
} from '@/domain/data/schemas';

type ValidationResult = {
  validCount: number;
  invalidCount: number;
  errors: ValidationIssue[];
};

export function validateAdmissionsRows(rows: unknown[]): ValidationResult {
  const issues: ValidationIssue[] = [];
  const parsed: AdmissionRow[] = [];
  rows.forEach((r, idx) => {
    const res = AdmissionRowSchema.safeParse(r);
    if (!res.success) {
      res.error.issues.forEach((e) => {
        issues.push({ rowIndex: idx, field: e.path.join('.') || '*', message: e.message, code: 'INVALID_FORMAT' });
      });
    } else {
      parsed.push(res.data);
    }
  });
  issues.push(...findDuplicateAdmissions(parsed));
  return { validCount: parsed.length, invalidCount: issues.length, errors: issues };
}

export function validateUnitsRows(rows: unknown[]): ValidationResult {
  const issues: ValidationIssue[] = [];
  const parsed: UnitRow[] = [];
  rows.forEach((r, idx) => {
    const res = UnitRowSchema.safeParse(r);
    if (!res.success) {
      res.error.issues.forEach((e) => {
        issues.push({ rowIndex: idx, field: e.path.join('.') || '*', message: e.message, code: 'INVALID_FORMAT' });
      });
    } else {
      parsed.push(res.data);
    }
  });
  issues.push(...findDuplicateUnits(parsed));
  return { validCount: parsed.length, invalidCount: issues.length, errors: issues };
}

export function validateCurriculaRows(
  rows: unknown[],
  references?: { unitCodes?: Set<string>; subjectCodes?: Set<string> }
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const parsed: CurriculumRow[] = [];
  rows.forEach((r, idx) => {
    const res = CurriculumRowSchema.safeParse(r);
    if (!res.success) {
      res.error.issues.forEach((e) => {
        issues.push({ rowIndex: idx, field: e.path.join('.') || '*', message: e.message, code: 'INVALID_FORMAT' });
      });
    } else {
      parsed.push(res.data);
    }
  });
  issues.push(...findDuplicateCurricula(parsed));

  // FK 체크
  if (references) {
    parsed.forEach((r, idx) => {
      if (references.unitCodes && !references.unitCodes.has(r.unitCode)) {
        issues.push({ rowIndex: idx, field: 'unitCode', message: '존재하지 않는 단위 코드', code: 'FK_NOT_FOUND' });
      }
      if (references.subjectCodes && !references.subjectCodes.has(r.subjectCode)) {
        issues.push({ rowIndex: idx, field: 'subjectCode', message: '존재하지 않는 과목 코드', code: 'FK_NOT_FOUND' });
      }
    });
  }
  return { validCount: parsed.length, invalidCount: issues.length, errors: issues };
}


