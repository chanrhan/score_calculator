// lib/hooks/useBlockData.ts
// 파이프라인 페이지에서 block_data와 token_menu 데이터를 미리 로드하는 훅

import { useEffect } from 'react';
import { useBlockDataStore } from '@/store/useBlockDataStore';

export function useBlockData(univId: string) {
  const { 
    blockData, 
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
    if (selectedUnivId === univId && blockData.length > 0) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        setSelectedUnivId(univId);

        // API를 통해 block_data와 token_menu 데이터를 로드
        const response = await fetch(`/api/block-data/load?univ_id=${univId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to load block data');
        }
        // console.log(data.blockData);

        setBlockData(data.blockData, data.tokenMenus);

      } catch (error) {
        console.error('❌ Error loading block data:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    loadData();
  }, [univId, selectedUnivId, blockData.length, setBlockData, setLoading, setError, setSelectedUnivId]);

  return { blockData, tokenMenus, loading, error };
}
