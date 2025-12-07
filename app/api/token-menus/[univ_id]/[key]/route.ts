import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/token-menus/[univ_id]/[key]
export async function GET(
  request: NextRequest,
  { params }: { params: { univ_id: string; key: string } }
) {
  try {
    const { univ_id, key } = params;

    // admission_code와 major_code는 admission/major 테이블에서 조회
    if (key === 'admission_code') {
      const admissions = await prisma.admission.findMany({
        where: { univ_id },
        orderBy: { code: 'asc' },
      });
      
      // token_menu 형식으로 변환
      const items = admissions.map((admission, index) => ({
        id: index + 1,
        order: index + 1,
        label: admission.name,
        value: admission.code,
        menu_key: 'admission_code',
        univ_id: admission.univ_id,
        created_at: admission.created_at,
        updated_at: admission.created_at,
      }));

      return NextResponse.json({
        id: 0,
        key: 'admission_code',
        name: '모집 전형 코드',
        univ_id,
        scope: 0,
        created_at: new Date(),
        updated_at: new Date(),
        items,
      });
    }

    if (key === 'major_code') {
      const majors = await prisma.major.findMany({
        where: { univ_id },
        orderBy: { code: 'asc' },
      });
      
      // token_menu 형식으로 변환
      const items = majors.map((major, index) => ({
        id: index + 1,
        order: index + 1,
        label: major.name,
        value: major.code,
        menu_key: 'major_code',
        univ_id: major.univ_id,
        created_at: major.created_at,
        updated_at: major.created_at,
      }));

      return NextResponse.json({
        id: 0,
        key: 'major_code',
        name: '모집 단위 코드',
        univ_id,
        scope: 0,
        created_at: new Date(),
        updated_at: new Date(),
        items,
      });
    }

    // 기타 토큰 메뉴는 token_menu 테이블에서 조회
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

    // 토큰 메뉴가 없을 경우 빈 items 배열을 포함한 객체 반환
    if (!tokenMenu) {
      return NextResponse.json({
        key,
        univ_id: null,
        name: '',
        scope: 0,
        items: [],
      });
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

