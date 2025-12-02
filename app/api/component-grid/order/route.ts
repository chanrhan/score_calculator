// app/api/component-grid/order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adjustComponentOrder } from '@/lib/adapters/componentGridDb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pipelineId, sourceComponentId, targetComponentId, direction } = body;

    // 입력 검증
    if (!pipelineId || !sourceComponentId || !targetComponentId || !direction) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    if (!['before', 'after'].includes(direction)) {
      return NextResponse.json(
        { success: false, error: 'direction은 "before" 또는 "after"여야 합니다.' },
        { status: 400 }
      );
    }

    // ComponentGrid 순서 조정 실행
    const result = await adjustComponentOrder(
      parseInt(pipelineId),
      parseInt(sourceComponentId),
      parseInt(targetComponentId),
      direction
    );

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('ComponentGrid 순서 조정 API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

