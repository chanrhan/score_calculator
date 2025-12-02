// /store/usePipelines.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Pipeline, Component, AnyBlock, FlowBlock } from '@/types/domain';
import { nanoid } from '@/lib/utils/id';
import { validateBlockConnection } from '@/types/blocks';
import { BlockGridCalculator } from '@/lib/blockManager';
import { loadAllComponentGridsFromDb, generateConnectionsFromOrder, recalculateRowspan } from '@/lib/adapters/componentGridDb';
import { BLOCK_TYPE } from '@/types/block-types';

// ComponentGrid 순서 조정 API 호출 함수
async function adjustComponentOrderApi(
  pipelineId: string,
  sourceComponentId: number,
  targetComponentId: number,
  direction: 'before' | 'after'
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/component-grid/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pipelineId,
        sourceComponentId,
        targetComponentId,
        direction,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('ComponentGrid 순서 조정 API 호출 실패:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'API 호출 중 오류가 발생했습니다.' 
    };
  }
}

type PipelinesState = {
  pipelines: Pipeline[];
  selectedId?: string;
  // 결합 상태 관리
  combineState: {
    isCombineMode: boolean;
    sourceBlockId: number | null;
    sourcePipelineId: string | null;
  };
  // ComponentGrid 순서 조정
  adjustComponentOrder: (pipelineId: string, sourceComponentId: number, targetComponentId: number, direction: 'before' | 'after') => Promise<{ success: boolean; error?: string }>;
  // ComponentGrid 로드 시 연결선 자동 생성 (주석처리 - Canvas.tsx에서 직접 처리)
  // loadComponentGridsWithConnections: (pipelineId: string) => Promise<{ success: boolean; error?: string }>;
  // getters
  getById: (id: string) => Pipeline | undefined;
  // base mutations
  select: (id?: string) => void;
  setAll: (list: Pipeline[]) => void;
  add: (p?: Partial<Pipeline>) => Pipeline;
  update: (id: string, patch: Partial<Pipeline>) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => Pipeline | undefined;

  // canvas helpers
  createComponentWithBlock: (pipelineId: string, block: AnyBlock, ui: {x:number;y:number}) => Component;
  createComponentWithFlowBlock: (pipelineId: string, block: FlowBlock, ui: {x:number;y:number}) => Component;
  addBlockToComponent: (pipelineId: string, compId: number, block: AnyBlock, atIndex?: number) => void;
  addFlowBlockToComponent: (pipelineId: string, compId: number, block: FlowBlock, atIndex?: number) => void;
  moveBlock: (pipelineId: string, fromCompId: number, fromIndex: number, toCompId: number, toIndex?: number) => void;
  deleteBlock: (pipelineId: string, compId: number, blockId: number) => void;
  // block updates
  updateDivisionCell: (pipelineId: string, compId: number, blockId: number, rowIndex: number, colIndex: number, value: string | number) => { success: boolean; error?: string };
  updateBlock: (pipelineId: string, compId: number, blockId: number, updatedBlock: FlowBlock) => { success: boolean; error?: string };
  updateAllBlocks: (pipelineId: string, compId: number, updatedBlocks: FlowBlock[]) => { success: boolean; error?: string };
  addColumnToBlock: (pipelineId: string, compId: number, blockId: number, blockData?: any[]) => { success: boolean; error?: string };

  // 블록 결합 기능
  connectBlocks: (pipelineId: string, fromBlockId: number, toBlockId: number, side?: 'left' | 'right') => { success: boolean; error?: string };
  mergeBlocks: (pipelineId: string, fromBlockId: number, toBlockId: number) => { success: boolean; error?: string };
  validateBlockConnection: (pipelineId: string, fromBlockId: number, toBlockId: number) => { valid: boolean; error?: string };
  syncBlockRows: (pipelineId: string, componentId: number) => void;
  // 결합 상태 관리
  startCombine: (pipelineId: string, blockId: number) => void;
  cancelCombine: () => void;

  setComponentXY: (pipelineId: string, compId: number, ui: {x:number;y:number}) => void;
  connectComponents: (pipelineId: string, sourceId: number, targetId: number) => void;
  toggleEdgeDirection: (pipelineId: string, sourceId: number, targetId: number) => void;
};

const LS_KEY = 'gpb:pipelines';

function createBlankPipeline(seed?: Partial<Pipeline>): Pipeline {
  const pid = seed?.id ?? nanoid();
  const blank: Pipeline = {
    id: pid,
    name: seed?.name ?? 'New Pipeline',
    version: seed?.version ?? 'v0',
    isActive: seed?.isActive ?? true,
    components: [],
  };
  return blank;
}

function nextComponentId(p: Pipeline) {
  return (Math.max(0, ...p.components.map(c => c.id)) + 1) || 1;
}
function nextBlockId(p: Pipeline) {
  const all = p.components.flatMap(c => c.blocks.map(b => b.block_id));
  return (Math.max(0, ...all) + 1) || 1;
}

// ────────────────────────── Helpers for connectBlocks row sync
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function getDivisionRowCountFromComponent(component: Component): number | null {
  const division = component.blocks.find(b => b.block_type === BLOCK_TYPE.DIVISION);
  if (!division) return null;
  return Array.isArray(division.body_cells) ? division.body_cells.length : 0;
}

function createRowTemplateForGeneralBlock(colCount: number): any[] {
  return Array.from({ length: colCount }, () => [null]);
}

function normalizeGeneralBlockBodyRows(block: FlowBlock, targetRowCount: number): FlowBlock {
  const cloned = deepClone(block);
  const colCount = cloned.header_cells?.length || 0;
  if (!Array.isArray(cloned.body_cells)) cloned.body_cells = [] as any;

  if (cloned.body_cells.length === 0) {
    cloned.body_cells = Array.from({ length: targetRowCount }, () =>
      createRowTemplateForGeneralBlock(colCount)
    ) as any;
  } else if (cloned.body_cells.length < targetRowCount) {
    const lastRow = deepClone(
      cloned.body_cells[cloned.body_cells.length - 1] ?? createRowTemplateForGeneralBlock(colCount)
    );
    while (cloned.body_cells.length < targetRowCount) {
      cloned.body_cells.push(deepClone(lastRow));
    }
  } else if (cloned.body_cells.length > targetRowCount) {
    cloned.body_cells = cloned.body_cells.slice(0, targetRowCount) as any;
  }

  cloned.body_cells = cloned.body_cells.map((row: any) => {
    const newRow = deepClone(row);
    if (newRow.length < colCount) {
      const templateCell = [null];
      while (newRow.length < colCount) newRow.push(deepClone(templateCell));
    } else if (newRow.length > colCount) {
      newRow.length = colCount;
    }
    return newRow;
  }) as any;

  return cloned;
}

export const usePipelines = create<PipelinesState>()(
  persist(
    (set, get) => ({
      pipelines: [],
      selectedId: undefined,
      combineState: {
        isCombineMode: false,
        sourceBlockId: null,
        sourcePipelineId: null,
      },

      adjustComponentOrder: async (pipelineId, sourceComponentId, targetComponentId, direction) => {
        // 먼저 로컬 상태에서 유효성 검사
        const p = get().pipelines.find(pp => pp.id === pipelineId);
        if (!p) {
          return { success: false, error: '파이프라인을 찾을 수 없습니다.' };
        }
        
        const sourceComponent = p.components.find(c => c.id === sourceComponentId);
        const targetComponent = p.components.find(c => c.id === targetComponentId);
        
        if (!sourceComponent || !targetComponent) {
          return { success: false, error: '소스 또는 타겟 컴포넌트를 찾을 수 없습니다.' };
        }

        // API 호출하여 DB에서 순서 조정
        const apiResult = await adjustComponentOrderApi(
          pipelineId,
          sourceComponentId,
          targetComponentId,
          direction
        );

        if (!apiResult.success) {
          return apiResult;
        }

        // API 성공 시 로컬 상태도 업데이트
        set(state => {
          const pipeline = state.pipelines.find(pp => pp.id === pipelineId);
          if (!pipeline) return state;

          // 현재 컴포넌트들을 position 기준으로 정렬
          const sortedComponents = [...pipeline.components].sort((a, b) => a.position - b.position);
          const sourceIndex = sortedComponents.findIndex(c => c.id === sourceComponentId);
          const targetIndex = sortedComponents.findIndex(c => c.id === targetComponentId);
          
          if (sourceIndex === -1 || targetIndex === -1) {
            return state;
          }
          
          // 새로운 position 값 계산
          let newPosition: number;
          
          if (direction === 'before') {
            // 타겟 앞에 배치
            if (targetIndex === 0) {
              // 타겟이 첫 번째인 경우, 타겟보다 작은 값으로 설정
              newPosition = targetComponent.position - 1;
            } else {
              // 타겟과 이전 컴포넌트 사이의 중간값
              const prevComponent = sortedComponents[targetIndex - 1];
              newPosition = (prevComponent.position + targetComponent.position) / 2;
            }
          } else {
            // 타겟 뒤에 배치
            if (targetIndex === sortedComponents.length - 1) {
              // 타겟이 마지막인 경우, 타겟보다 큰 값으로 설정
              newPosition = targetComponent.position + 1;
            } else {
              // 타겟과 다음 컴포넌트 사이의 중간값
              const nextComponent = sortedComponents[targetIndex + 1];
              newPosition = (targetComponent.position + nextComponent.position) / 2;
            }
          }
          
          // 소스 컴포넌트의 position 업데이트
          const updatedComponents = pipeline.components.map(c => 
            c.id === sourceComponentId 
              ? { ...c, position: newPosition }
              : c
          );

          // 연결선 재생성 (order 순서에 따라)
          const componentGrids = updatedComponents.map(comp => ({
            componentId: comp.id,
            order: comp.position,
            x: comp.ui.x,
            y: comp.ui.y,
            blocks: comp.blocks
          }));
          
          const connections = generateConnectionsFromOrder(componentGrids);
          const edges = connections.map((conn, index) => ({
            id: `edge-${index}`,
            source: conn.source,
            target: conn.target,
            sourceHandle: conn.sourceHandle,
            targetHandle: conn.targetHandle,
            type: 'default'
          }));
          
          return {
            pipelines: state.pipelines.map(pp => 
              pp.id === pipelineId 
                ? { ...pipeline, components: updatedComponents, edges }
                : pp
            )
          };
        });
        
        return { success: true };
      },

      // loadComponentGridsWithConnections: async (pipelineId) => {
      //   try {
      //     // DB에서 ComponentGrid들 로드
      //     const componentGrids = await loadAllComponentGridsFromDb(parseInt(pipelineId));
      //     
      //     if (componentGrids.length === 0) {
      //       return { success: true }; // ComponentGrid가 없으면 연결선도 없음
      //     }

      //     // order 순서에 따라 연결선 생성
      //     const connections = generateConnectionsFromOrder(componentGrids);

      //     // 로컬 상태 업데이트
      //     set(state => {
      //       const pipeline = state.pipelines.find(p => p.id === pipelineId);
      //       if (!pipeline) {
      //         return state;
      //       }

      //       // ComponentGrid들을 Component 형태로 변환
      //       const components: Component[] = componentGrids.map(grid => ({
      //         id: grid.componentId,
      //         name: `Component ${grid.componentId}`,
      //         predecessorId: null, // 연결선으로 관리하므로 null
      //         position: grid.order,
      //         ui: { x: grid.x, y: grid.y },
      //         blocks: grid.blocks.map(block => ({
      //           block_id: block.block_id,
      //           block_type: block.block_type,
      //           header_cells: block.header_cells,
      //           body_cells: block.body_cells
      //         }))
      //       }));

      //       // 연결선을 Edge 형태로 변환
      //       const edges = connections.map((conn, index) => ({
      //         id: `edge-${index}`,
      //         source: conn.source,
      //         target: conn.target,
      //         sourceHandle: conn.sourceHandle,
      //         targetHandle: conn.targetHandle,
      //         type: 'default'
      //       }));

      //       // 파이프라인 업데이트
      //       const updatedPipeline = {
      //         ...pipeline,
      //         components,
      //         edges
      //       };

      //       return {
      //         pipelines: state.pipelines.map(p => 
      //           p.id === pipelineId ? updatedPipeline : p
      //         )
      //       };
      //     });

      //     return { success: true };
      //   } catch (error) {
      //     console.error('ComponentGrid 로드 실패:', error);
      //     return { 
      //       success: false, 
      //       error: error instanceof Error ? error.message : 'ComponentGrid 로드 중 오류가 발생했습니다.' 
      //     };
      //   }
      // },

      getById: (id: string) => get().pipelines.find(p => p.id === id),

      select: (id) => set({ selectedId: id }),

      setAll: (list) => set({ pipelines: list }),

      add: (seed) => {
        const p = createBlankPipeline(seed);
        set(state => ({ pipelines: [...state.pipelines, p], selectedId: p.id }));
        return p;
      },

      update: (id, patch) => {
        set(state => ({
          pipelines: state.pipelines.map(p => (p.id === id ? { ...p, ...patch } : p)),
        }));
      },

      remove: (id) => {
        set(state => {
          const next = state.pipelines.filter(p => p.id !== id);
          const sel = state.selectedId === id ? next[0]?.id : state.selectedId;
          return { pipelines: next, selectedId: sel };
        });
      },

      duplicate: (id) => {
        const src = get().pipelines.find(p => p.id === id);
        if (!src) return undefined;
        const clone: Pipeline = {
          ...src,
          id: nanoid(),
          name: `${src.name} (copy)`,
          components: src.components.map((c, idx) => ({
            ...c,
            id: idx + 1,
            predecessorId: c.predecessorId != null ? Math.min(c.predecessorId, src.components.length) : null,
            position: idx + 1,
            ui: { ...(c.ui ?? {x:0,y:0}), x: (c.ui?.x ?? 0) + 60, y: (c.ui?.y ?? 0) + 40 },
            blocks: JSON.parse(JSON.stringify(c.blocks)) as unknown as FlowBlock[],
          })),
        };
        set(state => ({ pipelines: [...state.pipelines, clone], selectedId: clone.id }));
        return clone;
      },

      // ────────────────────────── Canvas helpers
      // Deprecated
      createComponentWithBlock: (pipelineId, block, ui) => {
        let created!: Component;
        set(state => {
          const p = state.pipelines.find(pp => pp.id === pipelineId);
          if (!p) return state;
          const cid = nextComponentId(p);
          const bid = nextBlockId(p);
          const comp: Component = {
            id: cid,
            name: `Component ${cid}`,
            predecessorId: null,
            position: (Math.max(0, ...p.components.map(c => c.position)) + 1) || 1,
            ui,
            // 호환: AnyBlock을 FlowBlock으로 변환하여 저장 (간단한 변환)
            blocks: [{ 
              block_id: bid, 
              block_type: 0, // 기본값
              header_cells: [['샘플 헤더']], 
              body_cells: [[['샘플 데이터']]] 
            } as FlowBlock],
          } as Component;
          created = comp;
          return {
            pipelines: state.pipelines.map(pp => pp.id === pipelineId ? { ...p, components: [...p.components, comp] } : pp),
          };
        });
        return created;
      },

      createComponentWithFlowBlock: (pipelineId, block, ui) => {
        let created!: Component;
        set(state => {
          const p = state.pipelines.find(pp => pp.id === pipelineId);
          if (!p) return state;
          const cid = nextComponentId(p);
          const bid = nextBlockId(p);
          const comp: Component = {
            id: cid,
            name: `Component ${cid}`,
            predecessorId: null,
            position: (Math.max(0, ...p.components.map(c => c.position)) + 1) || 1,
            ui,
            blocks: [{ 
              block_id: bid, 
              block_type: block.block_type, 
              header_cells: block.header_cells, 
              body_cells: block.body_cells 
            } as FlowBlock],
          } as Component;
          created = comp;
          return {
            pipelines: state.pipelines.map(pp => pp.id === pipelineId ? { ...p, components: [...p.components, comp] } : pp),
          };
        });
        return created;
      },

      addBlockToComponent: (pipelineId, compId, block, atIndex) => {
        set(state => {
          const p = state.pipelines.find(pp => pp.id === pipelineId);
          if (!p) return state;
          const c = p.components.find(cc => cc.id === compId);
          if (!c) return state;
          const bid = nextBlockId(p);
          const blocks = c.blocks.slice();
          const idx = atIndex == null ? blocks.length : Math.max(0, Math.min(atIndex, blocks.length));
          // AnyBlock을 FlowBlock으로 변환 저장 (간단한 변환)
          blocks.splice(idx, 0, { 
            block_id: bid, 
            block_type: 0, // 기본값
            header_cells: [['샘플 헤더']], 
            body_cells: [[['샘플 데이터']]] 
          } as FlowBlock);
          // 재배치
          const comps = p.components.map(cc => cc.id === compId ? { ...c, blocks } : cc);
          return { pipelines: state.pipelines.map(pp => pp.id === pipelineId ? { ...p, components: comps } : pp) };
        });
      },

      addFlowBlockToComponent: (pipelineId, compId, block, atIndex) => {
        set(state => {
          const p = state.pipelines.find(pp => pp.id === pipelineId);
          if (!p) return state;
          const c = p.components.find(cc => cc.id === compId);
          if (!c) return state;
          const bid = nextBlockId(p);
          const blocks = c.blocks.slice();
          const idx = atIndex == null ? blocks.length : Math.max(0, Math.min(atIndex, blocks.length));
          blocks.splice(idx, 0, { 
            block_id: bid, 
            block_type: block.block_type, 
            header_cells: block.header_cells, 
            body_cells: block.body_cells 
          } as FlowBlock);
          // 재배치
          const comps = p.components.map(cc => cc.id === compId ? { ...c, blocks } : cc);
          return { pipelines: state.pipelines.map(pp => pp.id === pipelineId ? { ...p, components: comps } : pp) };
        });
      },

      moveBlock: (pipelineId, fromCompId, fromIndex, toCompId, toIndex) => {
        set(state => {
          const p = state.pipelines.find(pp => pp.id === pipelineId);
          if (!p) return state;
          const from = p.components.find(c => c.id === fromCompId);
          const to = p.components.find(c => c.id === toCompId);
          if (!from || !to) return state;

          const moving = from.blocks[fromIndex];
          if (!moving) return state;

          const fromBlocks = from.blocks.slice();
          fromBlocks.splice(fromIndex, 1);

          const toBlocks = to.blocks.slice();
          const idx = toIndex == null ? toBlocks.length : Math.max(0, Math.min(toIndex, toBlocks.length));
          toBlocks.splice(idx, 0, { ...moving });

          const normFrom = fromBlocks;
          const normTo = toBlocks;

          // 빈 컴포넌트 제거 규칙
          let comps = p.components.map(c =>
            c.id === fromCompId ? { ...from, blocks: normFrom } :
            c.id === toCompId   ? { ...to, blocks: normTo }   : c
          );
          const removedEmpty = comps.filter(c => c.id !== fromCompId || (c.blocks && c.blocks.length > 0));
          if (removedEmpty.length !== comps.length) {
            // 이동으로 from이 비었으면 삭제
            comps = removedEmpty;
            // predecessor 보정: 삭제된 from을 참조하던 타겟 predecessorId null
            const removedId = fromCompId;
            comps = comps.map(c => c.predecessorId === removedId ? { ...c, predecessorId: null } : c);
          }

          return { pipelines: state.pipelines.map(pp => pp.id === pipelineId ? { ...p, components: comps } : pp) };
        });
      },

      deleteBlock: (pipelineId, compId, blockId) => {
        set(state => {
          const p = state.pipelines.find(pp => pp.id === pipelineId);
          if (!p) return state;
          const c = p.components.find(cc => cc.id === compId);
          if (!c) return state;

          const left = c.blocks.filter(b => b.block_id !== blockId).map((b, i) => ({ ...b, position: i + 1 }));
          let comps = p.components.map(cc => cc.id === compId ? { ...c, blocks: left } : cc);
          if (left.length === 0) {
            // 규칙: 유일 블록이었다면 컴포넌트 삭제
            comps = comps.filter(cc => cc.id !== compId).map(cc => cc.predecessorId === compId ? { ...cc, predecessorId: null } : cc);
          }
          return { pipelines: state.pipelines.map(pp => pp.id === pipelineId ? { ...p, components: comps } : pp) };
        });
      },

      updateDivisionCell: (pipelineId, compId, blockId, rowIndex, colIndex, value) => {
        let ok = false;
        set(state => {
          const p = state.pipelines.find(pp => pp.id === pipelineId);
          if (!p) return state;
          const c = p.components.find(cc => cc.id === compId);
          if (!c) return state;
          const idx = c.blocks.findIndex(b => b.block_id === blockId && b.block_type === 1); // Division = 1
          if (idx === -1) return state;
          const target = c.blocks[idx] as FlowBlock;
          const next = { ...target };
          // 새로운 구조에서는 body_cells 업데이트
          if (next.body_cells && next.body_cells[rowIndex] && next.body_cells[rowIndex][colIndex]) {
            next.body_cells[rowIndex][colIndex] = [value];
          }
          const blocks = c.blocks.slice();
          blocks[idx] = next;
          ok = true;
          return { pipelines: state.pipelines.map(pp => pp.id === pipelineId ? { ...p, components: p.components.map(cc => cc.id === compId ? { ...c, blocks } : cc) } : pp) };
        });
        return ok ? { success: true } : { success: false, error: '업데이트 실패' };
      },

      updateBlock: (pipelineId, compId, blockId, updatedBlock) => {
        let ok = false;
        set(state => {
          const p = state.pipelines.find(pp => pp.id === pipelineId);
          if (!p) return state;
          const c = p.components.find(cc => cc.id === compId);
          if (!c) return state;
          const blockIndex = c.blocks.findIndex(b => b.block_id === blockId);
          if (blockIndex === -1) return state;
          
          const blocks = c.blocks.slice();
          // if(blocks[blockIndex].block_type === BLOCK_TYPE.DIVISION) {
          //   blocks[blockIndex].body_cells = recalculateRowspan(blocks[blockIndex].body_cells);
          // }
          blocks[blockIndex] = updatedBlock;
          
          ok = true;
          return { 
            pipelines: state.pipelines.map(pp => 
              pp.id === pipelineId 
                ? { ...p, components: p.components.map(cc => cc.id === compId ? { ...c, blocks } : cc) } 
                : pp
            ) 
          };
        });
        return ok ? { success: true } : { success: false, error: '블록 업데이트 실패' };
      },
      updateAllBlocks: (pipelineId : any, compId : any, updatedBlocks : FlowBlock[]) => {
        let ok = false;
        set(state => {
          const p = state.pipelines.find(pp => pp.id === pipelineId);
          if (!p) return state;
          const c = p.components.find(cc => cc.id === compId);
          if (!c) return state;

          c.blocks = [...updatedBlocks];
          console.log(c.blocks[0].body_cells);
          
          if(c.blocks[0].block_type === BLOCK_TYPE.DIVISION) {
            c.blocks[0].body_cells = recalculateRowspan(c.blocks[0].body_cells);
          }
          
          ok = true;
          return { 
            pipelines: state.pipelines.map(pp => 
              pp.id === pipelineId 
                ? { ...p, components: p.components.map(cc => cc.id === compId ? { ...c } : cc) } 
                : pp
            ) 
          };
        });
        return ok ? { success: true } : { success: false, error: '블록 업데이트 실패' };
      },

      addColumnToBlock: (pipelineId, compId, blockId, blockData = []) => {
        let ok = false;
        set(state => {
          const p = state.pipelines.find(pp => pp.id === pipelineId);
          if (!p) return state;
          const c = p.components.find(cc => cc.id === compId);
          if (!c) return state;
          const blockIndex = c.blocks.findIndex(b => b.block_id === blockId);
          if (blockIndex === -1) return state;
          
          const target = c.blocks[blockIndex] as FlowBlock;
          
          // col_editable 체크 로직 구현
          const blockDataItem = blockData.find(bd => bd.block_type === target.block_type);
          const isColEditable = blockDataItem?.col_editable || false;
          
          if (!isColEditable) {
            return { success: false, error: '이 블록 타입은 열 추가가 허용되지 않습니다.' };
          }
          
          // 새로운 구조에서 열 추가
          const updatedBlock = {
            ...target,
            header_cells: [...(target.header_cells || []), ['새 열']],
            body_cells: target.body_cells.map(row => [...row, ['새 데이터']])
          };
          
          const blocks = c.blocks.slice();
          blocks[blockIndex] = updatedBlock;
          
          ok = true;
          return { 
            pipelines: state.pipelines.map(pp => 
              pp.id === pipelineId 
                ? { ...p, components: p.components.map(cc => cc.id === compId ? { ...c, blocks } : cc) } 
                : pp
            ) 
          };
        });
        return ok ? { success: true } : { success: false, error: '열 추가 실패' };
      },

      // 블록 결합 기능
      connectBlocks: (pipelineId, fromBlockId, toBlockId, side = 'right') => {
        const p = get().pipelines.find(pp => pp.id === pipelineId);
        if (!p) return { success: false, error: '파이프라인을 찾을 수 없습니다.' };

        // 블록 찾기
        let fromBlock: FlowBlock | undefined;
        let toBlock: FlowBlock | undefined;
        let fromComp: Component | undefined;
        let toComp: Component | undefined;

        for (const comp of p.components) {
          const foundFrom = comp.blocks.find(b => b.block_id === fromBlockId);
          const foundTo = comp.blocks.find(b => b.block_id === toBlockId);
          if (foundFrom) { fromBlock = foundFrom; fromComp = comp; }
          if (foundTo) { toBlock = foundTo; toComp = comp; }
        }

        if (!fromBlock || !toBlock || !fromComp || !toComp) {
          return { success: false, error: '블록을 찾을 수 없습니다.' };
        }

        // 결합 검증(현재는 경고용)
        const validation = validateBlockConnection(fromBlock as any, toBlock as any);
        // if (!validation.valid) return { success: false, error: validation.error };

        const sourceCompId = fromComp.id;
        const targetCompId = toComp.id;

        const fromIndex = fromComp.blocks.findIndex(b => b.block_id === fromBlockId);
        const toIndex = toComp.blocks.findIndex(b => b.block_id === toBlockId);
        if (fromIndex === -1 || toIndex === -1) {
          return { success: false, error: '인덱스 계산 실패' };
        }

        let insertIndex = side === 'left' ? toIndex : toIndex + 1;
        if (sourceCompId === targetCompId && fromIndex < insertIndex) {
          insertIndex = Math.max(0, insertIndex - 1);
        }

        // 타겟 컴포넌트의 DIVISION 기준 행 수 계산
        const targetRowCount = getDivisionRowCountFromComponent(toComp);
        if (targetRowCount == null) {
          // DIVISION이 없으면 기존 이동 로직 유지
          get().moveBlock(pipelineId, sourceCompId, fromIndex, targetCompId, insertIndex);
          get().cancelCombine();
          return { success: true };
        }

        // 정규화된 블록 생성(깊은 복사) - 일반 블록만 행 정규화
        let normalized = deepClone(fromBlock);
        if (normalized.block_type !== BLOCK_TYPE.DIVISION) {
          normalized = normalizeGeneralBlockBodyRows(normalized, targetRowCount);
        }

        // set을 통해 원자적으로 제거+삽입 적용
        set(state => {
          const pipeline = state.pipelines.find(pp => pp.id === pipelineId);
          if (!pipeline) return state;

          const source = pipeline.components.find(c => c.id === sourceCompId);
          const target = pipeline.components.find(c => c.id === targetCompId);
          if (!source || !target) return state;

          const newFromBlocks = source.blocks.slice();
          if (!newFromBlocks[fromIndex]) return state;
          newFromBlocks.splice(fromIndex, 1);

          const newToBlocks = target.blocks.slice();
          newToBlocks.splice(insertIndex, 0, normalized);

          let comps = pipeline.components.map(c =>
            c.id === source.id ? { ...source, blocks: newFromBlocks } :
            c.id === target.id ? { ...target, blocks: newToBlocks } : c
          );

          // 빈 컴포넌트 자동 삭제 규칙 적용 (moveBlock과 동일 동작)
          const removedEmpty = comps.filter(c => c.id !== source.id || (c.blocks && c.blocks.length > 0));
          if (removedEmpty.length !== comps.length) {
            comps = removedEmpty;
            const removedId = source.id;
            comps = comps.map(c => c.predecessorId === removedId ? { ...c, predecessorId: null } : c);
          }

          return { pipelines: state.pipelines.map(pp => pp.id === pipelineId ? { ...pipeline, components: comps } : pp) };
        });

        get().cancelCombine();
        return { success: true };
      },

      mergeBlocks: (pipelineId, fromBlockId, toBlockId) => {
        // 블록 병합: 두 블록을 하나로 합치는 기능 (향후 확장용)
        return get().connectBlocks(pipelineId, fromBlockId, toBlockId);
      },

      validateBlockConnection: (pipelineId, fromBlockId, toBlockId) => {
        const p = get().pipelines.find(pp => pp.id === pipelineId);
        if (!p) return { valid: false, error: '파이프라인을 찾을 수 없습니다.' };

        // 블록 찾기
        let fromBlock: FlowBlock | undefined;
        let toBlock: FlowBlock | undefined;

        for (const comp of p.components) {
          const foundFrom = comp.blocks.find(b => b.block_id === fromBlockId);
          const foundTo = comp.blocks.find(b => b.block_id === toBlockId);
          
          if (foundFrom) fromBlock = foundFrom;
          if (foundTo) toBlock = foundTo;
        }

        if (!fromBlock || !toBlock) {
          return { valid: false, error: '블록을 찾을 수 없습니다.' };
        }

        // 결합 검증
        const validation = validateBlockConnection(fromBlock as any, toBlock as any);
        return validation;
      },

      syncBlockRows: (pipelineId, componentId) => {
        const p = get().pipelines.find(pp => pp.id === pipelineId);
        if (!p) return;

        const component = p.components.find(c => c.id === componentId);
        if (!component || component.blocks.length === 0) return;

        try {
          // 모든 블록을 FlowBlock으로 간주하여 최대 행 수만 계산 (자동 확장 제거)
          const flowBlocks = component.blocks as FlowBlock[];
          if (flowBlocks.length === 0) return;

          let maxRows = 1;
          flowBlocks.forEach(flowBlock => {
            const { rows } = BlockGridCalculator.calculateGridSize(flowBlock);
            maxRows = Math.max(maxRows, rows);
          });
          // 현재 단계에선 행 자동 확장을 수행하지 않음 (그리드가 동적으로 처리)
        } catch (error) {
          console.warn('syncBlockRows failed:', error);
        }
      },

      setComponentXY: (pipelineId, compId, ui) => {
        set(state => {
          const p = state.pipelines.find(pp => pp.id === pipelineId);
          if (!p) return state;
          const comps = p.components.map(c => c.id === compId ? { ...c, ui } : c);
          return { pipelines: state.pipelines.map(pp => pp.id === pipelineId ? { ...p, components: comps } : pp) };
        });
      },

      connectComponents: (pipelineId, sourceId, targetId) => {
        set(state => {
          const p = state.pipelines.find(pp => pp.id === pipelineId);
          if (!p) return state;
          
          const sourceComp = p.components.find(c => c.id === sourceId);
          const targetComp = p.components.find(c => c.id === targetId);
          
          if (!sourceComp || !targetComp) return state;
          
          // 모든 컴포넌트의 position을 재정렬
          const sortedComps = [...p.components].sort((a, b) => a.position - b.position);
          const sourceIndex = sortedComps.findIndex(c => c.id === sourceId);
          const targetIndex = sortedComps.findIndex(c => c.id === targetId);
          
          // target을 source 다음 위치로 이동
          const newComps = [...sortedComps];
          newComps.splice(targetIndex, 1); // target 제거
          newComps.splice(sourceIndex + 1, 0, targetComp); // source 다음에 target 삽입
          
          // position 재할당
          const updatedComps = newComps.map((comp, index) => ({
            ...comp,
            position: index + 1,
            predecessorId: null // predecessorId는 더 이상 사용하지 않음
          }));
          
          return { pipelines: state.pipelines.map(pp => pp.id === pipelineId ? { ...p, components: updatedComps } : pp) };
        });
      },

      toggleEdgeDirection: (pipelineId, sourceId, targetId) => {
        // source -> target 엣지를 target -> source로 뒤집기
        set(state => {
          const p = state.pipelines.find(pp => pp.id === pipelineId);
          if (!p) return state;
          const source = p.components.find(c => c.id === sourceId);
          const target = p.components.find(c => c.id === targetId);
          if (!source || !target) return state;
          // 기존: target.predecessorId = sourceId
          // 뒤집기: source.predecessorId = targetId, target.predecessorId = null
          const comps = p.components.map(c => {
            if (c.id === sourceId) return { ...c, predecessorId: targetId };
            if (c.id === targetId) return { ...c, predecessorId: null };
            return c;
          });
          return { pipelines: state.pipelines.map(pp => pp.id === pipelineId ? { ...p, components: comps } : pp) };
        });
      },

      // 결합 상태 관리
      startCombine: (pipelineId, blockId) => {
        set(state => ({
          ...state,
          combineState: {
            isCombineMode: true,
            sourceBlockId: blockId,
            sourcePipelineId: pipelineId,
          }
        }));
      },

      cancelCombine: () => {
        set(state => ({
          ...state,
          combineState: {
            isCombineMode: false,
            sourceBlockId: null,
            sourcePipelineId: null,
          }
        }));
      },
    }),
    {
      name: LS_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 2,
    }
  )
);
