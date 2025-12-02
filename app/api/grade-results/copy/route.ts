import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { scoresToClipboardText } from '@/lib/utils/clipboard'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pipelineId = searchParams.get('pipelineId')

    if (!pipelineId) {
      return NextResponse.json({ success: false, message: 'pipelineId 파라미터는 필수입니다.' }, { status: 400 })
    }

    const pipelineIdNum = parseInt(pipelineId)
    if (isNaN(pipelineIdNum) || pipelineIdNum <= 0) {
      return NextResponse.json({ success: false, message: 'pipelineId는 양의 정수여야 합니다.' }, { status: 400 })
    }

    const rows = await prisma.grade_results.findMany({
      where: { pipeline_id: BigInt(pipelineIdNum) },
      select: { student_id: true, final_score: true },
      orderBy: { student_id: 'asc' }
    })

    const scores = rows.map(r => Number(r.final_score))
    const body = scoresToClipboardText(scores)

    return new NextResponse(body, {
      status: 200,
      headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
    })
  } catch (error) {
    console.error('❌ 결과 복사 API 에러:', error)
    return NextResponse.json({ success: false, message: '결과 복사 본문 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}


