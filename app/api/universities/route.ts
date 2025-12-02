import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const universities = await prisma.univ.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(universities);
  } catch (error) {
    console.error('Failed to fetch universities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch universities' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'University name is required' },
        { status: 400 }
      );
    }

    // 기존 대학교 중 가장 큰 ID를 찾아서 다음 ID 생성
    const lastUniv = await prisma.univ.findFirst({
      orderBy: {
        id: 'desc'
      }
    });

    let nextId = '001';
    if (lastUniv) {
      const lastIdNum = parseInt(lastUniv.id);
      nextId = String(lastIdNum + 1).padStart(3, '0');
    }

    const university = await prisma.$transaction(async (tx) => {
      const created = await tx.univ.create({
        data: {
          id: nextId,
          name: name.trim(),
        }
      })

      // 기본 token_menu 3종 생성
      await tx.token_menu.create({
        data: {
          univ_id: created.id,
          key: 'admission_code',
          name: '모집 전형 코드',
          scope: 0,
        },
      })

      await tx.token_menu.create({
        data: {
          univ_id: created.id,
          key: 'major_code',
          name: '모집 단위 코드',
          scope: 0,
        },
      })

      // 코드베이스 일관성: 교과군 키는 subject_groups 사용
      await tx.token_menu.create({
        data: {
          univ_id: created.id,
          key: 'subject_groups',
          name: '교과군',
          scope: 0,
        },
      })

      return created
    })

    return NextResponse.json(university, { status: 201 });
  } catch (error) {
    console.error('Failed to create university:', error);
    return NextResponse.json(
      { error: 'Failed to create university' },
      { status: 500 }
    );
  }
}
