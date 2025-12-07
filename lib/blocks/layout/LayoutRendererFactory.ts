// lib/blocks/layout/LayoutRendererFactory.ts
// 블록 타입별 LayoutRenderer를 생성하는 팩토리

import { BlockLayoutRenderer } from './BlockLayoutRenderer';
import { GenericBlockLayoutRenderer } from './GenericBlockLayoutRenderer';
import { BlockLayoutRendererRegistry } from '../modules/registry';

export class LayoutRendererFactory {
  private static rendererCache: Map<number, BlockLayoutRenderer> = new Map();

  /**
   * 블록 타입에 맞는 LayoutRenderer 생성
   */
  static create(blockType: number): BlockLayoutRenderer {
    // 캐시 확인
    if (this.rendererCache.has(blockType)) {
      return this.rendererCache.get(blockType)!;
    }

    // 레지스트리에서 렌더러 팩토리 찾기
    const rendererFactory = BlockLayoutRendererRegistry[blockType];
    
    let renderer: BlockLayoutRenderer;
    
    if (rendererFactory) {
      // 레지스트리에 등록된 팩토리 사용
      renderer = rendererFactory();
    } else {
      // 레지스트리에 없으면 GenericBlockLayoutRenderer 사용
      renderer = new GenericBlockLayoutRenderer();
    }

    // 캐시에 저장
    this.rendererCache.set(blockType, renderer);
    
    return renderer;
  }

  /**
   * 캐시 초기화
   */
  static clearCache(): void {
    this.rendererCache.clear();
  }
}

