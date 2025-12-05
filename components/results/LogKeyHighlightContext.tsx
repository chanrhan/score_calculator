// components/results/LogKeyHighlightContext.tsx
'use client';

import { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import type { Snapshot } from '@/types/domain';

// HSL 색상 생성 함수 (문자열 기반)
function generateHslColorFromString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 70%, 85%)`; // 채도와 밝기를 조절하여 부드러운 파스텔톤 색상 생성
}

interface LogKeyHighlightContextType {
  keyColorMap: Map<string, string>;
  hoveredKey: string | null;
  setHoveredKey: (key: string | null) => void;
}

const LogKeyHighlightContext = createContext<LogKeyHighlightContextType | undefined>(undefined);

interface LogKeyHighlightProviderProps {
  contextSnapshots: Snapshot[] | null;
  subjectSnapshots: Snapshot[] | null;
  children: ReactNode;
}

export function LogKeyHighlightProvider({
  contextSnapshots,
  subjectSnapshots,
  children,
}: LogKeyHighlightProviderProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const keyColorMap = useMemo(() => {
    const map = new Map<string, string>();
    const allSnapshots = [...(contextSnapshots || []), ...(subjectSnapshots || [])];
    
    if (!allSnapshots) return map;

    allSnapshots.forEach(snapshot => {
      if (snapshot.input_key && !map.has(snapshot.input_key)) {
        map.set(snapshot.input_key, generateHslColorFromString(snapshot.input_key));
      }
      if (snapshot.output_key && !map.has(snapshot.output_key)) {
        map.set(snapshot.output_key, generateHslColorFromString(snapshot.output_key));
      }
    });

    return map;
  }, [contextSnapshots, subjectSnapshots]);

  const value = { keyColorMap, hoveredKey, setHoveredKey };

  return (
    <LogKeyHighlightContext.Provider value={value}>
      {children}
    </LogKeyHighlightContext.Provider>
  );
}

export function useLogKeyHighlight() {
  const context = useContext(LogKeyHighlightContext);
  if (context === undefined) {
    throw new Error('useLogKeyHighlight must be used within a LogKeyHighlightProvider');
  }
  return context;
}
