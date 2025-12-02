'use client';

import * as React from 'react';
import type { VariableBlock, AggregationBlock, ConditionBlock, FunctionBlock, DivisionBlock, FinalizeBlock } from '@/types/blocks';
import type { FlowBlock } from '@/types/domain';
import { usePipelines } from '@/store/usePipelines';
import { SelectToken, TextToken } from '@/components/builder/Common/Token';
import styles from './BlockInspector.module.css';

type BlockInspectorProps = {
  target: {
    pipelineId: string;
    componentId: number;
    blockId: number;
    block: VariableBlock | AggregationBlock | ConditionBlock | FunctionBlock | DivisionBlock | FinalizeBlock | FlowBlock;
  } | null;
  onClose: () => void;
};

export default function BlockInspector({ target, onClose }: BlockInspectorProps) {
  if (!target) return null;
  if (!target.block) {
    console.error('Block is undefined in target:', target);
    return null;
  }

  const { pipelineId, componentId, block } = target;

  const mutate = (patch: any) => {
    usePipelines.setState((state) => {
      const p = state.pipelines.find(p => p.id === pipelineId);
      if (!p) return state;
      const comps = p.components.map(c => {
        if (c.id !== componentId) return c;
        return {
          ...c,
          blocks: c.blocks.map(b => (b.id === block.id ? { ...b, ...patch } : b)),
        };
      });
      return { pipelines: state.pipelines.map(pp => (pp.id === pipelineId ? { ...p, components: comps } : pp)) };
    });
  };

  const renderEditor = () => {
    switch (block.kind) {
      case 'variable':
        return (
          <div className={styles.blockEditor}>
            <div className={`${styles.blockHeader} ${styles.blockHeaderVariable}`}>
              변수 블록 — 집계 블록 다음에만 결합 가능
            </div>
            <div className={styles.blockContent}>
              <TextToken label="name" value={block.name || ''} onChange={v => mutate({ name: v })} placeholder="변수 이름" />
              <SelectToken label="scope" value={block.scope} options={['component','pipeline']} onChange={v => mutate({ scope: v as any })} />
              <SelectToken label="overwrite" value={block.overwrite} options={['allow','deny']} onChange={v => mutate({ overwrite: v as any })} />
            </div>
          </div>
        );
      case 'aggregation':
        return (
          <div className={styles.blockEditor}>
            <div className={`${styles.blockHeader} ${styles.blockHeaderAggregation}`}>
              집계 블록
            </div>
            <div className={styles.blockContent}>
              <SelectToken label="agg" value={block.agg} options={['AVG', 'SUM', 'COUNT', 'MIN', 'MAX']} onChange={v => mutate({ agg: v as any })} />
              <TextToken label="target" value={block.target || ''} onChange={v => mutate({ target: v })} placeholder="집계 대상" />
            </div>
          </div>
        );
      case 'condition':
        return (
          <div className={styles.blockEditor}>
            <div className={`${styles.blockHeader} ${styles.blockHeaderCondition}`}>
              조건 블록
            </div>
            <div className={styles.blockContent}>
              <TextToken label="expr" value={block.expr || ''} onChange={v => mutate({ expr: v })} placeholder="조건식" />
            </div>
          </div>
        );
      case 'function':
        return (
          <div className={styles.blockEditor}>
            <div className={`${styles.blockHeader} ${styles.blockHeaderFunction}`}>
              함수 블록
            </div>
            <div className={styles.blockContent}>
              <SelectToken label="funcType" value={block.funcType} options={['apply_subject', 'apply_score']} onChange={v => mutate({ funcType: v as any })} />
            </div>
          </div>
        );
      case 'division':
        return (
          <div className={styles.blockEditor}>
            <div className={`${styles.blockHeader} ${styles.blockHeaderDivision}`}>
              분할 블록
            </div>
            <div className={styles.blockContent}>
              <SelectToken label="skipPolicy" value={block.skipPolicy} options={['skip_empty_case', 'include_empty_case']} onChange={v => mutate({ skipPolicy: v as any })} />
            </div>
          </div>
        );
      case 'finalize':
        return (
          <div className={styles.blockEditor}>
            <div className={`${styles.blockHeader} ${styles.blockHeaderFinalize}`}>
              완료 블록
            </div>
            <div className={styles.blockContent}>
              <SelectToken label="mode" value={block.mode} options={['snapshot', 'incremental']} onChange={v => mutate({ mode: v as any })} />
            </div>
          </div>
        );
      default:
        return (
          <div className={styles.blockEditor}>
            <div className={`${styles.blockHeader} ${styles.blockHeaderUnknown}`}>
              알 수 없는 블록 타입
            </div>
          </div>
        );
    }
  };

  return (
    <div className={styles.inspector}>
      <div className={styles.header}>
        <h3 className={styles.title}>블록 속성</h3>
        <button onClick={onClose} className={styles.closeButton}>
          ✕
        </button>
      </div>
      <div className={styles.content}>
        {renderEditor()}
      </div>
    </div>
  );
}
