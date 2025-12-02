import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/token-menu-items/[univ_id]/[menu_key]/[order]
export async function PUT(
  request: NextRequest,
  { params }: { params: { univ_id: string; menu_key: string; order: string } }
) {
  try {
    const { univ_id, menu_key, order } = params;
    const body = await request.json();
    const { label, value } = body;

    // 기존 항목 조회
    const existingItem = await prisma.token_menu_item.findUnique({
      where: {
        univ_id_menu_key_order: {
          univ_id,
          menu_key,
          order: parseInt(order),
        },
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Token menu item not found' },
        { status: 404 }
      );
    }

    // 기존 항목 업데이트 (순서는 변경하지 않음)
    const updatedItem = await prisma.token_menu_item.update({
      where: {
        univ_id_menu_key_order: {
          univ_id,
          menu_key,
          order: parseInt(order),
        },
      },
      data: {
        label,
        value,
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating token menu item:', error);
    return NextResponse.json(
      { error: 'Failed to update token menu item' },
      { status: 500 }
    );
  }
}

// DELETE /api/token-menu-items/[univ_id]/[menu_key]/[order]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { univ_id: string; menu_key: string; order: string } }
) {
  try {
    const { univ_id, menu_key, order } = params;

    await prisma.token_menu_item.delete({
      where: {
        univ_id_menu_key_order: {
          univ_id,
          menu_key,
          order: parseInt(order),
        },
      },
    });

    return NextResponse.json({ message: 'Token menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting token menu item:', error);
    return NextResponse.json(
      { error: 'Failed to delete token menu item' },
      { status: 500 }
    );
  }
}