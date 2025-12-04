'use client';

import * as React from 'react';
import type { Component, FlowBlock } from '@/types/domain';
import { Handle, Position } from 'reactflow';
import clsx from 'clsx';
import { usePipelines } from '@/store/usePipelines';
import { useBlockDataStore } from '@/store/useBlockDataStore';
import { createFlowBlockFromKind, getBlockTypeNameById, getBlockTypeId } from '@/lib/blockManager';
import { ComponentGrid } from '../Primitives/ComponentGrid';
import { BlockInstanceFactory } from '@/lib/blocks/modules/registry';
import styles from './ComponentNode.module.css';
import { useResultsHighlight } from '@/components/results/ResultsHighlightContext';

type Props = {
  pipelineId?: string;
  data: { 
    pipelineId?: string;
    componentId?: number;
    component?: Component;
    blocks?: FlowBlock[];
    onSelectBlock?: (payload: { compId: number; block: FlowBlock }) => void;
    onBlockConnection?: (fromBlock: FlowBlock, toBlock: FlowBlock, side?: 'left' | 'right') => void;
  };
  selected?: boolean;
};

export default function ComponentNode({ pipelineId, data, selected }: Props) {
  const { highlightedBlockIds, blockIdToSubjectNames } = useResultsHighlight();
  // FlowComponentNode 호환성을 위한 props 처리
  const actualPipelineId = pipelineId || data.pipelineId || '';
  const componentId = data.componentId || data.component?.id || 0;
  
  const { addFlowBlockToComponent, deleteBlock, addColumnToBlock, connectBlocks, combineState, startCombine, cancelCombine, getById, updateBlock, updateAllBlocks } = usePipelines();
  
  // 실시간으로 최신 컴포넌트 데이터 가져오기
  const pipeline = getById(actualPipelineId);
  const comp = pipeline?.components.find(c => c.id === componentId);
  const flowBlocks = comp?.blocks || [];
  
  // FlowBlock[]을 BlockInstance[]로 변환
  const blocks = React.useMemo(() => {
    return flowBlocks.map(block => {
      return BlockInstanceFactory.create(
        block.block_type,
        block.block_id,
        {
          header_cells: block.header_cells,
          body_cells: block.body_cells
        }
      );
    });
  }, [flowBlocks]);
  
  // 전역 스토어에서 block_data와 token_menus 가져오기
  const { blockData, tokenMenus } = useBlockDataStore();
  
  // 결합 상태 변경 감지를 위한 강제 리렌더링
  React.useEffect(() => {
    // 결합 상태가 변경될 때마다 컴포넌트 리렌더링 강제
  }, [combineState]);

  // FlowBlock 기반 블록 생성
  const onDropFlowBlock = (e: React.DragEvent, atIndex?: number) => {
    e.preventDefault();
    const kind = e.dataTransfer.getData('application/x-block-kind') as any;
    if (!kind) return;

    try {
      // BLOCK_TYPES에서 직접 블록 생성 (block_data 사용 안 함)
      const capitalizedKind = kind.charAt(0).toUpperCase() + kind.slice(1).toLowerCase();
      const block = createFlowBlockFromKind(capitalizedKind, tokenMenus);

      addFlowBlockToComponent(actualPipelineId, componentId, block, atIndex);
    } catch (error) {
      console.error('❌ Error creating FlowBlock:', error);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      className={clsx(
        styles.node,
        selected ? styles.nodeSelected : styles.nodeUnselected
      )}
      onDrop={onDropFlowBlock}
      onDragOver={onDragOver}
    >
      {/* 드래그 핸들 */}
      <div 
        data-drag-handle
        className={styles.dragHandle}
        title="드래그하여 이동"
      >
        <span className={styles.dragHandleIcon}>⋮⋮</span>
      </div>
      {/* 입력 핸들 */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="w-3 h-3 bg-blue-500"
      />

      {/* 컴포넌트 헤더 */}
      {/* <div className="p-3 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{comp?.name || 'Component'}</h3>
          <div className="flex gap-1">
            <button
              onClick={() => deleteBlock(actualPipelineId, componentId, blocks[0]?.id || 0)}
              className="p-1 text-red-500 hover:bg-red-100 rounded"
              title="블록 삭제"
            >
              🗑️
            </button>
          </div>
        </div>
      </div> */}

      {/* 블록 그리드 */}
      <div className={styles.content}>
        <ComponentGrid
          blocks={blocks}
          // 각 블록 셀 컨테이너에 하이라이트/툴팁을 적용하기 위해 ComponentGrid 내부의 셀 구조를 그대로 사용하고,
          // 블록명 행에서 강조 스타일을 적용
          onBlockChange={(blockId: number, updatedBlockInstance) => {
            // BlockInstance를 FlowBlock으로 변환하여 저장
            const updatedBlock = updatedBlockInstance.toFlowBlock();
            const result = updateBlock(actualPipelineId, componentId, blockId, updatedBlock);
            if (result.success) {
              // console.log('블록 업데이트 성공:', { blockId, updatedBlock });
            } else {
              console.error('블록 업데이트 실패:', result.error);
            }
          }}
          onBlockCombine={(blockId: number, side?: 'left' | 'right') => {
            // 블록 결합 로직 구현
            if (!combineState.isCombineMode) {
              // 결합 모드 시작
              startCombine(actualPipelineId, blockId);
            } else if (combineState.sourceBlockId === blockId && combineState.sourcePipelineId === actualPipelineId) {
              // 같은 블록을 다시 클릭하면 결합 모드 취소
              cancelCombine();
            } else if (combineState.sourceBlockId && combineState.sourceBlockId !== blockId && side) {
              // 방향 버튼 클릭 시 결합 실행
              const result = connectBlocks(actualPipelineId, combineState.sourceBlockId, blockId, side);
              if (result.success) {
                // console.log('블록 결합 성공');
              } else {
                console.error('블록 결합 실패:', result.error);
              }
            }
          }}
          onInsertRow={(blockInstances) => {
            // BlockInstance[]를 FlowBlock[]로 변환하여 저장
            const flowBlocks = blockInstances.map(instance => instance.toFlowBlock());
            const result = updateAllBlocks(actualPipelineId, componentId, flowBlocks);
            if (result.success) {
              // console.log('블록 업데이트 성공:', { blockId, updatedBlock });
            } else {
              console.error('블록 업데이트 실패:', result.error);
            }
          }}
          onBlockDelete={(blockId: number) => {
            // 블록 삭제 로직
            deleteBlock(actualPipelineId, componentId, blockId);
          }}
          combineState={combineState}
        />
      </div>

      {/* 출력 핸들 */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="w-3 h-3 bg-green-500"
      />
    </div>
  );
}