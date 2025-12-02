import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateDivisionBlock() {
  try {
    const result = await prisma.block_data.updateMany({
      where: { block_type: 1 },
      data: { init_row: 3, init_col: 2 }
    });
    
    const updated = await prisma.block_data.findFirst({
      where: { block_type: 1 }
    });
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDivisionBlock();
