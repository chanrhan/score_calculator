import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/token-menu-items/[univ_id]/[menu_key]
export async function POST(
  request: NextRequest,
  { params }: { params: { univ_id: string; menu_key: string } }
) {
  try {
    const { univ_id, menu_key } = params;
    const body = await request.json();
    const { label, value } = body;

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

    // 현재 최대 순서 번호 찾기
    const lastItem = await prisma.token_menu_item.findFirst({
      where: {
        univ_id,
        menu_key,
      },
      orderBy: {
        order: 'desc',
      },
    });

    const nextOrder = lastItem ? lastItem.order + 1 : 1;

    // 새 항목 생성
    const newItem = await prisma.token_menu_item.create({
      data: {
        univ_id,
        menu_key,
        order: nextOrder,
        label,
        value,
      },
    });

    return NextResponse.json(newItem);
  } catch (error) {
    console.error('Error creating token menu item:', error);
    return NextResponse.json(
      { error: 'Failed to create token menu item' },
      { status: 500 }
    );
  }
}

// DELETE /api/token-menu-items/[univ_id]/[menu_key]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { univ_id: string; menu_key: string } }
) {
  try {
    const { univ_id, menu_key } = params

    // 해당 메뉴의 모든 항목 일괄 삭제
    await prisma.token_menu_item.deleteMany({
      where: { univ_id, menu_key },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error bulk deleting token menu items:', error)
    return NextResponse.json(
      { error: 'Failed to bulk delete token menu items' },
      { status: 500 }
    )
  }
}