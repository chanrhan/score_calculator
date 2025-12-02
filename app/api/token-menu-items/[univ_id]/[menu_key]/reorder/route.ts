import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/token-menu-items/[univ_id]/[menu_key]/reorder
export async function PUT(
  request: NextRequest,
  { params }: { params: { univ_id: string; menu_key: string } }
) {
  try {
    const { univ_id, menu_key } = params;
    const body = await request.json();
    const { items } = body;

    // 토큰 메뉴가 존재하는지 확인
    const tokenMenu = await prisma.token_menu.findUnique({
      where: {
        univ_id_key: {
          univ_id,
          key: menu_key,
        },
      },
    });

    if (!tokenMenu) {
      return NextResponse.json(
        { error: 'Token menu not found' },
        { status: 404 }
      );
    }

    // 트랜잭션으로 모든 항목의 순서 업데이트
    await prisma.$transaction(async (tx) => {
      // 기존 항목들 삭제
      await tx.token_menu_item.deleteMany({
        where: {
          univ_id,
          menu_key,
        },
      });

      // 새 순서로 항목들 생성
      for (const item of items) {
        await tx.token_menu_item.create({
          data: {
            univ_id,
            menu_key,
            order: item.order,
            label: item.label,
            value: item.value,
          },
        });
      }
    });

    return NextResponse.json({ message: 'Items reordered successfully' });
  } catch (error) {
    console.error('Error reordering token menu items:', error);
    return NextResponse.json(
      { error: 'Failed to reorder token menu items' },
      { status: 500 }
    );
  }
}
