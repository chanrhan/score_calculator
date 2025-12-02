import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/token-menus/[univ_id]/[key]
export async function GET(
  request: NextRequest,
  { params }: { params: { univ_id: string; key: string } }
) {
  try {
    const { univ_id, key } = params;

    // 선택된 대학의 메뉴 또는 공통 메뉴(scope=1)를 찾기
    const tokenMenu = await prisma.token_menu.findFirst({
      where: {
        key,
        OR: [
          { univ_id }, // 선택된 대학의 메뉴
          { scope: 1 } // 공통 메뉴
        ],
      },
      include: {
        items: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!tokenMenu) {
      return NextResponse.json(
        { error: 'Token menu not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(tokenMenu);
  } catch (error) {
    console.error('Error fetching token menu:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token menu' },
      { status: 500 }
    );
  }
}

// PUT /api/token-menus/[univ_id]/[key]
export async function PUT(
  request: NextRequest,
  { params }: { params: { univ_id: string; key: string } }
) {
  try {
    const { univ_id, key } = params;
    const body = await request.json();
    const { key: newKey, name, scope } = body;

    // 키값이 변경되는 경우
    if (newKey && newKey !== key) {
      // 새 키가 이미 존재하는지 확인
      const existingMenu = await prisma.token_menu.findUnique({
        where: {
          univ_id_key: {
            univ_id,
            key: newKey,
          },
        },
      });

      if (existingMenu) {
        return NextResponse.json(
          { error: '이미 존재하는 키입니다.' },
          { status: 400 }
        );
      }

      // 트랜잭션으로 키 변경 처리
      const result = await prisma.$transaction(async (tx) => {
        // 기존 토큰 메뉴 삭제
        await tx.token_menu.delete({
          where: {
            univ_id_key: {
              univ_id,
              key,
            },
          },
        });

        // 새 키로 토큰 메뉴 생성
        const newTokenMenu = await tx.token_menu.create({
          data: {
            univ_id,
            key: newKey,
            name,
            scope,
          },
          include: {
            items: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        });

        return newTokenMenu;
      });

      return NextResponse.json(result);
    } else {
      // 키값이 변경되지 않는 경우 기존 로직 사용
      const tokenMenu = await prisma.token_menu.update({
        where: {
          univ_id_key: {
            univ_id,
            key,
          },
        },
        data: {
          name,
          scope,
        },
        include: {
          items: {
            orderBy: {
              order: 'asc',
            },
          },
        },
      });

      return NextResponse.json(tokenMenu);
    }
  } catch (error) {
    console.error('Error updating token menu:', error);
    return NextResponse.json(
      { error: 'Failed to update token menu' },
      { status: 500 }
    );
  }
}

// DELETE /api/token-menus/[univ_id]/[key]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { univ_id: string; key: string } }
) {
  try {
    const { univ_id, key } = params;

    await prisma.token_menu.delete({
      where: {
        univ_id_key: {
          univ_id,
          key,
        },
      },
    });

    return NextResponse.json({ message: 'Token menu deleted successfully' });
  } catch (error) {
    console.error('Error deleting token menu:', error);
    return NextResponse.json(
      { error: 'Failed to delete token menu' },
      { status: 500 }
    );
  }
}

