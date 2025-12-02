// scripts/update-block-data-init-values.ts
// block_data 테이블의 init_row, init_col 값을 업데이트하는 스크립트

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateBlockDataInitValues() {
  try {

    // Division 블록 (block_type: 1) - 2열 3행
    await prisma.block_data.updateMany({
      where: { block_type: 1 },
      data: { init_row: 3, init_col: 2 }
    });

    // ApplySubject 블록 (block_type: 2) - 1열 2행
    await prisma.block_data.updateMany({
      where: { block_type: 2 },
      data: { init_row: 2, init_col: 1 }
    });

    // GradeRatio 블록 (block_type: 3) - 1열 3행
    await prisma.block_data.updateMany({
      where: { block_type: 3 },
      data: { init_row: 3, init_col: 1 }
    });

    // ApplyTerm 블록 (block_type: 4) - 1열 2행
    await prisma.block_data.updateMany({
      where: { block_type: 4 },
      data: { init_row: 2, init_col: 1 }
    });

    // TopSubject 블록 (block_type: 5) - 1열 2행
    await prisma.block_data.updateMany({
      where: { block_type: 5 },
      data: { init_row: 2, init_col: 1 }
    });

    // SubjectGroupRatio 블록 (block_type: 6) - 1열 2행
    await prisma.block_data.updateMany({
      where: { block_type: 6 },
      data: { init_row: 2, init_col: 1 }
    });

    // SeparationRatio 블록 (block_type: 7) - 1열 2행
    await prisma.block_data.updateMany({
      where: { block_type: 7 },
      data: { init_row: 2, init_col: 1 }
    });

    // ScoreMap 블록 (block_type: 8) - 1열 2행
    await prisma.block_data.updateMany({
      where: { block_type: 8 },
      data: { init_row: 2, init_col: 1 }
    });

    // Formula 블록 (block_type: 9) - 1열 1행
    await prisma.block_data.updateMany({
      where: { block_type: 9 },
      data: { init_row: 1, init_col: 1 }
    });

    // Variable 블록 (block_type: 10) - 1열 1행
    await prisma.block_data.updateMany({
      where: { block_type: 10 },
      data: { init_row: 1, init_col: 1 }
    });

    // Condition 블록 (block_type: 11) - 1열 1행
    await prisma.block_data.updateMany({
      where: { block_type: 11 },
      data: { init_row: 1, init_col: 1 }
    });


    // 결과 확인
    const updatedBlocks = await prisma.block_data.findMany({
      select: {
        block_type: true,
        block_name: true,
        init_row: true,
        init_col: true
      }
    });


  } catch (error) {
    console.error('❌ Error updating block_data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateBlockDataInitValues();
