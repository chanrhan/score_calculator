import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type CoverageRequest = {
  conditions?: {
    graduate_year?: string[] | null
    admission?: string[] | null
    major?: string[] | null
    subject?: string[] | null
    subject_separation?: string[] | null
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CoverageRequest
    const conditions = body?.conditions || {}

    const totalStudents = await prisma.student_base_info.count()

    // Filters based on available schema only
    const graduateYearFilters = conditions.graduate_year && conditions.graduate_year.length > 0
      ? conditions.graduate_year.map(y => Number.parseInt(y))
      : undefined
    const subjectSeparationFilters = conditions.subject_separation && conditions.subject_separation.length > 0
      ? conditions.subject_separation
      : undefined

    // If no filter provided, coverage equals total
    if (!graduateYearFilters && !subjectSeparationFilters) {
      return NextResponse.json({
        total: totalStudents,
        matched: totalStudents,
        excluded: 0,
        appliedFilters: [],
      })
    }

    // Compute matched students
    let matchedStudentKeys: Set<string> | null = null

    // Helper to build unique key for a student (composite PK parts)
    const makeKey = (r: { mogib1_code: string; mogib2_code: string; identifyNumber: string }) =>
      `${r.mogib1_code}__${r.mogib2_code}__${r.identifyNumber}`

    if (graduateYearFilters) {
      const students = await prisma.student_base_info.findMany({
        where: { graduateYear: { in: graduateYearFilters } },
        select: { mogib1_code: true, mogib2_code: true, identifyNumber: true },
      })
      matchedStudentKeys = new Set(students.map(makeKey))
    }

    if (subjectSeparationFilters) {
      // Unique students having at least one subject with the given separation code
      const grouped = await prisma.subject_score.groupBy({
        by: ['mogib1_code', 'mogib2_code', 'identifyNumber'],
        where: { subjectSeparationCode: { in: subjectSeparationFilters } },
        _count: { _all: true },
      })

      const subjectMatched = new Set(
        grouped.map(g => `${g.mogib1_code}__${g.mogib2_code}__${g.identifyNumber}`)
      )

      if (matchedStudentKeys) {
        // Intersect with graduate year filter
        matchedStudentKeys = new Set(
          [...matchedStudentKeys].filter(k => subjectMatched.has(k))
        )
      } else {
        matchedStudentKeys = subjectMatched
      }
    }

    const matched = matchedStudentKeys ? matchedStudentKeys.size : 0
    const excluded = Math.max(0, totalStudents - matched)

    return NextResponse.json({
      total: totalStudents,
      matched,
      excluded,
      appliedFilters: [
        ...(graduateYearFilters ? [`graduate_year=[${graduateYearFilters.join(', ')}]`] : []),
        ...(subjectSeparationFilters ? [`subject_separation=[${subjectSeparationFilters.join(', ')}]`] : []),
      ],
    })
  } catch (error) {
    console.error('커버리지 계산 오류:', error)
    return NextResponse.json({ error: '커버리지 계산 중 오류가 발생했습니다.' }, { status: 500 })
  }
}


