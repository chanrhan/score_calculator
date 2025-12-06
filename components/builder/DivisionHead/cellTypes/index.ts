// 구분 헤드 바디 셀 타입 컴포넌트 매핑
import * as React from 'react'
import { GraduateYearCell } from './GraduateYearCell'
import { GraduateGradeCell } from './GraduateGradeCell'
import { SubjectGroupCell } from './SubjectGroupCell'
import { AdmissionCodeCell } from './AdmissionCodeCell'
import { MajorCodeCell } from './MajorCodeCell'
import { ApplicantScCodeCell } from './ApplicantScCodeCell'
import { SubjectSeparationCodeCell } from './SubjectSeparationCodeCell'
import { SubjectGroupUnitSumCell } from './SubjectGroupUnitSumCell'
import { FilteredBlockIdCell } from './FilteredBlockIdCell'

export interface DivisionHeadCellTypeProps {
  cellData: Record<string, any>
  onChange: (key: string, value: any) => void
  readOnly?: boolean
}

export type DivisionHeadCellTypeComponent = React.FC<DivisionHeadCellTypeProps>

// division_type 값과 셀 타입 컴포넌트 매핑
export const DIVISION_TYPE_CELL_MAP: Record<string, DivisionHeadCellTypeComponent> = {
  graduateYear: GraduateYearCell,
  graduateGrade: GraduateGradeCell,
  subjectGroup: SubjectGroupCell,
  admissionCode: AdmissionCodeCell,
  majorCode: MajorCodeCell,
  applicantScCode: ApplicantScCodeCell,
  subjectSeparationCode: SubjectSeparationCodeCell,
  subjectGroupUnitSum: SubjectGroupUnitSumCell,
  filtered_block_id: FilteredBlockIdCell,
} as const

/**
 * division_type에 해당하는 셀 타입 컴포넌트를 반환합니다.
 * @param divisionType 구분 유형 값
 * @returns 셀 타입 컴포넌트 또는 null
 */
export function getDivisionHeadCellType(
  divisionType: string
): DivisionHeadCellTypeComponent | null {
  return DIVISION_TYPE_CELL_MAP[divisionType] || null
}

