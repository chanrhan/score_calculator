import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/token-menu-items?schoolCode=001&menuKey=example
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolCode = searchParams.get('schoolCode');
    const menuKey = searchParams.get('menuKey');

    if (!schoolCode) {
      return NextResponse.json(
        { error: 'schoolCode parameter is required' },
        { status: 400 }
      );
    }

    const where: any = {
      OR: [
        { univ_id: schoolCode }, // 선택된 대학의 메뉴 아이템
        {
          menu: {
            scope: 1 // 공통 메뉴의 아이템
          }
        }
      ]
    };

    if (menuKey) {
      where.AND = [
        { menu_key: menuKey }
      ];
    }

    const tokenMenuItems = await prisma.token_menu_item.findMany({
      where,
      include: {
        menu: {
          select: {
            scope: true,
            name: true
          }
        }
      },
      orderBy: [
        { menu_key: 'asc' },
        { order: 'asc' },
      ],
    });

    return NextResponse.json(tokenMenuItems);
  } catch (error) {
    console.error('Error fetching token menu items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token menu items' },
      { status: 500 }
    );
  }
}

// POST /api/token-menu-items
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { schoolCode, menuKey, order, label, value } = body;

    if (!schoolCode || !menuKey || order === undefined || !label || !value) {
      return NextResponse.json(
        { error: 'schoolCode, menuKey, order, label, and value are required' },
        { status: 400 }
      );
    }

    // Check if token menu exists
    const tokenMenu = await prisma.token_menu.findUnique({
      where: {
        univ_id_key: {
          univ_id: schoolCode,
          key: menuKey,
        },
      },
    });

    if (!tokenMenu) {
      return NextResponse.json(
        { error: 'Token menu not found' },
        { status: 404 }
      );
    }

    // Check if item with same order already exists
    const existingItem = await prisma.token_menu_item.findUnique({
      where: {
        univ_id_menu_key_order: {
          univ_id: schoolCode,
          menu_key: menuKey,
          order: order,
        },
      },
    });

    if (existingItem) {
      return NextResponse.json(
        { error: 'Item with this order already exists in the menu' },
        { status: 409 }
      );
    }

    const tokenMenuItem = await prisma.token_menu_item.create({
      data: {
        univ_id: schoolCode,
        menu_key: menuKey,
        order,
        label,
        value,
      },
    });

    return NextResponse.json(tokenMenuItem, { status: 201 });
  } catch (error) {
    console.error('Error creating token menu item:', error);
    return NextResponse.json(
      { error: 'Failed to create token menu item' },
      { status: 500 }
    );
  }
}
