// lib/blockManager.ts
// Component와 Block 관련 모든 로직을 통합한 단일 파일

import { getBlockType, FlowBlockType, CellElement, FlowColumn, HierarchicalCell, FlowCell } from '@/types/block-structure';
import type { FlowBlock } from '@/types/domain';
import { BLOCK_TYPE } from '@/types/block-types';

// ============================================================================
// 1. 블록 타입 관리
// ============================================================================

const BLOCK_TYPE_MAP: Record<number, string> = {
  1: 'Division',
  2: 'ApplySubject', 
  3: 'GradeRatio',
  4: 'ApplyTerm',
  5: 'TopSubject',
  6: 'SubjectGroupRatio',
  7: 'SeparationRatio',
  8: 'ScoreMap',
  9: 'Formula',
  10: 'Variable',
  11: 'Condition',
  12: 'Aggregation',
  13: 'Ratio',
  14: 'FloatFix'
};

const BLOCK_TYPE_ID_MAP: Record<string, number> = Object.fromEntries(
  Object.entries(BLOCK_TYPE_MAP).map(([id, name]) => [name, parseInt(id)])
);

export function getBlockTypeNameById(blockTypeId: number): string {
  return BLOCK_TYPE_MAP[blockTypeId] || 'Unknown';
}

export function getBlockTypeId(blockTypeName: string): number {
  const result = BLOCK_TYPE_ID_MAP[blockTypeName] || 0;
  return result;
}

// ============================================================================
// 2. 그리드 크기 계산
// ============================================================================

export class BlockGridCalculator {
  static calculateGridSize(block: FlowBlock): { rows: number; cols: number } {
    const cols = block.header_cells?.length || 1;
    const rows = block.body_cells?.length || 1;
    return { rows, cols };
  }
}

// ============================================================================
// 3. block_data → FlowBlockType 변환
// ============================================================================

function getSampleValuesForDivisionType(divisionType: string): string[] {
  const sampleValues: Record<string, string[]> = {
    'grade': ['1학년', '2학년', '3학년'],
    'gender': ['남자', '여자'],
    'region': ['서울', '경기', '인천', '부산'],
    'type': ['일반고', '특목고', '자사고'],
    'major': ['인문계', '자연계', '예체능계']
  };
  
  return sampleValues[divisionType] || ['샘플값1', '샘플값2'];
}

export function createFlowBlockTypeFromBlockData(blockData: any, tokenMenus?: any[]): FlowBlockType {
  const { block_type, header_cell_type, body_cell_type, init_row, init_col } = blockData;
  
  const blockTypeName = typeof block_type === 'number' ? getBlockTypeNameById(block_type) : block_type;
  
  if (blockTypeName === 'Division') {
    // Division 블록: header_cell_type과 body_cell_type이 Map 형태
    const header: CellElement[] = [];
    const children: HierarchicalCell[] = [];
    
    // header_cell_type에서 header 생성
    if (header_cell_type && typeof header_cell_type === 'object') {
      Object.entries(header_cell_type).forEach(([divisionType, menuKey]) => {
        const tokenMenu = tokenMenus?.find(tm => tm.key === menuKey);
        const defaultValue = tokenMenu?.items?.[0]?.value || divisionType;
        
        header.push({
          type: 'Token',
          optional: false,
          visible: true,
          menu_key: menuKey as string,
          value: defaultValue
        });
      });
    }
    
    // body_cell_type에서 children 생성
    if (body_cell_type && typeof body_cell_type === 'object') {
      for (let rowIndex = 0; rowIndex < (init_row || 1); rowIndex++) {
        Object.entries(body_cell_type).forEach(([divisionType, elementTypes]) => {
          if (Array.isArray(elementTypes)) {
            const sampleValues = getSampleValuesForDivisionType(divisionType);
            const value = sampleValues[rowIndex] || `샘플값${rowIndex + 1}`;
            
            children.push({
              elements: elementTypes.map(et => {
                const tokenMenu = tokenMenus?.find(tm => tm.key === et.menu_key);
                const defaultValue = tokenMenu?.items?.[0]?.value || value;
                
                return {
                  type: et.name,
                  optional: et.optional || false,
                  visible: et.visible !== false,
                  menu_key: et.menu_key || '',
                  value: et.name === 'Token' ? defaultValue : null,
                  content: et.name === 'Text' ? value : ''
                };
              }),
              children: []
            });
          }
        });
      }
    }
    
    return {
      name: 'Division',
      color: 'purple',
      col_editable: true,
      header,
      children
    };
  } else {
    // 일반 블록: header_cell_type과 body_cell_type이 element_type[] 형태
    const cols: FlowColumn[] = [];
    
    // header_cell_type에서 header 생성
    const headerElements: CellElement[] = [];
    if (header_cell_type?.element_types && Array.isArray(header_cell_type.element_types)) {
      headerElements.push(...header_cell_type.element_types.map((et: any) => {
        const tokenMenu = tokenMenus?.find(tm => tm.key === et.menu_key);
        const defaultValue = tokenMenu?.items?.[0]?.value || '';
        
        return {
          type: et.name,
          optional: et.optional || false,
          visible: et.visible !== false,
          menu_key: et.menu_key || '',
          value: et.name === 'Token' ? defaultValue : null,
          content: et.name === 'Text' ? '샘플 헤더' : ''
        };
      }));
    }
    
    // body_cell_type에서 rows 생성
    const rows: FlowCell[] = [];
    if (body_cell_type?.element_types && Array.isArray(body_cell_type.element_types)) {
      for (let rowIndex = 0; rowIndex < (init_row || 1); rowIndex++) {
        rows.push({
          elements: body_cell_type.element_types.map((et: any) => {
            const tokenMenu = tokenMenus?.find(tm => tm.key === et.menu_key);
            const defaultValue = tokenMenu?.items?.[0]?.value || '';
            
            return {
              type: et.name,
              optional: et.optional || false,
              visible: et.visible !== false,
              menu_key: et.menu_key || '',
              value: et.name === 'Token' ? defaultValue : null,
              content: et.name === 'Text' ? `샘플 데이터 ${rowIndex + 1}` : ''
            };
          })
        });
      }
    }
    
    cols.push({
      header: { elements: headerElements },
      rows
    });
    
    return {
      name: blockTypeName,
      color: 'blue',
      col_editable: blockTypeName === 'SubjectGroupRatio',
      cols
    };
  }
}

// ============================================================================
// 4. FlowBlock ↔ DB 변환
// ============================================================================

interface DbBlockFormat {
  block_type: number;
  block_id: number;
  header_cells: any;
  body_cells: any;
}

export class BlockAdapter {
  
  // FlowBlock → DB 저장 형식
  static toDbFormat(block: FlowBlock, blockData: any): DbBlockFormat {
    return {
      block_type: block.block_type,
      block_id: block.block_id,
      header_cells: JSON.stringify(block.header_cells),
      body_cells: JSON.stringify(block.body_cells)
    };
  }
  
  // DB 저장 형식 → FlowBlock
  static fromDbFormat(dbBlock: any, blockData: any): FlowBlock {
    return {
      block_id: dbBlock.block_id || dbBlock.id,
      block_type: dbBlock.block_type,
      header_cells: JSON.parse(dbBlock.header_cells || '[]'),
      body_cells: JSON.parse(dbBlock.body_cells || '[]')
    };
  }
}

// ============================================================================
// 5. 블록 생성 유틸리티 (BLOCK_TYPES 직접 사용)
// ============================================================================

/**
 * 블록 타입 이름으로부터 FlowBlock 생성 (BLOCK_TYPES 사용)
 * @param kind 블록 타입 이름 (예: 'ApplySubject', 'Division')
 * @param tokenMenus 토큰 메뉴 배열 (기본값 추출용)
 * @returns 초기화된 FlowBlock
 */
export function createFlowBlockFromKind(kind: string, tokenMenus?: any[]): FlowBlock {
  const blockTypeId = getBlockTypeId(kind);
  
  // BlockInstanceFactory를 사용하여 기본값으로 초기화된 BlockInstance 생성
  const { BlockInstanceFactory } = require('./blocks/modules/registry');
  const blockInstance = BlockInstanceFactory.createWithDefaults(blockTypeId, 0);
  
  // FlowBlock 형식으로 변환
  return blockInstance.toFlowBlock();
}

/**
 * block_data로부터 FlowBlock 생성 (하위 호환성 유지)
 * @deprecated block_data 대신 BLOCK_TYPES를 직접 사용하세요. createFlowBlockFromKind를 사용하세요.
 */
export function createFlowBlockFromBlockData(blockData: any, tokenMenus?: any[]): FlowBlock {
  const blockTypeName = typeof blockData.block_type === 'number' ? getBlockTypeNameById(blockData.block_type) : blockData.block_type;
  
  // block_data가 있으면 기존 로직 사용 (하위 호환성)
  if (blockData.header_cell_type || blockData.body_cell_type) {
    // 기존 로직 (임시로 유지)
    return createFlowBlockFromKind(blockTypeName, tokenMenus);
  }
  
  // block_data가 없으면 BLOCK_TYPES에서 직접 생성
  return createFlowBlockFromKind(blockTypeName, tokenMenus);
}
