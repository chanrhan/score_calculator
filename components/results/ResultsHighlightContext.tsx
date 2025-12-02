'use client';

import * as React from 'react';
import { Snapshot, Subject } from '@/types/domain';
export type ResultsHighlightState = {
	highlightedBlockIds: Set<number>;
	blockIdToSubjectNames: Record<number, string[]>;
	highlightedRowsByBlockId: Record<number, Set<number>>;
	setHighlights: (payload: { snapshots: Snapshot[]; highlighted?: Set<number>; map?: Record<number, string[]>; highlightedRowsByBlockId?: Record<number, Set<number>> }) => void;
	readOnly: boolean;
	snapshots: Snapshot[];
	selectedSubject: Subject | null;
	setSelectedSubject: (subject: Subject | null) => void;
	focusedBlockId: number | null;
	focusBlockById: (blockId: number | null) => void;
};

const ResultsHighlightContext = React.createContext<ResultsHighlightState | null>(null);

export function ResultsHighlightProvider({ children, readOnly = false }: { children: React.ReactNode; readOnly?: boolean }) {
	const [highlightedBlockIds, setHighlightedBlockIds] = React.useState<Set<number>>(new Set());
	const [blockIdToSubjectNames, setBlockIdToSubjectNames] = React.useState<Record<number, string[]>>({});
  const [highlightedRowsByBlockId, setHighlightedRowsByBlockId] = React.useState<Record<number, Set<number>>>({});
	const [snapshots, setSnapshots] = React.useState<Snapshot[]>([]);
	const [selectedSubject, setSelectedSubject] = React.useState<Subject | null>(null);
	const [focusedBlockId, setFocusedBlockId] = React.useState<number | null>(null);
	

	const setHighlights = React.useCallback((payload: { snapshots?: Snapshot[]; highlighted?: Set<number>; map?: Record<number, string[]>; highlightedRowsByBlockId?: Record<number, Set<number>> }) => {
		if (payload.highlighted) setHighlightedBlockIds(new Set(payload.highlighted));
		if (payload.map) setBlockIdToSubjectNames(payload.map);
		if (payload.highlightedRowsByBlockId) setHighlightedRowsByBlockId(payload.highlightedRowsByBlockId);
		if (payload.snapshots) {
			setSnapshots(payload.snapshots);
		}
	}, []);

	const value = React.useMemo<ResultsHighlightState>(() => ({
		highlightedBlockIds,
		blockIdToSubjectNames,
		highlightedRowsByBlockId,
		setHighlights,
		readOnly,
		snapshots,
		selectedSubject,
		setSelectedSubject,
		focusedBlockId,
		focusBlockById: setFocusedBlockId,
	}), [highlightedBlockIds, blockIdToSubjectNames, highlightedRowsByBlockId, setHighlights, readOnly, snapshots, selectedSubject, focusedBlockId]);

	return (
		<ResultsHighlightContext.Provider value={value}>
			{children}
		</ResultsHighlightContext.Provider>
	);
}

export function useResultsHighlight(): ResultsHighlightState {
	const ctx = React.useContext(ResultsHighlightContext);
	if (!ctx) {
		return {
			highlightedBlockIds: new Set<number>(),
			blockIdToSubjectNames: {},
			highlightedRowsByBlockId: {},
			setHighlights: () => {},
			readOnly: false,
			snapshots: [],
			selectedSubject: null,
			setSelectedSubject: () => {},
			focusedBlockId: null,
			focusBlockById: () => {},
		};
	}
	return ctx;
}


