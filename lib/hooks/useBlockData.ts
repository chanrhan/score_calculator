// lib/hooks/useBlockData.ts
// 파이프라인 페이지에서 token_menu 데이터를 미리 로드하는 훅
// block_data는 더 이상 사용하지 않음 (BLOCK_TYPES 직접 사용)

import { useEffect } from 'react';
import { useBlockDataStore } from '@/store/useBlockDataStore';

export function useBlockData(univId: string) {
  const { 
    blockData, // 하위 호환성을 위해 유지하지만 빈 배열
    tokenMenus, 
    loading, 
    error, 
    selectedUnivId,
    setBlockData, 
    setLoading, 
    setError, 
    setSelectedUnivId 
  } = useBlockDataStore();

  useEffect(() => {
    if (!univId) {
      setLoading(false);
      return;
    }

    // 이미 같은 대학의 데이터가 로드되어 있으면 다시 로드하지 않음
    if (selectedUnivId === univId && tokenMenus.length > 0) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        setSelectedUnivId(univId);

        // API를 통해 token_menu 데이터만 로드 (block_data는 더 이상 사용하지 않음)
        const response = await fetch(`/api/block-data/load?univ_id=${univId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to load token menus');
        }

        // blockData는 빈 배열로 설정 (하위 호환성 유지)
        setBlockData([], data.tokenMenus);

      } catch (error) {
        console.error('❌ Error loading token menus:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    loadData();
  }, [univId, selectedUnivId, tokenMenus.length, setBlockData, setLoading, setError, setSelectedUnivId]);

  return { blockData: [], tokenMenus, loading, error }; // blockData는 항상 빈 배열 반환
}
