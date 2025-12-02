// /store/useSettings.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type AuditLevel = 'none' | 'summary' | 'full';

type SettingsState = {
  auditLevel: AuditLevel;
  concurrency: number; // 프론트 v0에서는 의미 제한적(순차 또는 소수 동시)
  setAuditLevel: (lvl: AuditLevel) => void;
  setConcurrency: (n: number) => void;
};

const LS_KEY = 'gpb:settings';

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      auditLevel: 'summary',
      concurrency: 4,
      setAuditLevel: (auditLevel) => set({ auditLevel }),
      setConcurrency: (n) => set({ concurrency: Math.max(1, Math.floor(n)) }),
    }),
    {
      name: LS_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);
