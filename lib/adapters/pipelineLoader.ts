// lib/adapters/pipelineLoader.ts
// DB ComponentGrid 데이터를 usePipelines 스토어 형태로 변환하는 어댑터

import { Component } from '@/types/domain';
import type { HierarchicalCell } from '@/types/hierarchicalCell';
import { ComponentGridLoadData } from './componentGridDb';
import { BLOCK_TYPE } from '@/types/block-types';
import type { FlowBlock } from '@/types/block-structure';
import type { DivisionHeadData } from '@/types/division-head';
// import { convertFromFlowBlock } from './blockAdapter';

// 블록 타입 번호를 kind 문자열로 변환
function getBlockKindFromType(blockType: number): string {
  switch (blockType) {
    case BLOCK_TYPE.DIVISION: return 'division'
    case BLOCK_TYPE.APPLY_SUBJECT: return 'apply_subject'
    case BLOCK_TYPE.GRADE_RATIO: return 'grade_ratio'
    case BLOCK_TYPE.APPLY_TERM: return 'apply_term'
    case BLOCK_TYPE.TOP_SUBJECT: return 'top_subject'
    case BLOCK_TYPE.SUBJECT_GROUP_RATIO: return 'subject_group_ratio'
    case BLOCK_TYPE.SEPARATION_RATIO: return 'separation_ratio'
    case BLOCK_TYPE.SCORE_MAP: return 'score_map'
    case BLOCK_TYPE.FORMULA: return 'formula'
    case BLOCK_TYPE.VARIABLE: return 'variable'
    case BLOCK_TYPE.CONDITION: return 'condition'
    default: return 'unknown'
  }
}

// DB에서 로드한 ComponentGrid 배열을 Pipeline의 Component 배열로 변환
export function convertComponentGridsToPipelineComponents(
  componentGrids: ComponentGridLoadData[]
): Component[] {
  return componentGrids
    .sort((a, b) => a.order - b.order) // order 순으로 정렬
    .map(grid => convertComponentGridToComponent(grid));
}

// 단일 ComponentGrid를 Component로 변환
function convertComponentGridToComponent(grid: ComponentGridLoadData): Component {
  // FlowBlock들을 그대로 사용 (변환 불필요)
  const blocks: FlowBlock[] = grid.blocks;

  const component: Component = {
    id: grid.componentId,
    name: `Component ${grid.componentId}`,
    predecessorId: null, // DB에는 컴포넌트 간 연결 정보가 없으므로 null로 설정
    position: grid.order,
    ui: { 
      x: grid.x ?? 0, 
      y: grid.y ?? 0, 
      hierarchicalDataMap: grid.hierarchicalDataMap ? 
        Object.fromEntries(
          Object.entries(grid.hierarchicalDataMap).map(([key, value]) => [Number(key), value])
        ) as Record<number, HierarchicalCell[]> : 
        undefined 
    },
    blocks,
    divisionHead: grid.divisionHead
  };

  return component;
}

// 빈 Pipeline 생성 (데이터가 없을 때 사용)
export function createEmptyPipeline(pipelineId: string, name: string = 'New Pipeline'): {
  id: string;
  name: string;
  version: string;
  isActive: boolean;
  components: Component[];
} {
  return {
    id: pipelineId,
    name,
    version: 'v1',
    isActive: true,
    components: []
  };
}