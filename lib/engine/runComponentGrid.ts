// lib/engine/runComponentGrid.ts
// ComponentGrid 실행 엔진 - 파이프라인 내 ComponentGrid를 순차적으로 실행

import type { Context, ComponentGridResult, TokenMenuStore } from '@/types/domain';
import { runCaseExecution } from './runCaseExecution';
import { calcLog } from '@/lib/utils/calcLogger';
import { BLOCK_TYPE } from '@/types/block-types';
import type { DivisionHeadData } from '@/types/division-head';

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
    
    // DivisionHead 데이터 가져오기
    const divisionHead: DivisionHeadData | null = component.divisionHead && component.divisionHead.isActive === true
      ? component.divisionHead
      : null;
    
    // 모든 블록들을 RightChain으로 사용 (Division 블록은 더 이상 block 테이블에 없음)
    const rightChainBlocks = component.blocks
      .filter((block: any) => block.block_type !== BLOCK_TYPE.DIVISION) // Division 블록 제외 (혹시 남아있을 수 있음)
      .sort((a: any, b: any) => a.order - b.order);

    const blockCount = rightChainBlocks.length + (divisionHead ? 1 : 0);
    calcLog(`  🔗 컴포넌트 내 블록 개수 : ${blockCount}개`);

    // Case 실행 엔진으로 DFS 탐색 및 케이스 실행
    const caseExecutor = new runCaseExecution(this.tokenMenuStore);
    const result = await caseExecutor.executeCases(
      ctx,
      divisionHead,
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
