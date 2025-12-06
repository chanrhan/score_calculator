// scripts/verify-division-head-migration.ts
// DivisionHead 마이그레이션 확인 스크립트

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyMigration() {
  try {
    // component_grid 테이블의 컬럼 확인
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'component_grid'
      AND column_name IN ('division_head_header', 'division_head_body', 'division_head_active')
      ORDER BY column_name;
    `;
    
    console.log('✅ DivisionHead 컬럼 확인:');
    console.table(result);
    
    // 샘플 데이터 확인
    const sampleData = await prisma.component_grid.findFirst({
      select: {
        pipeline_id: true,
        component_id: true,
        division_head_header: true,
        division_head_body: true,
        division_head_active: true,
      },
    });
    
    console.log('\n✅ 샘플 데이터:');
    console.log(JSON.stringify(sampleData, null, 2));
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyMigration();

