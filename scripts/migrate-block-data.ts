import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateBlockData() {

  try {
    // Prisma 클라이언트 확인
    
    // 0. 기본 대학 데이터 생성
    await prisma.univ.upsert({
      where: { id: '001' },
      update: {},
      create: {
        id: '001',
        name: '테스트 대학교',
        created_at: new Date()
      }
    });

    // 1. element_type 데이터 생성
    await prisma.element_type.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, name: 'Token' }
    });
    
    await prisma.element_type.upsert({
      where: { id: 2 },
      update: {},
      create: { id: 2, name: 'Text' }
    });

    await prisma.element_type.upsert({
      where: { id: 3 },
      update: {},
      create: { id: 3, name: 'Table' }
    });
    await prisma.element_type.upsert({
      where: { id: 4 },
      update: {},
      create: { id: 4, name: 'Formula' }
    });
    await prisma.element_type.upsert({
      where: { id: 5 },
      update: {},
      create: { id: 5, name: 'InputField' }
    });

    // 2. block_data 생성
    
    // Division 블록 데이터 (block_type: 1)
    await prisma.block_data.upsert({
      where: { univ_id_block_type: { univ_id: '001', block_type: 1 } },
      update: {},
      create: {
        univ_id: '001',
        block_type: 1, // Division
        block_name: '구분 블록',
        header_cell_type: {
          "gender": "gender_tk_mn",
          "grade": "grade_tk_mn"
        } as Prisma.InputJsonValue,
        body_cell_type: {
          "gender": [
            { "name": "Token", "optional": false, "visible": true, "menu_key": "division_values" }
          ],
          "grade": [
            { "name": "Token", "optional": false, "visible": true, "menu_key": "division_values" }
          ]
        } as Prisma.InputJsonValue
      }
    });

    // ApplySubject 블록 데이터 (block_type: 2)
    await prisma.block_data.upsert({
      where: { univ_id_block_type: { univ_id: '001', block_type: 2 } },
      update: {},
      create: {
        univ_id: '001',
        block_type: 2, // ApplySubject
        block_name: '반영교과 블록',
        header_cell_type: {
          "element_types": [
            { "name": "Token", "optional": false, "visible": true, "menu_key": "include_exclude" },
            { "name": "Text", "optional": false, "visible": true }
          ]
        } as Prisma.InputJsonValue,
        body_cell_type: {
          "element_types": [
            { "name": "Token", "optional": false, "visible": true, "menu_key": "subject_groups" }
          ]
        } as Prisma.InputJsonValue
      }
    });

    // GradeRatio 블록 데이터 (block_type: 3)
    await prisma.block_data.upsert({
      where: { univ_id_block_type: { univ_id: '001', block_type: 3 } },
      update: {},
      create: {
        univ_id: '001',
        block_type: 3, // GradeRatio
        block_name: '학년별 반영비율 블록',
        header_cell_type: {
          "element_types": [
            { "name": "Text", "optional": false, "visible": true }
          ]
        } as Prisma.InputJsonValue,
        body_cell_type: {
          "element_types": [
            { "name": "Token", "optional": false, "visible": true, "menu_key": "percentage_ratio" }
          ]
        } as Prisma.InputJsonValue
      }
    });

    // ApplyTerm 블록 데이터 (block_type: 4)
    await prisma.block_data.upsert({
      where: { univ_id_block_type: { univ_id: '001', block_type: 4 } },
      update: {},
      create: {
        univ_id: '001',
        block_type: 4, // ApplyTerm
        block_name: '반영학기 블록',
        header_cell_type: {
          "element_types": [
            { "name": "Text", "optional": false, "visible": true },
            { "name": "Token", "optional": false, "visible": true, "menu_key": "include_exclude" }
          ]
        } as Prisma.InputJsonValue,
        body_cell_type: {
          "element_types": [
            { "name": "Text", "optional": false, "visible": true },
            { "name": "Token", "optional": false, "visible": true, "menu_key": "term_1_1" },
            { "name": "Token", "optional": false, "visible": true, "menu_key": "term_1_2" },
            { "name": "Token", "optional": false, "visible": true, "menu_key": "term_2_1" },
            { "name": "Token", "optional": false, "visible": true, "menu_key": "term_2_2" },
            { "name": "Token", "optional": false, "visible": true, "menu_key": "term_3_1" },
            { "name": "Token", "optional": false, "visible": true, "menu_key": "term_3_2" },
            { "name": "Token", "optional": true, "visible": true, "menu_key": "top_terms" }
          ]
        } as Prisma.InputJsonValue
      }
    });

    // TopSubject 블록 데이터 (block_type: 5)
    await prisma.block_data.upsert({
      where: { univ_id_block_type: { univ_id: '001', block_type: 5 } },
      update: {},
      create: {
        univ_id: '001',
        block_type: 5, // TopSubject
        block_name: '우수 N 과목 블록',
        header_cell_type: {
          "element_types": [
            { "name": "Text", "optional": false, "visible": true }
          ]
        } as Prisma.InputJsonValue,
        body_cell_type: {
          "element_types": [
            { "name": "Token", "optional": true, "visible": true, "menu_key": "top_subject_scope" },
            { "name": "Token", "optional": false, "visible": true, "menu_key": "top_subject_count" }
          ]
        } as Prisma.InputJsonValue
      }
    });

    // SubjectGroupRatio 블록 데이터 (block_type: 6)
    await prisma.block_data.upsert({
      where: { univ_id_block_type: { univ_id: '001', block_type: 6 } },
      update: {},
      create: {
        univ_id: '001',
        block_type: 6, // SubjectGroupRatio
        block_name: '교과군별 반영비율 블록',
        header_cell_type: {
          "element_types": [
            { "name": "Token", "optional": false, "visible": true, "menu_key": "subject_groups" }
          ]
        } as Prisma.InputJsonValue,
        body_cell_type: {
          "element_types": [
            { "name": "Token", "optional": false, "visible": true, "menu_key": "percentage_ratio" }
          ]
        } as Prisma.InputJsonValue
      }
    });

    // SeparationRatio 블록 데이터 (block_type: 7)
    await prisma.block_data.upsert({
      where: { univ_id_block_type: { univ_id: '001', block_type: 7 } },
      update: {},
      create: {
        univ_id: '001',
        block_type: 7, // SeparationRatio
        block_name: '일반/진로/예체능 분리 반영비율 블록',
        header_cell_type: {
          "element_types": [
            { "name": "Text", "optional": false, "visible": true }
          ]
        } as Prisma.InputJsonValue,
        body_cell_type: {
          "element_types": [
            { "name": "Token", "optional": false, "visible": true, "menu_key": "percentage_ratio" }
          ]
        } as Prisma.InputJsonValue
      }
    });

    // ScoreMap 블록 데이터 (block_type: 8)
    await prisma.block_data.upsert({
      where: { univ_id_block_type: { univ_id: '001', block_type: 8 } },
      update: {},
      create: {
        univ_id: '001',
        block_type: 8, // ScoreMap
        block_name: '배점표 블록',
        header_cell_type: {
          "element_types": [
            { "name": "Text", "optional": false, "visible": true }
          ]
        } as Prisma.InputJsonValue,
        body_cell_type: {
          "element_types": [
            { "name": "Token", "optional": false, "visible": true, "menu_key": "score_types" },
            { "name": "Token", "optional": false, "visible": true, "menu_key": "match_types" },
            { "name": "Text", "optional": false, "visible": true },
            { "name": "Token", "optional": false, "visible": true, "menu_key": "score_types" },
            { "name": "Token", "optional": false, "visible": true, "menu_key": "match_types" },
            { "name": "Table", "optional": false, "visible": true, "init_rows": 2, "init_cols": 3, "input_type": "원점수", "input_option": "range", "output_type": "배점" }
          ]
        } as Prisma.InputJsonValue
      }
    });

    // Formula 블록 데이터 (block_type: 9)
    await prisma.block_data.upsert({
      where: { univ_id_block_type: { univ_id: '001', block_type: 9 } },
      update: {},
      create: {
        univ_id: '001',
        block_type: 9, // Formula
        block_name: '수식 블록',
        header_cell_type: {
          "element_types": [
            { "name": "Text", "optional": false, "visible": true }
          ]
        } as Prisma.InputJsonValue,
        body_cell_type: {
          "element_types": [
            { "name": "Formula", "optional": false, "visible": true }
          ]
        } as Prisma.InputJsonValue
      }
    });

    // Variable 블록 데이터 (block_type: 10)
    await prisma.block_data.upsert({
      where: { univ_id_block_type: { univ_id: '001', block_type: 10 } },
      update: {},
      create: {
        univ_id: '001',
        block_type: 10, // Variable
        block_name: '변수 블록',
        header_cell_type: {
          "element_types": [
            { "name": "Text", "optional": false, "visible": true }
          ]
        } as Prisma.InputJsonValue,
        body_cell_type: {
          "element_types": [
            { "name": "InputField", "optional": false, "visible": true },
            { "name": "Formula", "optional": false, "visible": true }
          ]
        } as Prisma.InputJsonValue
      }
    });

    // Condition 블록 데이터 (block_type: 11)
    await prisma.block_data.upsert({
      where: { univ_id_block_type: { univ_id: '001', block_type: 11 } },
      update: {},
      create: {
        univ_id: '001',
        block_type: 11, // Condition
        block_name: '조건 블록',
        header_cell_type: {
          "element_types": [
            { "name": "Text", "optional": false, "visible": true }
          ]
        } as Prisma.InputJsonValue,
        body_cell_type: {
          "element_types": [
            { "name": "Formula", "optional": false, "visible": true }
          ]
        } as Prisma.InputJsonValue
      }
    });

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateBlockData();