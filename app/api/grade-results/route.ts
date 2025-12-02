// app/api/grade-results/route.ts
// 성적 계산 결과 조회 API

import { NextRequest, NextResponse } from 'next/server';
import { GradeResultsBatchService } from '@/services/grade-results-batch.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pipelineId = searchParams.get('pipelineId');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const orderBy = searchParams.get('orderBy');
    const order = searchParams.get('order');
    const studentId = searchParams.get('studentId');

    // 필수 파라미터 검증
    if (!pipelineId) {
      return NextResponse.json(
        {
          success: false,
          message: 'pipelineId 파라미터는 필수입니다.'
        },
        { status: 400 }
      );
    }

    // 파라미터 타입 검증
    const pipelineIdNum = parseInt(pipelineId);
    if (isNaN(pipelineIdNum) || pipelineIdNum <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'pipelineId는 양의 정수여야 합니다.'
        },
        { status: 400 }
      );
    }

    // 옵션 파라미터 처리
    const options = {
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0,
      orderBy: (orderBy as 'final_score' | 'rank') || 'final_score',
      order: (order as 'asc' | 'desc') || 'desc',
      studentId: studentId || undefined
    };

    // limit과 offset 범위 검증
    if (options.limit < 1 || options.limit > 1000) {
      return NextResponse.json(
        {
          success: false,
          message: 'limit은 1-1000 범위여야 합니다.'
        },
        { status: 400 }
      );
    }

    if (options.offset < 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'offset은 0 이상이어야 합니다.'
        },
        { status: 400 }
      );
    }

    // console.log(`📊 성적 계산 결과 조회 - Pipeline ID: ${pipelineIdNum}, Options:`, options);

    // 성적 계산 결과 조회
    const batchService = new GradeResultsBatchService();
    const { results, total } = await batchService.getResults(pipelineIdNum, options);

    // console.log(`✅ 결과 조회 완료 - ${results.length}개 (전체 ${total}개)`);

    return NextResponse.json({
      success: true,
      message: '성적 계산 결과를 성공적으로 조회했습니다.',
      data: {
        results: results.map(result => ({
          studentId: result.student_id,
          finalScore: result.final_score,
          rank: result.rank,
          tieBreaker: result.tie_breaker,
          createdAt: result.created_at,
          admissionCode: (result as any).admission_code ?? null,
          admissionName: (result as any).admission_name ?? null,
        })),
        pagination: {
          total,
          limit: options.limit,
          offset: options.offset,
          hasMore: options.offset + options.limit < total
        }
      }
    });

  } catch (error) {
    console.error('❌ 성적 계산 결과 조회 API 에러:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: '성적 계산 결과 조회 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST 메서드로 결과 통계 조회 (옵션)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pipelineId, action } = body;

    if (!pipelineId || !action) {
      return NextResponse.json(
        {
          success: false,
          message: 'pipelineId와 action 파라미터는 필수입니다.'
        },
        { status: 400 }
      );
    }

    const pipelineIdNum = parseInt(pipelineId);
    if (isNaN(pipelineIdNum) || pipelineIdNum <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'pipelineId는 양의 정수여야 합니다.'
        },
        { status: 400 }
      );
    }

    console.log(`📈 성적 계산 통계 조회 - Pipeline ID: ${pipelineIdNum}, Action: ${action}`);

    // TODO: 통계 조회 로직 구현
    // const batchService = new GradeResultsBatchService();
    // const stats = await batchService.getStatistics(pipelineIdNum, action);

    return NextResponse.json({
      success: true,
      message: '통계 조회 기능은 구현 예정입니다.',
      data: {
        pipelineId: pipelineIdNum,
        action,
        statistics: 'not_implemented'
      }
    });

  } catch (error) {
    console.error('❌ 성적 계산 통계 조회 API 에러:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: '성적 계산 통계 조회 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
