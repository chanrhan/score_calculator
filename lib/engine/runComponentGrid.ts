// lib/engine/runComponentGrid.ts
// ComponentGrid 실행 엔진 - 파이프라인 내 ComponentGrid를 순차적으로 실행

import type { Context, ComponentGridResult, TokenMenuStore } from '@/types/domain';
import { runCaseExecution } from './runCaseExecution';
import { calcLog } from '@/lib/utils/calcLogger';
import { BLOCK_TYPE } from '@/types/block-types';
import { convertGridToHierarchical } from '../adapters/componentGridDb';

export class ComponentGridExecutor {
  private tokenMenuStore: TokenMenuStore;

  constructor(tokenMenuStore: TokenMenuStore) {
    this.tokenMenuStore = tokenMenuStore;
  }

  /**
   * 파이프라인 내 ComponentGrid를 순차적으로 실행
   */
  async executeComponentGrids(
    ctx: Context,
    componentGrids: any[]
  ): Promise<Context> {
    // console.log(`🔄 ComponentGrid 실행 시작 - ${componentGrids.length}개 컴포넌트`);

    let currentCtx = { ...ctx };
    
    // 순서에 맞게 componentGrid별로 순차적으로 실행
    const sortedComponents = componentGrids.slice().sort((a, b) => a.order - b.order);
    
    for (let i = 0; i < sortedComponents.length; i++) {
      const component = sortedComponents[i];
      // console.log(`📦 Component ${i + 1}/${sortedComponents.length} 실행 중 (ID: ${component.component_id})`);
      
      try {
        currentCtx = await this.executeComponentGrid(currentCtx, component);
        // console.log(`✅ Component ${component.component_id} 실행 완료`);
      } catch (error) {
        console.error(`❌ Component ${component.component_id} 실행 실패:`, error);
        throw error;
      }
    }
    return currentCtx;
  }

  /**
   * 개별 ComponentGrid 실행
   */
  private async executeComponentGrid(ctx: Context, component: any): Promise<Context> {
    calcLog(`📋 ComponentGrid ${component.component_id} 실행 시작...`);
    
    // Division 블록 찾기 (ComponentGrid에는 하나의 Division 블록이 있어야 함)
    const divisionBlock = component.blocks.find((block: any) => block.block_type === BLOCK_TYPE.DIVISION); // Division 블록 타입
    
    // if (!divisionBlock) {
    //   throw new Error(`Component ${component.component_id}에 Division 블록이 없습니다.`);
    // }
    // Option B 적용: 로딩 단계에서 이미 변환 완료. 엔진에서는 입력 불변성을 유지한다.
    // console.log('ctx.subjects.length', ctx.subjects.length);
    
    // Division 블록의 RightChain들 (다른 블록들) 찾기
    const rightChainBlocks = component.blocks
      .filter((block: any) => block.block_type !== BLOCK_TYPE.DIVISION) // Division 블록 제외
      .sort((a: any, b: any) => a.order - b.order);

    calcLog(`  🔗 컴포넌트 내 블록 개수 : ${rightChainBlocks.length + 1}개`);

    // Case 실행 엔진으로 DFS 탐색 및 케이스 실행
    const caseExecutor = new runCaseExecution(this.tokenMenuStore);
    const result = await caseExecutor.executeCases(
      ctx,
      divisionBlock,
      rightChainBlocks
    );

    return result;
  }
}

/**
 * ComponentGrid 실행 함수 (외부 인터페이스)
 */
export async function runComponentGrid(
  ctx: Context,
  componentGrids: any[],
  tokenMenuStore: TokenMenuStore
): Promise<Context> {
  const executor = new ComponentGridExecutor(tokenMenuStore);
  return await executor.executeComponentGrids(ctx, componentGrids);
}
