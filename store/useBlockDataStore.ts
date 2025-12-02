// store/useBlockDataStore.ts
// 전역 block_data와 token_menu 상태 관리

import { create } from 'zustand';
import type { BlockData, TokenMenu } from '@/types/block-data';

interface BlockDataState {
  blockData: BlockData[];
  tokenMenus: TokenMenu[];
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
  clearData: () => void;
}

type BlockDataStore = BlockDataState & BlockDataActions;

export const useBlockDataStore = create<BlockDataStore>((set, get) => ({
  // 초기 상태
  blockData: [],
  tokenMenus: [],
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

  clearData: () => 
    set({ blockData: [], tokenMenus: [], loading: false, error: null })
}));
