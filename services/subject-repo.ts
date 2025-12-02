import { prisma } from '@/lib/prisma'

type FetchSubjectParams = {
  configId: string
  includeTerms: string[]
  applicantScCode?: number | null
  applyTargets?: Array<'expected' | 'graduated' | 'early'>
  excludeByName?: string[]
  excludeByGroup?: string[]
}

export async function fetchStageOneSubjectScores(params: FetchSubjectParams) {
  const { configId, includeTerms, applicantScCode, applyTargets = [], excludeByName = [], excludeByGroup = [] } = params

  // includeTerms 예시: ['1-1','1-2','2-1','3-2'] → (grade, term) 조합으로 변환
  const gradeTermCombos = (includeTerms || []).map(t => {
    const [g, tt] = String(t).split('-')
    const grade = Number(g)
    const term = Number(tt)
    if (!Number.isFinite(grade) || !Number.isFinite(term)) return null
    return { grade, term }
  }).filter(Boolean) as Array<{ grade: number; term: number }>

  // 적용대상 조건 구성 (다중 선택 OR)
  let studentWhere: any = undefined
  const atSet = new Set(applyTargets || [])
  const orConds: any[] = []
  if (atSet.has('expected')) orConds.push({ applicantScCode: 0 })
  if (atSet.has('graduated')) orConds.push({ applicantScCode: 1 })
  if (atSet.has('early')) orConds.push({ applicantScCode: 0, graduateGrade: { lt: 3 } })
  if (orConds.length > 0) {
    studentWhere = { OR: orConds }
  } else if (applicantScCode != null) {
    // 하위 호환: 단일 applicantScCode 전달 시
    studentWhere = { applicantScCode: applicantScCode }
  }

  const subjects = await prisma.subject_score.findMany({
    where: {
      OR: gradeTermCombos.length
        ? gradeTermCombos.map(gt => ({ grade: gt.grade, term: gt.term }))
        : undefined,
      subjectName: excludeByName.length ? { notIn: excludeByName } : undefined,
      subjectSeparationCode: excludeByGroup.length ? { notIn: excludeByGroup } : undefined,
      student_base_info: studentWhere,
    },
  })

  return subjects
}

export function groupByStudentIdentifyNumber(rows: Array<{ identifyNumber: string }>) {
  const map = new Map<string, any[]>()
  for (const r of rows) {
    const key = r.identifyNumber
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(r)
  }
  return map
}


