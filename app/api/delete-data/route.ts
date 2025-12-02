import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    // 기존 데이터 삭제
    await prisma.grade_calculation_result.deleteMany()
    
    // calculation_flow 테이블도 삭제 (타입 캐스팅 사용)
    await (prisma as any).calculation_flow?.deleteMany()
    
    return NextResponse.json({ 
      success: true, 
      message: '모든 데이터가 삭제되었습니다.' 
    })
  } catch (error) {
    console.error('데이터 삭제 중 오류 발생:', error)
    return NextResponse.json(
      { success: false, message: '데이터 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 