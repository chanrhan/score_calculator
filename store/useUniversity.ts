// /store/useUniversity.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type University = { id: string; name: string };

type UniversityState = {
  universities: University[];
  selectedUnivId: string;
  setSelectedUnivId: (id: string) => void;
  loadUniversities: () => Promise<void>;
  addUniversity: (name: string) => Promise<University | undefined>;
};

const LS_KEY = 'gpb:university';

export const useUniversity = create<UniversityState>()(
  persist(
    (set, get) => ({
      universities: [],
      selectedUnivId: '',

      setSelectedUnivId: (id) => set({ selectedUnivId: id }),

      loadUniversities: async () => {
        try {
          const res = await fetch('/api/universities');
          if (!res.ok) throw new Error('대학교 목록 조회 실패');
          const list: University[] = await res.json();
          set({ universities: list });
          // 기존 선택이 없고 목록이 있으면 첫 항목으로 기본 설정하지 않음 (명시적 선택 유도)
        } catch (e) {
          set({ universities: [] });
        }
      },

      addUniversity: async (name: string) => {
        const body = { name: name.trim() };
        if (!body.name) return undefined;
        const res = await fetch('/api/universities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('대학교 추가 실패');
        const created: University = await res.json();
        // 목록 새로고침 및 선택 갱신
        await get().loadUniversities();
        set({ selectedUnivId: created.id });
        return created;
      },
    }),
    {
      name: LS_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // 마이그레이션 필요 시 version 올리고 migrate 추가
    }
  )
);


