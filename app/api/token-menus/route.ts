import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/token-menus?schoolCode=001
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolCode = searchParams.get('schoolCode');

    if (!schoolCode) {
      return NextResponse.json(
        { error: 'schoolCode parameter is required' },
        { status: 400 }
      );
    }

    const tokenMenus = await prisma.token_menu.findMany({
      where: {
        OR: [
          { univ_id: schoolCode }, // 선택된 대학의 모든 토큰 메뉴
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
        { created_at: 'desc' }
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

// POST /api/token-menus
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { schoolCode, key, name, scope = 0 } = body;

    if (!schoolCode || !key || !name) {
      return NextResponse.json(
        { error: 'schoolCode, key, and name are required' },
        { status: 400 }
      );
    }

    // Check if token menu already exists
    const existingMenu = await prisma.token_menu.findUnique({
      where: {
        univ_id_key: {
          univ_id: schoolCode,
          key: key,
        },
      },
    });

    if (existingMenu) {
      return NextResponse.json(
        { error: 'Token menu with this key already exists' },
        { status: 409 }
      );
    }

    const tokenMenu = await prisma.token_menu.create({
      data: {
        univ_id: schoolCode,
        key,
        name,
        scope,
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(tokenMenu, { status: 201 });
  } catch (error) {
    console.error('Error creating token menu:', error);
    return NextResponse.json(
      { error: 'Failed to create token menu' },
      { status: 500 }
    );
  }
}
