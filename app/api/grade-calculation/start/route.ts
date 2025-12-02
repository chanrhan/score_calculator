// app/api/grade-calculation/start/route.ts
// 성적 계산 시작 API

import { NextRequest, NextResponse } from 'next/server';
import { GradeResultsBatchService } from '@/services/grade-results-batch.service';
import { setCalculationDebug, calcLog } from '@/lib/utils/calcLogger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pipelineId, schoolCode, batchSize, calcMode, studentIds } = body;

    // 필수 파라미터 검증
    if (!pipelineId || !schoolCode) {
      return NextResponse.json(
        {
          success: false,
          message: 'pipelineId와 schoolCode는 필수 파라미터입니다.'
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

    // schoolCode 형식 검증 (3자리 문자열)
    if (typeof schoolCode !== 'string' || schoolCode.length !== 3) {
      return NextResponse.json(
        {
          success: false,
          message: 'schoolCode는 3자리 문자열이어야 합니다.'
        },
        { status: 400 }
      );
    }

    // calcMode 검증: 0(전체 계산), 1(조건부 계산)
    if (calcMode !== 0 && calcMode !== 1) {
      return NextResponse.json(
        {
          success: false,
          message: 'calcMode는 0(전체) 또는 1(조건부)이어야 합니다.'
        },
        { status: 400 }
      );
    }

    // 조건부 계산 모드일 때 studentIds 배열 검증
    if (calcMode === 1) {
      if (!Array.isArray(studentIds) || studentIds.length === 0 || !studentIds.every((s: any) => typeof s === 'string' && s.trim().length > 0)) {
        return NextResponse.json(
          {
            success: false,
            message: '조건부 계산(calcMode=1)에서는 유효한 studentIds 문자열 배열이 필요합니다.'
          },
          { status: 400 }
        );
      }
    }

    console.log(`🚀 성적 계산 시작 요청 - Pipeline ID: ${pipelineIdNum}, School Code: ${schoolCode}, calcMode: ${calcMode}${calcMode === 1 ? `, Student IDs: ${studentIds.join(',')}` : ''}`);

    // 성적 계산 배치 서비스 실행
    const batchService = new GradeResultsBatchService();
    
    // 진행률 콜백 함수
    const onProgress = (processed: number, total: number) => {
      const percentage = Math.round((processed / total) * 100);
      process.stdout.write( `\r📊 성적 계산 진행률: ${percentage}% (${processed}/${total})`);
    };

    // 배치 실행 옵션 설정
    const batchOptions: any = {
      batchSize: batchSize || 100,
      onProgress,
      dbChunkSize: 400
    };

    // 조건부 계산 모드일 때 studentIds 추가
    if (calcMode === 1) {
      batchOptions.studentIds = (studentIds as string[]).map(s => s.trim());
    }

    // 배치 실행
    setCalculationDebug(calcMode === 1);
    try {
      const batch = await batchService.executeBatch(
        pipelineIdNum,
        schoolCode,
        batchOptions
      );

    console.log(`✅ 성적 계산 완료 - Batch ID: ${batch.id}`);

      return NextResponse.json({
        success: true,
        message: '성적 계산이 성공적으로 완료되었습니다.',
        data: {
          batchId: batch.id,
          pipelineId: batch.pipelineId,
          totalStudents: batch.totalStudents,
          processedStudents: batch.processedStudents,
          status: batch.status,
          startedAt: batch.startedAt,
          finishedAt: batch.finishedAt,
          resultsCount: batch.results.length
        }
      });
    } finally {
      setCalculationDebug(false);
    }

  } catch (error) {
    console.error('❌ 성적 계산 API 에러:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: '성적 계산 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET 메서드로 계산 상태 조회 (옵션)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      return NextResponse.json(
        {
          success: false,
          message: 'batchId 파라미터가 필요합니다.'
        },
        { status: 400 }
      );
    }

    // TODO: 배치 상태 조회 로직 구현
    // const batchService = new GradeResultsBatchService();
    // const batch = await batchService.getBatch(batchId);

    return NextResponse.json({
      success: true,
      message: '배치 상태 조회 기능은 구현 예정입니다.',
      data: {
        batchId,
        status: 'not_implemented'
      }
    });

  } catch (error) {
    console.error('❌ 배치 상태 조회 API 에러:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: '배치 상태 조회 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
