// app/api/block-data/load/route.ts
// 파이프라인 페이지에서 block_data와 token_menu 데이터를 로드하는 API

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const univId = searchParams.get('univ_id');

    if (!univId) {
      return NextResponse.json({ error: 'univ_id is required' }, { status: 400 });
    }

    // token_menu 데이터만 로드 (block_data는 더 이상 사용하지 않음)
    const tokenMenus = await prisma.token_menu.findMany({
      where: {
        OR: [
          { univ_id: univId }, // 선택된 대학의 모든 토큰 메뉴
          { scope: 1 } // 공통 토큰 메뉴
        ]
      },
      include: {
        items: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: [
        { scope: 'desc' }, // 공통(1) 먼저, 그 다음 대학교별(0)
        { key: 'asc' }
      ]
    });

    return NextResponse.json({
      blockData: [], // 빈 배열 반환 (하위 호환성 유지)
      tokenMenus,
      success: true
    });
  } catch (error) {
    console.error('Error loading block data:', error);
    return NextResponse.json(
      { error: 'Failed to load block data' },
      { status: 500 }
    );
  }
}
