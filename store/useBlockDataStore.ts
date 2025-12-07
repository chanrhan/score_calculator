// store/useBlockDataStore.ts
// 전역 block_data와 token_menu 상태 관리

import { create } from 'zustand';
import type { BlockData, TokenMenu } from '@/types/block-data';

interface BlockDataState {
  blockData: BlockData[];
  tokenMenus: TokenMenu[];
  // 동적 토큰 메뉴 캐시 (univId:menuKey 조합으로 저장)
  dynamicTokenMenus: Map<string, TokenMenu>;
  loading: boolean;
  error: string | null;
  selectedUnivId: string | null;
}

interface BlockDataActions {
  setBlockData: (blockData: BlockData[], tokenMenus: TokenMenu[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedUnivId: (univId: string | null) => void;
  getBlockDataByType: (blockType: number) => BlockData | undefined;
  getTokenMenuByKey: (key: string) => TokenMenu | undefined;
  // 동적 토큰 메뉴 관련 액션
  getDynamicTokenMenu: (univId: string, menuKey: string) => TokenMenu | undefined;
  setDynamicTokenMenu: (univId: string, menuKey: string, menu: TokenMenu) => void;
  loadDynamicTokenMenu: (univId: string, menuKey: string) => Promise<TokenMenu | null>;
  clearData: () => void;
}

type BlockDataStore = BlockDataState & BlockDataActions;

export const useBlockDataStore = create<BlockDataStore>((set, get) => ({
  // 초기 상태
  blockData: [],
  tokenMenus: [],
  dynamicTokenMenus: new Map(),
  loading: false,
  error: null,
  selectedUnivId: null,

  // 액션들
  setBlockData: (blockData, tokenMenus) => 
    set({ blockData, tokenMenus, loading: false, error: null }),

  setLoading: (loading) => 
    set({ loading }),

  setError: (error) => 
    set({ error, loading: false }),

  setSelectedUnivId: (selectedUnivId) => 
    set({ selectedUnivId }),

  getBlockDataByType: (blockType) => {
    const { blockData } = get();
    return blockData.find(bd => bd.block_type === blockType);
  },

  getTokenMenuByKey: (key) => {
    const { tokenMenus } = get();
    return tokenMenus.find(tm => tm.key === key);
  },

  // 동적 토큰 메뉴 가져오기 (캐시에서)
  getDynamicTokenMenu: (univId, menuKey) => {
    const { dynamicTokenMenus } = get();
    const cacheKey = `${univId}:${menuKey}`;
    return dynamicTokenMenus.get(cacheKey);
  },

  // 동적 토큰 메뉴 저장 (캐시에)
  setDynamicTokenMenu: (univId, menuKey, menu) => {
    const { dynamicTokenMenus } = get();
    const cacheKey = `${univId}:${menuKey}`;
    const newMap = new Map(dynamicTokenMenus);
    newMap.set(cacheKey, menu);
    set({ dynamicTokenMenus: newMap });
  },

  // 동적 토큰 메뉴 로드 (API 호출)
  loadDynamicTokenMenu: async (univId, menuKey) => {
    // 먼저 캐시 확인
    const cached = get().getDynamicTokenMenu(univId, menuKey);
    if (cached) {
      return cached;
    }

    // 캐시에 없으면 API 호출
    try {
      const response = await fetch(`/api/token-menus/${univId}/${menuKey}`);
      if (response.ok) {
        const data = await response.json();
        const menu: TokenMenu = {
          id: data.id || 0,
          univ_id: data.univ_id || univId,
          key: data.key || menuKey,
          name: data.name || menuKey,
          items: (data.items || []).map((item: any) => ({
            id: item.id || 0,
            order: item.order || 0,
            label: item.label,
            value: item.value,
            created_at: item.created_at,
            updated_at: item.updated_at,
          })),
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
        // 캐시에 저장
        get().setDynamicTokenMenu(univId, menuKey, menu);
        return menu;
      }
    } catch (error) {
      console.error(`Failed to load token menu ${menuKey} for ${univId}:`, error);
    }
    return null;
  },

  clearData: () => 
    set({ blockData: [], tokenMenus: [], dynamicTokenMenus: new Map(), loading: false, error: null })
}));
