'use client';

import * as React from 'react';
import ReactFlow, {
  Background, Controls, MiniMap,
  addEdge, useEdgesState, useNodesState, Connection, Edge, Node, NodeMouseHandler, useReactFlow,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import styles from './Canvas.module.css';

import { usePipelines } from '@/store/usePipelines';
import { useUniversity } from '@/store/useUniversity';
import { useBlockData } from '@/lib/hooks/useBlockData';
import type { Pipeline, FlowBlock } from '@/types/domain';
import type { AnyBlock } from '@/types/blocks';
import ComponentNode from '../block_builder/ComponentNode';
import BlockPalette from './BlockPalette';
import BlockInspector from './BlockInspector';
import { BlockCombineProvider } from '@/hooks/blocks/useBlockCombineContext';
import { BlockGridSyncProvider } from '@/hooks/blocks/useBlockGridSync';
import { createFlowBlockFromKind, getBlockTypeNameById, getBlockTypeId } from '@/lib/blockManager';
import { useResultsHighlight } from '@/components/results/ResultsHighlightContext';

const nodeTypes = { 
  flowComponent: ComponentNode as any,
};

// FlowBlock 생성 헬퍼 (BLOCK_TYPES 직접 사용)
function createFlowBlockFromDetail(detail: any, blockDataList: any[], tokenMenus: any[]): FlowBlock | null {
  const kind: string = detail?.kind;
  if (!kind) {
    console.error('❌ Block detail missing kind:', detail);
    return null;
  }

  try {
    // BLOCK_TYPES에서 직접 블록 생성 (block_data 사용 안 함)
    const capitalizedKind = kind.charAt(0).toUpperCase() + kind.slice(1).toLowerCase();
    return createFlowBlockFromKind(capitalizedKind, tokenMenus);
  } catch (error) {
    console.error('❌ Error creating FlowBlock from detail:', error);
    return null;
  }
}


function usePipelineGraph(
  p: Pipeline, 
  onSelectBlock: (payload: { compId: number; block: FlowBlock }) => void, 
  onBlockConnection: (fromBlock: FlowBlock, toBlock: FlowBlock, side?: 'left' | 'right') => void,
  blockData: any[] = [],
  tokenMenus: any[] = []
) {
  const nodes: Node[] = [];
  
  // 컴포넌트 노드 추가
  p.components.forEach(c => {
    nodes.push({
      id: `comp-${c.id}`,
      type: 'flowComponent',
      data: { 
        pipelineId: p.id, 
        componentId: c.id, 
        blocks: c.blocks
      },
      position: c.ui ?? { x: 0, y: 0 },
      dragHandle: '[data-drag-handle]',
    });
    
    // 리팩토링된 구조에선 블록을 독립 노드로 추가하지 않음
  });

  const edges: Edge[] = [];
  
  // 컴포넌트 간 연결은 Canvas.tsx의 useEffect에서 처리
  // (predecessorId 기반 연결선 생성 로직 제거)
  
  // 블록 간 연결은 FlowComponent 내부에서 표현(여기선 생략)

  return { nodes, edges };
}

// 테스트 전용 내보내기 (프로덕션 코드 경량화에 영향 없음)
export { usePipelineGraph as __test_only_usePipelineGraph };

export default function Canvas({ pipelineId, dbPipelineId, readOnly = false }: { pipelineId: string; dbPipelineId?: number | null; readOnly?: boolean }) {
  return (
    <ReactFlowProvider>
      <BlockCombineProvider>
        <BlockGridSyncProvider>
          <CanvasContent pipelineId={pipelineId} dbPipelineId={dbPipelineId} readOnly={readOnly} />
        </BlockGridSyncProvider>
      </BlockCombineProvider>
    </ReactFlowProvider>
  );
}

function CanvasContent({ pipelineId, dbPipelineId, readOnly = false }: { pipelineId: string; dbPipelineId?: number | null; readOnly?: boolean }) {
  // 파이프라인 상태를 구독하여 변경 시 리렌더
  const pipeline = usePipelines(s => s.pipelines.find(p => p.id === pipelineId))!;
  const { getById, createComponentWithFlowBlock, addFlowBlockToComponent, setComponentXY, connectComponents, toggleEdgeDirection, connectBlocks } = usePipelines();
  const { selectedUnivId } = useUniversity();
  const { blockData, tokenMenus, loading: blockDataLoading } = useBlockData(selectedUnivId || '');
  
  // Canvas 컴포넌트에서 파이프라인 상태를 실시간으로 모니터링

  const [selected, setSelected] = React.useState<{ compId: number; block: FlowBlock } | null>(null);
  


  const onSelectBlock = React.useCallback((payload: { compId: number; block: FlowBlock }) => {
    setSelected(payload);
  }, []);

  const onBlockConnection = React.useCallback((fromBlock: FlowBlock, toBlock: FlowBlock, side?: 'left' | 'right') => {
    
    // 블록 결합 실행
    const result = connectBlocks(pipelineId, fromBlock.block_id, toBlock.block_id, side);
    
  }, [connectBlocks, pipelineId]);

  const { nodes, edges } = usePipelineGraph(pipeline, onSelectBlock, onBlockConnection, blockData, tokenMenus);
  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState(nodes);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState(edges);
  const flowWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const rf = useReactFlow();
  const { focusedBlockId, focusBlockById } = useResultsHighlight();
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  React.useEffect(() => {
    try {
      console.log('[Canvas] nodes ready', { count: reactFlowNodes.length, ids: reactFlowNodes.map(n => n.id) });
    } catch {}
  }, [reactFlowNodes]);

  // Pipeline의 components를 사용하여 연결선 자동 생성
  React.useEffect(() => {
    if (!pipeline || pipeline.components.length === 0) {
      // console.log('컴포넌트가 없어서 연결선 제거');
      setReactFlowEdges([]);
      return;
    }

    // Pipeline의 components를 position 순서대로 정렬
    const sortedComponents = [...pipeline.components].sort((a, b) => a.position - b.position);
    // console.log('sortedComponents:', sortedComponents);
    
    // 연결선 생성 (position 순서대로)
    const newEdges: Edge[] = [];
    for (let i = 0; i < sortedComponents.length - 1; i++) {
      const currentComponent = sortedComponents[i];
      const nextComponent = sortedComponents[i + 1];
      
      newEdges.push({
        id: `edge-${i}`,
        source: `comp-${currentComponent.id}`,
        target: `comp-${nextComponent.id}`,
        sourceHandle: 'output',
        targetHandle: 'input',
        animated: false,
      });
    }
    
    setReactFlowEdges(newEdges);
  }, [pipeline]);

  
  // 파이프라인 변경 시에만 ReactFlow 상태를 동기화 (무한 루프 방지)
  React.useEffect(() => {
    const stateNodeIds = reactFlowNodes.map(n => n.id).sort().join(',');
    const nextNodeIds = nodes.map(n => n.id).sort().join(',');
    if (stateNodeIds !== nextNodeIds) {
      setReactFlowNodes(nodes);
    }

    // edges는 우리가 직접 관리하므로 동기화하지 않음
    // (usePipelineGraph의 edges는 항상 빈 배열)
  }, [pipeline, nodes]);

  // ReactFlow Node 드래그 이벤트 처리
  const onNodeDragStart = React.useCallback((event: any, node: Node) => {
    // 드래그 시작 지점이 data-drag-handle 요소인지 확인
    const target = event.target as HTMLElement;
    const isDragHandle = target.closest('[data-drag-handle]');
    
    if (!isDragHandle) {
      // 드래그 핸들이 아닌 곳에서 드래그 시작 시 이벤트 취소
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    
    return true;
  }, []);

  const onNodeDrag = React.useCallback((event: any, node: Node) => {
    // 드래그 중에도 핸들 클릭 여부를 계속 확인
    const target = event.target as HTMLElement;
    const isDragHandle = target.closest('[data-drag-handle]');
    
    if (!isDragHandle) {
      // 드래그 핸들이 아닌 곳에서 드래그 중이면 중단
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    
    return true;
  }, []);

  const onDragOver: React.DragEventHandler = (e) => {
    if (
      e.dataTransfer.types.includes('application/x-block-type') ||
      e.dataTransfer.types.includes('application/x-block-kind') ||
      e.dataTransfer.types.includes('application/x-block-detail') ||
      e.dataTransfer.types.includes('application/x-block-move')
    ) {
      e.preventDefault();
      e.dataTransfer.dropEffect = e.dataTransfer.types.includes('application/x-block-move') ? 'move' : 'copy';
    }
  };

  const onNodeDragStop = React.useCallback((event: any, node: Node) => {
    
    // 컴포넌트 노드인 경우 위치 업데이트
    if (node.id.startsWith('comp-')) {
      const compId = Number(node.id.replace('comp-', ''));
      setComponentXY(pipelineId, compId, node.position as any);
    }
    
    // 블록 위치는 FlowComponent 내부에서 관리
  }, [pipelineId, setComponentXY]);

  // 외부 포커스 신호를 받아 해당 블록이 속한 컴포넌트 노드로 뷰 이동
  React.useEffect(() => {
    if (!focusedBlockId || !pipeline) return;
    try { console.log('[Canvas] focusing blockId', focusedBlockId); } catch {}
    const comp = pipeline.components.find(c => (c.blocks || []).some(b => b.block_id === focusedBlockId));
    if (!comp) { try { console.warn('[Canvas] block not found in components', { focusedBlockId }); } catch {}; return; }
    const nodeId = `comp-${comp.id}`;
    const node = rf.getNode(nodeId as any);
    if (!node) { try { console.warn('[Canvas] node not found', { nodeId }); } catch {}; return; }
    // 노드가 준비된 뒤에만 포커스 적용하고, 성공 시에만 초기화
    requestAnimationFrame(() => {
      try { console.log('[Canvas] fitView to', nodeId); } catch {}
      rf.fitView({ nodes: [node], padding: 0.25, duration: 600, maxZoom: 1.2 });
      focusBlockById(null);
    });
  }, [focusedBlockId, pipeline, rf, focusBlockById]);

  const onDrop: React.DragEventHandler = async (e) => {
    // 블록 이동 처리
    const blockMoveData = e.dataTransfer.getData('application/x-block-move');
    if (blockMoveData) {
      try {
        const moveInfo = JSON.parse(blockMoveData);
        // 블록 이동은 포트 오버레이에서 처리되므로 여기서는 무시
        return;
      } catch (err) {
        console.error('Failed to parse block move data:', err);
      }
    }

    // 새로운 blockType 형식 처리 (우선순위 1)
    const blockTypeData = e.dataTransfer.getData('application/x-block-type');
    
    if (blockTypeData) {
      try {
        const { blockType } = JSON.parse(blockTypeData);
        if (!blockType) return;

        // ReactFlow 좌표계로 변환하여 드롭 지점에 정확히 생성
        const wrapperBounds = flowWrapperRef.current?.getBoundingClientRect?.();
        const point = rf.project({ x: e.clientX - (wrapperBounds?.left ?? 0), y: e.clientY - (wrapperBounds?.top ?? 0) });
        const x = point.x;
        const y = point.y;

  

        // BLOCK_TYPES에서 직접 FlowBlock 생성 (block_data 사용 안 함)
        const flowBlock = createFlowBlockFromKind(
          getBlockTypeNameById(blockType), 
          tokenMenus
        );
        if (flowBlock) {
          createComponentWithFlowBlock(pipelineId, flowBlock, { x, y });
          return;
        }
        return;
      } catch (err) {
        console.error('Failed to parse application/x-block-type:', err);
      }
    }

    // 기존 상세 블록 정보 시도 (호환성)
    let detailRaw = e.dataTransfer.getData('application/x-block-detail');
    let kindData = e.dataTransfer.getData('application/x-block-kind');

    // ReactFlow 좌표계로 변환하여 드롭 지점에 정확히 생성
    const wrapperBounds = flowWrapperRef.current?.getBoundingClientRect?.();
    const point = rf.project({ x: e.clientX - (wrapperBounds?.left ?? 0), y: e.clientY - (wrapperBounds?.top ?? 0) });
    const x = point.x;
    const y = point.y;

    if (detailRaw) {
      try {
        const detail = JSON.parse(detailRaw);
        const kind: string = detail.kind;
        if (!kind) return;

        const base = createFlowBlockFromDetail(detail, blockData, tokenMenus);
        if (!base) return;

        const comp = createComponentWithFlowBlock(pipelineId, base, { x, y });
        // detail 정보를 사용해 생성이 완료되면 fallback 로직을 실행하지 않도록 종료
        return;
      } catch (err) {
        console.error('Failed to parse application/x-block-detail:', err);
        // detail 파싱 실패 시 kind fallback 진행
      }
    }

    if (kindData) {
      // JSON 파싱 시도, 실패하면 문자열로 처리
      let kind: string;
      try {
        const parsed = JSON.parse(kindData);
        kind = parsed.kind;
      } catch {
        kind = kindData;
      }
      if (!kind) return;

      const blockTypeId = (() => {
        const map: Record<string, number> = {
          division: 1, apply_subject: 2, grade_ratio: 3, function: 4, condition: 5, aggregation: 6, variable: 7,
          apply_term: 8, top_subject: 9, subject_group_ratio: 10, separation_ratio: 11, score_map: 12, formula: 13
        };
        return map[kind] ?? 2;
      })();
      const base: FlowBlock = { block_id: 0, block_type: blockTypeId, header_cells: [], body_cells: [] };
      const comp = createComponentWithFlowBlock(pipelineId, base, { x, y });
      // 파이프라인 상태 확인
      const updatedPipeline = getById(pipelineId);
      // usePipelineGraph에서 계산된 노드 확인
      const { nodes: calculatedNodes } = usePipelineGraph(updatedPipeline!, onSelectBlock, onBlockConnection);
    }
  };

  const onConnect = (params: Connection) => {
    if (!params.source || !params.target) return;
    
    // 컴포넌트 간 연결인 경우
    if (params.source.startsWith('comp-') && params.target.startsWith('comp-')) {
      const sourceId = Number(params.source.replace('comp-', ''));
      const targetId = Number(params.target.replace('comp-', ''));
      
      // Pipeline 상태 업데이트 (position 재정렬)
      connectComponents(pipelineId, sourceId, targetId);
      
      // 연결선은 useEffect에서 자동으로 재생성되므로 수동으로 추가하지 않음
    } else {
      // 다른 연결 (블록 간 연결 등)은 기존 방식 유지
      setReactFlowEdges(eds => addEdge({ ...params }, eds));
    }
  };

  

  const onEdgeDoubleClick = (_: any, edge: Edge) => {
    // 컴포넌트 간 연결인 경우에만 방향 토글
    if (edge.source.startsWith('comp-') && edge.target.startsWith('comp-')) {
      const sourceId = Number(edge.source.replace('comp-', ''));
      const targetId = Number(edge.target.replace('comp-', ''));
      toggleEdgeDirection(pipelineId, sourceId, targetId);
    }
  };

  // 선택된 블록 찾기 → 인스펙터에 전달
  const target = React.useMemo(() => {
    if (!selected) return null;
    const comp = getById(pipelineId)?.components.find(c => c.id === selected.compId);
    const block = comp?.blocks.find(b => b.block_id === selected.block.block_id);
    if (!comp || !block) return null;
    
    return {
      pipelineId,
      componentId: comp.id,
      blockId: block.block_id,
      block: block as any,
    };
  }, [selected, pipelineId, getById, pipeline]);

  // 드래그 오버레이/인디케이터 제거됨

  return (
    <div className={styles.canvas}>
        <div className={styles.flowContainer} ref={flowWrapperRef}>
          {!readOnly && (
            <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, display: 'flex', gap: 8 }}>
              <button className="btn" onClick={() => setSettingsOpen(true)} disabled={!dbPipelineId}>계산 설정</button>
            </div>
          )}
          <ReactFlow
          nodeTypes={nodeTypes}
          nodes={reactFlowNodes}
          edges={reactFlowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
            onDrop={readOnly ? undefined : onDrop}
            onDragOver={readOnly ? undefined : onDragOver}
            onNodeDragStop={readOnly ? undefined : onNodeDragStop}
            onConnect={readOnly ? undefined : onConnect}
            onEdgeDoubleClick={readOnly ? undefined : onEdgeDoubleClick}
            onNodeDragStart={readOnly ? undefined : onNodeDragStart}
            onNodeDrag={readOnly ? undefined : onNodeDrag}
            nodesDraggable={!readOnly}
            nodesConnectable={!readOnly}
            elementsSelectable={!readOnly}
          fitView
          minZoom={0.5}
          maxZoom={2}
          panOnDrag
        >
          <Background />
          <MiniMap pannable zoomable />
          <Controls />
        </ReactFlow>
          {!readOnly && <BlockPalette />}
        </div>


      {/* 스냅/오버레이 UI 제거됨 */}
      </div>
  );
}
