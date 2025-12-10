// app/api/pipeline-snapshot/[pipelineId]/route.ts
// 파이프라인 스냅샷 조회 API

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pipelineId: string }> | { pipelineId: string } }
) {
  try {
    // Next.js App Router에서 params가 Promise일 수 있으므로 처리
    const resolvedParams = await Promise.resolve(params);
    const pipelineId = Number(resolvedParams.pipelineId);

    if (isNaN(pipelineId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pipeline ID' },
        { status: 400 }
      );
    }

    const snapshot = await prisma.pipeline_snapshot.findUnique({
      where: {
        pipeline_id: BigInt(pipelineId)
      }
    });

    if (!snapshot) {
      return NextResponse.json(
        { success: false, error: 'Pipeline snapshot not found' },
        { status: 404 }
      );
    }

    // BigInt를 문자열로 변환하여 JSON 직렬화 가능하도록 처리
    // components는 이미 JSON이므로 그대로 사용
    const serializedSnapshot = {
      pipeline_id: snapshot.pipeline_id.toString(),
      components: snapshot.components, // 이미 변환된 데이터
      created_at: snapshot.created_at.toISOString(),
      updated_at: snapshot.updated_at.toISOString()
    };

    return NextResponse.json({
      success: true,
      data: serializedSnapshot
    });
  } catch (error) {
    console.error('Error fetching pipeline snapshot:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch pipeline snapshot',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

