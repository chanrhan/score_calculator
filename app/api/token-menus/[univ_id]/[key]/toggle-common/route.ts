import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/token-menus/[univ_id]/[key]/toggle-common
export async function PATCH(
  request: NextRequest,
  { params }: { params: { univ_id: string; key: string } }
) {
  try {
    const { univ_id, key } = params;
    const body = await request.json();
    const { targetUnivId } = body;

    if (!targetUnivId) {
      return NextResponse.json(
        { error: 'targetUnivId is required' },
        { status: 400 }
      );
    }

    // 현재 토큰 메뉴 조회
    const currentMenu = await prisma.token_menu.findUnique({
      where: {
        univ_id_key: {
          univ_id,
          key,
        },
      },
    });

    if (!currentMenu) {
      return NextResponse.json(
        { error: 'Token menu not found' },
        { status: 404 }
      );
    }

    // scope 토글 (0 ↔ 1)
    const newScope = currentMenu.scope === 1 ? 0 : 1;

    const updatedMenu = await prisma.token_menu.update({
      where: {
        univ_id_key: {
          univ_id,
          key,
        },
      },
      data: {
        scope: newScope,
      },
      include: {
        items: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return NextResponse.json(updatedMenu);
  } catch (error) {
    console.error('Error toggling token menu common status:', error);
    return NextResponse.json(
      { error: 'Failed to toggle token menu common status' },
      { status: 500 }
    );
  }
}
