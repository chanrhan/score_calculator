// components/results/PipelineSnapshotViewer.tsx
// 파이프라인 스냅샷을 읽기 전용으로 표시하는 최상위 컴포넌트
// ReactFlow를 사용하여 캔버스 형태로 표시

'use client';

import * as React from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { SnapshotComponent } from './snapshot/SnapshotComponent';
import styles from './snapshot.module.css';

interface PipelineSnapshotComponent {
  component_id: number;
  order: number;
  name?: string | null;
  x: number;
  y: number;
  division_head_header?: any;
  division_head_body?: any;
  division_head_active: boolean;
  blocks: any[];
}

interface PipelineSnapshotViewerProps {
  components: PipelineSnapshotComponent[];
}

// 커스텀 노드 타입 정의
const nodeTypes = {
  snapshotComponent: ({ data }: { data: any }) => (
    <div className={styles.flowNodeWrapper}>
      <SnapshotComponent
        componentId={data.componentId}
        name={data.name}
        divisionHeadHeader={data.divisionHeadHeader}
        divisionHeadBody={data.divisionHeadBody}
        divisionHeadActive={data.divisionHeadActive}
        blocks={data.blocks || []}
      />
    </div>
  ),
};

function PipelineSnapshotViewerContent({ components }: PipelineSnapshotViewerProps) {
  // 컴포넌트를 order 순서대로 정렬
  const sortedComponents = React.useMemo(() => {
    return [...components].sort((a, b) => a.order - b.order);
  }, [components]);

  // ReactFlow 노드 생성
  const initialNodes: Node[] = React.useMemo(() => {
    if (!sortedComponents || sortedComponents.length === 0) {
      return [];
    }
    return sortedComponents.map((component, index) => ({
      id: `comp-${component.component_id}`,
      type: 'snapshotComponent',
      position: { 
        x: component.x || index * 500, 
        y: component.y || 0 
      },
      data: {
        componentId: component.component_id,
        name: component.name,
        divisionHeadHeader: component.division_head_header,
        divisionHeadBody: component.division_head_body,
        divisionHeadActive: component.division_head_active,
        blocks: component.blocks || [],
      },
      draggable: false,
      selectable: false,
    }));
  }, [sortedComponents]);

  // ReactFlow 엣지 생성 (컴포넌트 간 연결)
  const initialEdges: Edge[] = React.useMemo(() => {
    if (!sortedComponents || sortedComponents.length < 2) {
      return [];
    }
    const edges: Edge[] = [];
    for (let i = 0; i < sortedComponents.length - 1; i++) {
      edges.push({
        id: `edge-${i}`,
        source: `comp-${sortedComponents[i].component_id}`,
        target: `comp-${sortedComponents[i + 1].component_id}`,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#94a3b8', strokeWidth: 2 },
      });
    }
    return edges;
  }, [sortedComponents]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // 노드와 엣지가 변경되면 업데이트
  React.useEffect(() => {
    if (initialNodes.length > 0) {
      setNodes(initialNodes);
    }
  }, [initialNodes, setNodes]);

  React.useEffect(() => {
    if (initialEdges.length > 0) {
      setEdges(initialEdges);
    }
  }, [initialEdges, setEdges]);

  if (!components || components.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>스냅샷 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
      minZoom={0.2}
      maxZoom={2}
      panOnDrag={[1, 2]} // 좌클릭, 휠버튼으로 패닝
      zoomOnScroll={true}
      zoomOnPinch={true}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      className={styles.reactFlowWrapper}
    >
      <Background />
      <Controls />
      <MiniMap pannable zoomable />
    </ReactFlow>
  );
}

export const PipelineSnapshotViewer: React.FC<PipelineSnapshotViewerProps> = (props) => {
  return (
    <ReactFlowProvider>
      <PipelineSnapshotViewerContent {...props} />
    </ReactFlowProvider>
  );
};

