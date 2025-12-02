// lib/adapters/dbToPipeline.ts
// DB에서 파이프라인 도메인 모델로 변환하는 어댑터 (성적 계산 엔진용)

import { PrismaClient } from '@prisma/client';
import type { Pipeline, Component, AnyBlock } from '@/types/domain';
import { getBlockTypeName, isDivisionBlock, isFunctionBlock } from '@/utils/blockTypeMapper';
import { convertHierarchicalToFlatRows, convertDivisionToAnyBlock } from '@/utils/hierarchicalCellConverter';
import { HierarchicalCell } from '@/types/hierarchicalCell';

const prisma = new PrismaClient();

export interface PipelineLoadResult {
  pipeline: Pipeline;
  metadata: {
    componentCount: number;
    blockCount: number;
    divisionBlockCount: number;
  };
}

/**
 * DB에서 전체 파이프라인을 도메인 모델 형식으로 로드
 */
export async function loadPipelineFromDb(pipelineId: number): Promise<PipelineLoadResult | null> {
  try {
    // 파이프라인 기본 정보 조회
    const dbPipeline = await prisma.pipelines.findUnique({
      where: { id: pipelineId },
      include: {
        components: {
          include: {
            blocks: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!dbPipeline) {
      return null;
    }

    // 도메인 모델로 변환
    const components: Component[] = [];
    let totalBlockCount = 0;
    let divisionBlockCount = 0;

    for (const dbComponent of dbPipeline.components) {
      const blocks: AnyBlock[] = [];

      for (const dbBlock of dbComponent.blocks) {
        const blockTypeName = getBlockTypeName(dbBlock.block_type);
        const anyBlock = await convertDbBlockToAnyBlock(dbBlock);
        
        if (anyBlock) {
          blocks.push(anyBlock);
          totalBlockCount++;
          
          if (isDivisionBlock(blockTypeName)) {
            divisionBlockCount++;
          }
        }
      }

      const component: Component = {
        id: dbComponent.component_id,
        name: `Component ${dbComponent.component_id}`,
        position: dbComponent.order,
        blocks,
        ui: { x: 0, y: 0 } // UI 위치는 별도 관리 필요
      };

      components.push(component);
    }

    const pipeline: Pipeline = {
      id: pipelineId.toString(),
      name: dbPipeline.name,
      version: dbPipeline.version,
      isActive: dbPipeline.is_active,
      components
    };

    return {
      pipeline,
      metadata: {
        componentCount: components.length,
        blockCount: totalBlockCount,
        divisionBlockCount
      }
    };

  } catch (error) {
    console.error('❌ Error loading pipeline from DB:', error);
    throw error;
  }
}

/**
 * DB Block을 도메인 모델 AnyBlock으로 변환
 */
async function convertDbBlockToAnyBlock(dbBlock: any): Promise<AnyBlock | null> {
  const blockTypeName = getBlockTypeName(dbBlock.block_type);
  
  try {
    switch (blockTypeName) {
      case 'Division':
        return convertDivisionBlock(dbBlock);
      
      case 'ApplyTerm':
        return convertApplyTermBlock(dbBlock);
      
      case 'ApplySubject':
        return convertApplySubjectBlock(dbBlock);
      
      case 'TopSubject':
        return convertTopSubjectBlock(dbBlock);
      
      case 'ScoreMap':
        return convertScoreMapBlock(dbBlock);
      
      case 'GradeRatio':
        return convertGradeRatioBlock(dbBlock);
      
      case 'SubjectGroupRatio':
        return convertSubjectGroupRatioBlock(dbBlock);
      
      case 'SeparationRatio':
        return convertSeparationRatioBlock(dbBlock);
      
      case 'Formula':
        return convertFormulaBlock(dbBlock);
      
      case 'Variable':
        return convertVariableBlock(dbBlock);
      
      case 'Condition':
        return convertConditionBlock(dbBlock);
      
      default:
        console.warn(`Unknown block type: ${blockTypeName}`);
        return null;
    }
  } catch (error) {
    console.error(`Error converting block ${dbBlock.block_id} (${blockTypeName}):`, error);
    return null;
  }
}

/**
 * Division 블록 변환
 */
function convertDivisionBlock(dbBlock: any): AnyBlock {
  const hierarchicalCells = dbBlock.body_cells as HierarchicalCell[];
  const flatRows = convertHierarchicalToFlatRows(hierarchicalCells);
  
  return {
    id: dbBlock.block_id,
    kind: 'division',
    position: dbBlock.order,
    spec: {
      rows: flatRows.map(row => ({
        criteria: row.criteria,
        caseKey: `case_${row.id}`,
        caseName: Object.values(row.value).join('_') || 'default'
      }))
    }
  } as any;
}

/**
 * ApplyTerm 블록 변환
 */
function convertApplyTermBlock(dbBlock: any): AnyBlock {
  const bodyData = dbBlock.body_cells;
  const headerData = dbBlock.header_cells;
  
  // FlowCell에서 설정 추출
  const operation = extractTokenValue(headerData, 0, 0) || 'include';
  const termSettings = extractTermSettings(bodyData);
  
  return {
    id: dbBlock.block_id,
    kind: 'function',
    position: dbBlock.order,
    funcType: 'apply_term',
    params: {
      operation,
      terms: termSettings
    }
  } as any;
}

/**
 * ApplySubject 블록 변환
 */
function convertApplySubjectBlock(dbBlock: any): AnyBlock {
  const bodyData = dbBlock.body_cells;
  const headerData = dbBlock.header_cells;
  
  const operation = extractTokenValue(headerData, 0, 0) || 'include';
  const subjectGroups = extractTokenItems(bodyData, 0, 0);
  
  return {
    id: dbBlock.block_id,
    kind: 'function',
    position: dbBlock.order,
    funcType: 'apply_subject',
    params: {
      operation,
      subject_groups: subjectGroups
    }
  } as any;
}

/**
 * TopSubject 블록 변환  
 */
function convertTopSubjectBlock(dbBlock: any): AnyBlock {
  const bodyData = dbBlock.body_cells;
  
  const count = extractTokenValue(bodyData, 0, 0) || '3';
  const scope = extractTokenValue(bodyData, 0, 1) || 'overall';
  
  return {
    id: dbBlock.block_id,
    kind: 'function',
    position: dbBlock.order,
    funcType: 'top_subject',
    params: {
      count: parseInt(count),
      scope
    }
  } as any;
}

/**
 * ScoreMap 블록 변환
 */
function convertScoreMapBlock(dbBlock: any): AnyBlock {
  const bodyData = dbBlock.body_cells;
  
  const inputType = extractTokenValue(bodyData, 0, 0) || 'originalScore';
  const outputType = extractTokenValue(bodyData, 0, 1) || 'score';
  const tableData = extractTableData(bodyData, 0, 2);
  
  return {
    id: dbBlock.block_id,
    kind: 'function',
    position: dbBlock.order,
    funcType: 'score_map',
    params: {
      input: { type: inputType },
      output: { type: outputType },
      mapping_table: tableData
    }
  } as any;
}

/**
 * GradeRatio 블록 변환
 */
function convertGradeRatioBlock(dbBlock: any): AnyBlock {
  const bodyData = dbBlock.body_cells;
  
  return {
    id: dbBlock.block_id,
    kind: 'function',
    position: dbBlock.order,
    funcType: 'grade_ratio',
    params: {
      grade1_ratio: parseFloat(extractTokenValue(bodyData, 0, 0) || '100'),
      grade2_ratio: parseFloat(extractTokenValue(bodyData, 0, 1) || '100'),
      grade3_ratio: parseFloat(extractTokenValue(bodyData, 0, 2) || '100')
    }
  } as any;
}

/**
 * SubjectGroupRatio 블록 변환
 */
function convertSubjectGroupRatioBlock(dbBlock: any): AnyBlock {
  const headerData = dbBlock.header_cells;
  const bodyData = dbBlock.body_cells;
  
  const ratios: Array<{subject_group: string, ratio: number}> = [];
  
  if (headerData && headerData[0] && bodyData && bodyData[0]) {
    const headerRow = headerData[0];
    const bodyRow = bodyData[0];
    
    for (let i = 0; i < headerRow.length; i++) {
      const subjectGroup = extractTokenValue(headerData, 0, i);
      const ratioValue = extractTokenValue(bodyData, 0, i);
      
      if (subjectGroup && ratioValue) {
        ratios.push({
          subject_group: subjectGroup,
          ratio: parseFloat(ratioValue)
        });
      }
    }
  }
  
  return {
    id: dbBlock.block_id,
    kind: 'function',
    position: dbBlock.order,
    funcType: 'subject_group_ratio',
    params: { ratios }
  } as any;
}

/**
 * SeparationRatio 블록 변환
 */
function convertSeparationRatioBlock(dbBlock: any): AnyBlock {
  const bodyData = dbBlock.body_cells;
  
  return {
    id: dbBlock.block_id,
    kind: 'function',
    position: dbBlock.order,
    funcType: 'separation_ratio',
    params: {
      general_ratio: parseFloat(extractTokenValue(bodyData, 0, 0) || '100'),
      career_ratio: parseFloat(extractTokenValue(bodyData, 0, 1) || '100'),
      arts_ratio: parseFloat(extractTokenValue(bodyData, 0, 2) || '100')
    }
  } as any;
}

/**
 * Formula 블록 변환
 */
function convertFormulaBlock(dbBlock: any): AnyBlock {
  const bodyData = dbBlock.body_cells;
  const dslExpression = extractFormulaValue(bodyData, 0, 0) || '';
  
  return {
    id: dbBlock.block_id,
    kind: 'function',
    position: dbBlock.order,
    funcType: 'formula',
    params: {
      dsl_expression: dslExpression
    }
  } as any;
}

/**
 * Variable 블록 변환
 */
function convertVariableBlock(dbBlock: any): AnyBlock {
  const bodyData = dbBlock.body_cells;
  const varName = extractInputFieldValue(bodyData, 0, 0) || 'unnamed_var';
  const dslExpression = extractFormulaValue(bodyData, 0, 1) || '';
  
  return {
    id: dbBlock.block_id,
    kind: 'variable',
    position: dbBlock.order,
    spec: {
      varName,
      scope: 'component',
      dslExpression
    }
  } as any;
}

/**
 * Condition 블록 변환
 */
function convertConditionBlock(dbBlock: any): AnyBlock {
  const bodyData = dbBlock.body_cells;
  const conditionExpression = extractFormulaValue(bodyData, 0, 0) || '';
  
  return {
    id: dbBlock.block_id,
    kind: 'condition',
    position: dbBlock.order,
    spec: {
      conditionExpression,
      hasElse: false
    }
  } as any;
}

// ============ 유틸리티 함수들 ============

/**
 * FlowCell에서 Token 값 추출
 */
function extractTokenValue(cellData: any, rowIndex: number, colIndex: number): string | null {
  try {
    const row = cellData?.[rowIndex];
    const cell = row?.[colIndex];
    const tokenElement = cell?.elements?.find((e: any) => e.element_type === 'Token');
    return tokenElement?.value || null;
  } catch {
    return null;
  }
}

/**
 * FlowCell에서 Token items 추출
 */
function extractTokenItems(cellData: any, rowIndex: number, colIndex: number): any[] {
  try {
    const row = cellData?.[rowIndex];
    const cell = row?.[colIndex];
    const tokenElement = cell?.elements?.find((e: any) => e.element_type === 'Token');
    return tokenElement?.items || [];
  } catch {
    return [];
  }
}

/**
 * FlowCell에서 Formula 값 추출
 */
function extractFormulaValue(cellData: any, rowIndex: number, colIndex: number): string | null {
  try {
    const row = cellData?.[rowIndex];
    const cell = row?.[colIndex];
    const formulaElement = cell?.elements?.find((e: any) => e.element_type === 'Formula');
    return formulaElement?.value || null;
  } catch {
    return null;
  }
}

/**
 * FlowCell에서 InputField 값 추출
 */
function extractInputFieldValue(cellData: any, rowIndex: number, colIndex: number): string | null {
  try {
    const row = cellData?.[rowIndex];
    const cell = row?.[colIndex];
    const inputElement = cell?.elements?.find((e: any) => e.element_type === 'InputField');
    return inputElement?.content || null;
  } catch {
    return null;
  }
}

/**
 * FlowCell에서 Table 데이터 추출
 */
function extractTableData(cellData: any, rowIndex: number, colIndex: number): any {
  try {
    const row = cellData?.[rowIndex];
    const cell = row?.[colIndex];
    const tableElement = cell?.elements?.find((e: any) => e.element_type === 'Table');
    return {
      rows: tableElement?.init_rows || 2,
      cols: tableElement?.init_cols || 3,
      values: tableElement?.value || []
    };
  } catch {
    return { rows: 2, cols: 3, values: [] };
  }
}

/**
 * ApplyTerm 블록에서 학기별 설정 추출
 */
function extractTermSettings(bodyData: any): Record<string, string> {
  const terms: Record<string, string> = {};
  
  try {
    if (bodyData && bodyData[0]) {
      const row = bodyData[0];
      
      row.forEach((cell: any) => {
        cell?.elements?.forEach((element: any) => {
          if (element.element_type === 'Token' && element.value && element.value.includes(':')) {
            const [term, status] = element.value.split(':');
            terms[term] = status;
          }
        });
      });
    }
  } catch (error) {
    console.warn('Error extracting term settings:', error);
  }
  
  return terms;
}