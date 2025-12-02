import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/token-menus/[univ_id]
export async function GET(
  request: NextRequest,
  { params }: { params: { univ_id: string } }
) {
  try {
    const { univ_id } = params;

    const tokenMenus = await prisma.token_menu.findMany({
      where: {
        OR: [
          { univ_id }, // 선택된 대학의 모든 토큰 메뉴
          { scope: 1 } // 공통 토큰 메뉴
        ],
      },
      include: {
        items: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: [
        { scope: 'desc' }, // 공통(1) 먼저, 그 다음 대학교별(0)
        { key: 'asc' }
      ],
    });

    return NextResponse.json(tokenMenus);
  } catch (error) {
    console.error('Error fetching token menus:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token menus' },
      { status: 500 }
    );
  }
}

// POST /api/token-menus/[univ_id]
export async function POST(
  request: NextRequest,
  { params }: { params: { univ_id: string } }
) {
  try {
    const { univ_id } = params;
    const body = await request.json();
    const { key, name, scope } = body;

    // 동일한 키의 메뉴가 있는지 확인
    const existingMenu = await prisma.token_menu.findUnique({
      where: {
        univ_id_key: {
          univ_id,
          key,
        },
      },
    });

    if (existingMenu) {
      return NextResponse.json(
        { error: 'Token menu with this key already exists' },
        { status: 400 }
      );
    }

    // 새 메뉴 생성
    const newMenu = await prisma.token_menu.create({
      data: {
        univ_id,
        key,
        name,
        scope: parseInt(scope) || 0,
      },
    });

    return NextResponse.json(newMenu);
  } catch (error) {
    console.error('Error creating token menu:', error);
    return NextResponse.json(
      { error: 'Failed to create token menu' },
      { status: 500 }
    );
  }
}
