import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateColEditable() {
  try {
    console.log('col_editable 컬럼 업데이트 시작...');

    // SubjectGroupRatio와 Division 블록 타입에 대해 col_editable을 true로 설정
    // 블록 타입 ID는 block-structure.ts에서 확인한 값들을 사용
    const editableBlockTypes = [
      { name: 'SubjectGroupRatio', id: 5 }, // SubjectGroupRatio
      { name: 'Division', id: 1 }         // Division
    ];

    for (const blockType of editableBlockTypes) {
      const result = await prisma.block_data.updateMany({
        where: {
          block_type: blockType.id
        },
        data: {
          col_editable: true
        }
      });

      console.log(`${blockType.name} (ID: ${blockType.id}) 블록 타입 업데이트 완료: ${result.count}개 레코드`);
    }

    // 나머지 모든 블록 타입은 기본값 false로 유지 (이미 스키마에서 기본값 설정됨)
    const allBlockTypes = await prisma.block_data.findMany({
      select: {
        block_type: true,
        block_name: true,
        col_editable: true
      }
    });

    console.log('\n현재 모든 블록 타입의 col_editable 상태:');
    allBlockTypes.forEach(block => {
      console.log(`- ${block.block_name} (ID: ${block.block_type}): ${block.col_editable}`);
    });

    console.log('\ncol_editable 컬럼 업데이트 완료!');
  } catch (error) {
    console.error('업데이트 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateColEditable();
