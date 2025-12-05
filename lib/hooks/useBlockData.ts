// lib/hooks/useBlockData.ts
// 파이프라인 페이지에서 token_menu 데이터를 미리 로드하는 훅
// 이제 token_menu는 코드 상수로 관리되므로 API 호출이 필요 없음

import { useMemo } from 'react';
import { ALL_TOKEN_MENUS } from '@/lib/data/token-menus';

export function useBlockData(univId: string) {
  // token_menu는 이제 코드 상수로 관리되므로 즉시 사용 가능
  const tokenMenus = useMemo(() => {
    return ALL_TOKEN_MENUS.map(menu => ({
      id: 0, // 상수 데이터에는 id가 없으므로 0으로 설정
      univ_id: univId || '',
      key: menu.key,
      name: menu.name,
      items: menu.items.map((item, idx) => ({
        id: idx,
        order: item.order,
        label: item.label,
        value: item.value,
        created_at: undefined,
        updated_at: undefined
      })),
      created_at: undefined,
      updated_at: undefined
    }));
  }, [univId]);

  return { 
    blockData: [], // 하위 호환성을 위해 빈 배열 반환
    tokenMenus, 
    loading: false, // 상수 데이터이므로 로딩 불필요
    error: null 
  };
}
