import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const studentCount = await prisma.student_base_info.count()
    const subjectCount = await prisma.subject_score.count()

    return NextResponse.json({
      studentCount,
      subjectCount,
      hasData: studentCount > 0 || subjectCount > 0
    })
  } catch (error) {
    console.error('통계 조회 오류:', error)
    return NextResponse.json({ error: '통계 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
} 