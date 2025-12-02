import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolCode = searchParams.get('univId');

    if (!schoolCode) {
      return NextResponse.json({
        success: false,
        message: 'schoolCode 파라미터가 필요합니다.'
      }, { status: 400 });
    }

    console.log(`📋 학교 파이프라인 목록 조회 중... (학교코드: ${schoolCode})`);

    // 학교의 파이프라인 목록 조회
    const pipelines = await prisma.pipelines.findMany({
      where: {
        univ_id: schoolCode
      },
      select: {
        id: true,
        name: true,
        version: true,
        config_name: true,
        created_at: true,
        _count: {
          select: {
            grade_results: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log(`✅ 파이프라인 목록 조회 완료: ${pipelines.length}개`);

    return NextResponse.json({
      success: true,
      data: {
        pipelines: pipelines.map(pipeline => ({
          id: pipeline.id.toString(),
          name: pipeline.name,
          version: pipeline.version,
          configName: pipeline.config_name,
          createdAt: pipeline.created_at.toISOString(),
          resultCount: pipeline._count.grade_results
        }))
      }
    });

  } catch (error) {
    console.error('❌ 파이프라인 목록 조회 에러:', error);
    
    return NextResponse.json({
      success: false,
      message: '파이프라인 목록 조회 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}