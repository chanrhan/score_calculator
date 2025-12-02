import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { makeWorkbookBuffer } from '@/lib/utils/excelExport'

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

    // 필요한 두 컬럼만 선택하고, 식별번호 오름차순 정렬
    const records = await prisma.grade_results.findMany({
      where: { pipeline_id: BigInt(pipelineIdNum) },
      select: { student_id: true, final_score: true },
      orderBy: { student_id: 'asc' }
    })

    const rows = records.map(r => ({
      identifyNumber: r.student_id,
      finalScore: Number(r.final_score)
    }))

    const buf = makeWorkbookBuffer(rows)

    const filename = `grade_results_pipeline_${pipelineIdNum}_${new Date().toISOString().split('T')[0]}.xlsx`
    return new NextResponse(buf, {
      status: 200,
      headers: new Headers({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      })
    })
  } catch (error) {
    console.error('❌ 성적 결과 엑셀 내보내기 API 에러:', error)
    return NextResponse.json({ success: false, message: '엑셀 내보내기 중 오류가 발생했습니다.' }, { status: 500 })
  }
}


