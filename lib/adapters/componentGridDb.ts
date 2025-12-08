// lib/adapters/componentGridDb.ts
// ComponentGrid DB 어댑터 - 실제 DB 저장/로드 기능

import { PrismaClient } from '@prisma/client';
import type { FlowBlock } from '../../types/block-structure';
import type { HierarchicalCell } from '../../types/hierarchicalCell';
import { BLOCK_TYPE } from '../../types/block-types';
import { BlockInstanceFactory } from '../../lib/blocks/modules/registry';
import type { DivisionHeadData } from '../../types/division-head';

const prisma = new PrismaClient() as any;

export interface ComponentGridSaveData {
  pipelineId: number;
  componentId: number;
  order: number;
  name?: string;
  x?: number;
  y?: number;
  blocks: FlowBlock[];
  hierarchicalDataMap?: Record<string, HierarchicalCell[]>;
  divisionHead?: DivisionHeadData;
}

export interface ComponentGridLoadData {
  componentId: number;
  order: number;
  name?: string;
  x: number;
  y: number;
  blocks: FlowBlock[];
  hierarchicalDataMap?: Record<string, HierarchicalCell[]>;
  divisionHead?: DivisionHeadData;
}

/**
 * 단일 ComponentGrid를 DB에 저장
 */
export async function saveComponentGridToDb(data: ComponentGridSaveData): Promise<void> {
  const { pipelineId, componentId, order, name, x = 0, y = 0, blocks, hierarchicalDataMap, divisionHead } = data;
 console.table(blocks)
  // 트랜잭션으로 ComponentGrid와 Block들을 함께 저장
  await prisma.$transaction(async (tx: any) => {
    // DivisionHead 데이터 준비
    const divisionHeadHeader = divisionHead?.header ? JSON.parse(JSON.stringify(divisionHead.header)) : null;
    const divisionHeadBody = divisionHead?.body ? JSON.parse(JSON.stringify(divisionHead.body)) : null;
    const divisionHeadActive = divisionHead?.isActive ?? true;
    
    // ComponentGrid 저장 또는 업데이트
    await tx.component_grid.upsert({
      where: {
        pipeline_id_component_id: {
          pipeline_id: BigInt(pipelineId),
          component_id: componentId
        }
      },
      update: {
        order,
        name,
        x,
        y,
        division_head_header: divisionHeadHeader,
        division_head_body: divisionHeadBody,
        division_head_active: divisionHeadActive
      },
      create: {
        pipeline_id: BigInt(pipelineId),
        component_id: componentId,
        order,
        name,
        x,
        y,
        division_head_header: divisionHeadHeader,
        division_head_body: divisionHeadBody,
        division_head_active: divisionHeadActive
      }
    });

    // 기존 블록들 삭제
    await tx.block.deleteMany({
      where: {
        pipeline_id: BigInt(pipelineId),
        component_id: componentId
      }
    });

    // FlowBlock[]을 BlockInstance[]로 변환
    const blockInstances = blocks.map(block => {
      return BlockInstanceFactory.create(
        block.block_type,
        block.block_id,
        {
          header_cells: block.header_cells,
          body_cells: block.body_cells
        }
      );
    });
    
    // 새로운 블록들 저장 (BlockInstance의 DB 형식 직접 사용)
    for (let i = 0; i < blockInstances.length; i++) {
      const blockInstance = blockInstances[i];
      
      // DB 형식으로 변환 (명시적 구조)
      const dbFormat = blockInstance.toDbFormat();

      await tx.block.create({
        data: {
          pipeline_id: BigInt(pipelineId),
          component_id: componentId,
          block_id: blockInstance.block_id,
          order: i,
          block_type: blockInstance.block_type,
          header_cells: dbFormat.header_cells,
          body_cells: dbFormat.body_cells
        }
      });
    }
  });
}

/**
 * 단일 ComponentGrid를 DB에서 로드
 */
export async function loadComponentGridFromDb(
  pipelineId: number, 
  componentId: number
): Promise<ComponentGridLoadData | null> {
  const componentGrid = await prisma.component_grid.findUnique({
    where: {
      pipeline_id_component_id: {
        pipeline_id: BigInt(pipelineId),
        component_id: componentId
      }
    },
    include: {
      blocks: {
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!componentGrid) {
    return null;
  }

  // BlockInstance로 변환하여 DB 형식 그대로 사용
  const blockInstances = componentGrid.blocks.map((block: any) => {
    return BlockInstanceFactory.create(
      block.block_type,
      block.block_id,
      {
        header_cells: block.header_cells,
        body_cells: block.body_cells
      }
    );
  });
  
  // FlowBlock 형태로 변환 (UI 호환성)
  const blocks: FlowBlock[] = blockInstances.map(instance => instance.toFlowBlock());

  // DivisionHead 데이터 로드
  let divisionHead: DivisionHeadData | undefined;
  if (componentGrid.division_head_header !== null || componentGrid.division_head_body !== null) {
    divisionHead = {
      header: (componentGrid.division_head_header as any) || [{ division_type: 'gender' }],
      body: (componentGrid.division_head_body as any) || [[{}]],
      isActive: componentGrid.division_head_active ?? true,
    };
  }

  return {
    componentId: componentGrid.component_id,
    order: componentGrid.order,
    name: componentGrid.name,
    x: componentGrid.x,
    y: componentGrid.y,
    blocks,
    divisionHead
  };
}

/**
 * 파이프라인의 모든 ComponentGrid를 DB에서 로드
 */
export async function loadAllComponentGridsFromDb(pipelineId: number): Promise<ComponentGridLoadData[]> {
  const componentGrids = await prisma.component_grid.findMany({
    where: {
      pipeline_id: BigInt(pipelineId)
    },
    include: {
      blocks: {
        orderBy: { order: 'asc' }
      }
    },
    orderBy: { order: 'asc' }
  });

    return componentGrids.map((componentGrid: any) => {
      const blocks: FlowBlock[] = componentGrid.blocks.map((block: any) => {
        try {
          // BlockInstance로 변환하여 기존/새로운 구조 모두 지원
          const blockInstance = BlockInstanceFactory.create(
            block.block_type,
            block.block_id,
            {
              header_cells: block.header_cells,
              body_cells: block.body_cells
            }
          );
          // FlowBlock 형식으로 변환
          const flowBlock = blockInstance.toFlowBlock();
          
          // 디버깅: ApplySubject 블록의 경우 변환 결과 확인
          if (block.block_type === 2) { // APPLY_SUBJECT
            console.log('[ApplySubject] DB data:', JSON.stringify(block.body_cells));
            console.log('[ApplySubject] FlowBlock body_cells:', JSON.stringify(flowBlock.body_cells));
          }
          
          return flowBlock;
        } catch (error) {
          console.warn(`Failed to create BlockInstance for block ${block.block_id}, using original format:`, error);
          // BlockInstance 생성 실패 시 기존 형식 사용
          return {
            block_id: block.block_id,
            block_type: block.block_type,
            header_cells: block.header_cells as any,
            body_cells: block.body_cells as any
          };
        }
      });

    // DivisionHead 데이터 로드
    let divisionHead: DivisionHeadData | undefined;
    if (componentGrid.division_head_header !== null || componentGrid.division_head_body !== null) {
      divisionHead = {
        header: (componentGrid.division_head_header as any) || [{ division_type: 'gender' }],
        body: (componentGrid.division_head_body as any) || [[{}]],
        isActive: componentGrid.division_head_active ?? true,
      };
    }

    return {
      componentId: componentGrid.component_id,
      order: componentGrid.order,
      name: componentGrid.name,
      x: componentGrid.x,
      y: componentGrid.y,
      blocks,
      divisionHead
    };
  });
}

export type GridCell = {
  value: any[] | null;
  rowspan: number; // 0이면 해당 위치는 병합된 셀의 연장부(표시 안 함)
};

/**
 * 계층 트리를 그리드(표)로 변환
 * - 각 열 = 동일 깊이(level)
 * - 같은 노드가 아래 행에 연속되면 첫 행만 값/rowspan을 넣고 나머지는 rowspan=0
 * - rowspan = 해당 노드가 덮는 리프(말단) 개수
 */
export function convertCellHierarchicalToGrid(
  body_cells: HierarchicalCell[]
): { values: Record<string, any> | null; rowspan: number }[][] {

  // 1) 노드별 리프 수 계산 (메모이제이션)
  const leafMemo = new WeakMap<HierarchicalCell, number>();
  const leafCount = (node: HierarchicalCell): number => {
    const cached = leafMemo.get(node);
    if (cached !== undefined) return cached;
    const cnt =
      node.children.length === 0
        ? 1
        : node.children.reduce((sum, ch) => sum + leafCount(ch), 0);
    leafMemo.set(node, cnt);
    return cnt;
  };

  // 2) 루트→리프 모든 경로 수집 (각 경로가 1행)
  const paths: HierarchicalCell[][] = [];
  const dfs = (node: HierarchicalCell, path: HierarchicalCell[]) => {
    const next = [...path, node];
    if (node.children.length === 0) {
      paths.push(next);
    } else {
      for (const ch of node.children) dfs(ch, next);
    }
  };
  for (const root of body_cells) dfs(root, []);

  // 경로가 없으면 빈 그리드 반환
  if (paths.length === 0) return [];

  // 3) 최대 깊이 = 열 수
  const cols = paths.reduce((m, p) => Math.max(m, p.length), 0);
  const rows = paths.length;

  // 4) 그리드 초기화
  const grid: { values: Record<string, any> | null; rowspan: number }[][] =
    Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ values: null, rowspan: 0 }))
    );

  // 5) 같은 열에서 같은 노드가 연속되는 구간의 "첫 행"만 채우기
  const lastNodeAtCol: (HierarchicalCell | null)[] = Array(cols).fill(null);

  for (let r = 0; r < rows; r++) {
    const path = paths[r];
    for (let c = 0; c < cols; c++) {
      const node = path[c];
      if (!node) {
        // 이 경로는 이 열(depth)까지 도달하지 않음 → 비움
        grid[r][c] = { values: null, rowspan: 0 };
        continue;
      }

      if (lastNodeAtCol[c] !== node) {
        // 새 구간 시작 → 실제 셀 배치
        grid[r][c] = {
          values: node.values ?? {},
          rowspan: leafCount(node),
        };
        lastNodeAtCol[c] = node;
      } else {
        // 같은 노드의 연장부 → 병합된 영역
        grid[r][c] = { values: null, rowspan: 0 };
      }
    }
  }

  return grid;
}

/**
 * @deprecated
 * @param grid
 * @returns
 */
export function convertGridToHierarchical_original(
  grid: { values: Record<string, any> | null; rowspan?: number }[][]
): HierarchicalCell[] {
  if (grid.length === 0) return [];

  const rows = grid.length;
  const cols = grid[0].length;

  function buildTree(rStart: number, rEnd: number, col: number): HierarchicalCell[] {
    if (col >= cols) return [];

    const result: HierarchicalCell[] = [];
    let r = rStart;

    while (r <= rEnd) {
      const cell = grid[r][col];
      console.log(cell);
      if (cell && cell.rowspan && cell.rowspan > 0 && cell.values) {
        const spanEnd = r + cell.rowspan - 1;

        // 하위 열(children) 재귀 생성
        const children = buildTree(r, spanEnd, col + 1);

        result.push({
          id: '',
          type: '',
          level: 0,
          values: cell.values,
          rowIndex: r,
          colIndex: col,
          children,
        });

        r = spanEnd + 1; // 이 구간은 처리 완료
      } else {
        r++; // rowspan=0 영역은 skip
      }
    }

    return result;
  }

  // 루트 노드들 (col=0부터 시작)
  return buildTree(0, rows - 1, 0);
}

/**
 * grid → 계층적 셀 구조 복원
 */
export function convertGridToHierarchical(
  grid: { values: Record<string, any> | null; rowspan?: number }[][]
): HierarchicalCell[] {
  if (grid.length === 0) return [];

  const rows = grid.length;
  const cols = grid[0].length;

  function buildTree(rStart: number, rEnd: number, col: number, baseRow: number): HierarchicalCell[] {
    if (col >= cols) return [];

    const result: HierarchicalCell[] = [];
    let r = rStart;

    while (r <= rEnd) {
      const cell = grid[r][col];
      if (cell && (cell.rowspan === undefined || cell.rowspan > 0) && cell.values) {
        // 실제 병합 범위 계산: 현재 행 이후로 같은 열에서 rowspan=0인 구간을 모두 포함
        let effectiveSpan = 1;
        let k = r + 1;
        while (k <= rEnd) {
          const nextCell = grid[k][col];
          if (nextCell && nextCell.rowspan === 0) {
            effectiveSpan++;
            k++;
            continue;
          }
          break;
        }
        const spanEnd = r + effectiveSpan - 1;

        // 하위 열(children) 재귀 생성
        const children = buildTree(r, spanEnd, col + 1, baseRow);

        result.push({
          id: '',
          type: '',
          level: 0,
          values: cell.values,
          rowIndex: baseRow,
          colIndex: col,
          children,
        });

        r = spanEnd + 1; // 이 구간은 처리 완료
      } else {
        r++; // rowspan=0 영역은 skip
      }
    }

    return result;
  }

  // 루트 노드들 (col=0부터 시작)
  return buildTree(0, rows - 1, 0, 0);
}

export function recalculateRowspan(body_cells: any[][]): any[][] {
  console.log(JSON.parse(JSON.stringify(body_cells)));
   function recurse(row : number, col : number): void {
    console.log(`recurse ${row} ${col}`);
      const curr = body_cells[row][col];
      let findRow = row+1;

      let rowspan = 1;
      let find = 0;
      // console.log(JSON.parse(JSON.stringify(body_cells[findRow])));
      while(find === 0 && findRow < body_cells.length) {
        // console.log(JSON.parse(JSON.stringify(body_cells[findRow][col])));
        find = body_cells[findRow][col]?.rowspan || -1
        console.log(`find:${find} findRow:${findRow}`);
        if(find !== 0) {
          break;
        }
        ++rowspan;
        ++findRow;
      }
      console.log(`rowspan:${rowspan}`);
      curr.rowspan = rowspan;
      if(col + 1 >= body_cells[row].length) {
        return;
      }
      for(let i=0;i<rowspan;++i) {
         recurse(row+i, col+1);
      }
   }
   console.log(body_cells);
   recurse(0,0);
   return [...body_cells];
}

/**
 * ComponentGrid들의 order 순서에 따라 연결선 정보 생성
 */
export function generateConnectionsFromOrder(componentGrids: ComponentGridLoadData[]): Array<{
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
}> {
  const connections: Array<{
    source: string;
    target: string;
    sourceHandle: string;
    targetHandle: string;
  }> = [];

  // order 순서대로 정렬
  const sortedGrids = [...componentGrids].sort((a, b) => a.order - b.order);

  // 연속된 ComponentGrid들 간에 연결선 생성
  for (let i = 0; i < sortedGrids.length - 1; i++) {
    const currentGrid = sortedGrids[i];
    const nextGrid = sortedGrids[i + 1];

    connections.push({
      source: `component-${currentGrid.componentId}`,
      target: `component-${nextGrid.componentId}`,
      sourceHandle: 'output',
      targetHandle: 'input'
    });
  }

  return connections;
}

/**
 * 단일 ComponentGrid를 DB에서 삭제
 */
export async function deleteComponentGridFromDb(pipelineId: number, componentId: number): Promise<void> {
  await prisma.$transaction(async (tx: any) => {
    // 블록들 먼저 삭제 (FK 제약조건)
    await tx.block.deleteMany({
      where: {
        pipeline_id: BigInt(pipelineId),
        component_id: componentId
      }
    });

    // ComponentGrid 삭제
    await tx.component_grid.delete({
      where: {
        pipeline_id_component_id: {
          pipeline_id: BigInt(pipelineId),
          component_id: componentId
        }
      }
    });
  });
}

/**
 * 여러 ComponentGrid를 일괄 저장 (업서트)
 */
export async function upsertAllComponentGrids(
  pipelineId: number,
  components: Array<{
    id?: number;
    order: number;
    name?: string;
    x?: number;
    y?: number;
    blocks: FlowBlock[];
    hierarchicalDataMap?: Record<string, HierarchicalCell[]>;
    divisionHead?: DivisionHeadData;
  }>
): Promise<{ created: number; updated: number; deleted: number }> {
  let created = 0;
  let updated = 0;
  let deleted = 0;

  console.log('🔍 upsertAllComponentGrids 시작:', {
    pipelineId,
    componentsCount: components.length,
    componentIds: components.map(c => ({ id: c.id, order: c.order }))
  });

  await prisma.$transaction(async (tx: any) => {
    // 기존 ComponentGrid들 조회
    const existingComponents = await tx.component_grid.findMany({
      where: { pipeline_id: BigInt(pipelineId) },
      include: { blocks: true }
    });

    console.log('🔍 기존 컴포넌트들:', existingComponents.map((c: any) => ({ 
      component_id: c.component_id, 
      order: c.order 
    })));

    const existingIds = new Set(existingComponents.map((c: any) => c.component_id));
    const newIds = new Set(components.map(c => c.id).filter(Boolean));

    console.log('🔍 ID 비교:', {
      existingIds: Array.from(existingIds),
      newIds: Array.from(newIds)
    });

    // 삭제할 ComponentGrid들 찾기
    const toDelete = existingComponents.filter((c: any) => !newIds.has(c.component_id));
    
    // 삭제 실행
    for (const component of toDelete) {
      await tx.block.deleteMany({
        where: {
          pipeline_id: BigInt(pipelineId),
          component_id: component.component_id
        }
      });
      await tx.component_grid.delete({
        where: {
          pipeline_id_component_id: {
            pipeline_id: BigInt(pipelineId),
            component_id: component.component_id
          }
        }
      });
      deleted++;
    }

    // 저장/업데이트 실행
    for (const component of components) {
      const isUpdate = component.id && existingIds.has(component.id);
      let finalComponentId: number;
      
      console.log('🔍 컴포넌트 처리:', {
        componentId: component.id,
        order: component.order,
        isUpdate,
        existingIds: Array.from(existingIds)
      });
      
      // DivisionHead 데이터 준비
      const divisionHeadHeader = component.divisionHead?.header ? JSON.parse(JSON.stringify(component.divisionHead.header)) : null;
      const divisionHeadBody = component.divisionHead?.body ? JSON.parse(JSON.stringify(component.divisionHead.body)) : null;
      const divisionHeadActive = component.divisionHead?.isActive ?? true;
      
      if (isUpdate) {
        // 업데이트
        finalComponentId = component.id!;
        
        console.log('🔄 업데이트:', finalComponentId);
        
        await tx.component_grid.update({
          where: {
            pipeline_id_component_id: {
              pipeline_id: BigInt(pipelineId),
              component_id: finalComponentId
            }
          },
          data: {
            order: component.order,
            name: component.name,
            x: component.x || 0,
            y: component.y || 0,
            division_head_header: divisionHeadHeader,
            division_head_body: divisionHeadBody,
            division_head_active: divisionHeadActive
          }
        });

        // 기존 블록들 삭제
        await tx.block.deleteMany({
          where: {
            pipeline_id: BigInt(pipelineId),
            component_id: finalComponentId
          }
        });

        updated++;
      } else {
        // 새로 생성 - 복합 PK이므로 파이프라인별로 독립적인 ID 사용 가능
        finalComponentId = component.id || 1; // 기본값 1 사용
        
        // order가 지정되지 않은 경우 자동으로 최댓값 + 1 할당
        let finalOrder = component.order;
        if (finalOrder === undefined || finalOrder === null) {
          const maxOrderComponent = await tx.component_grid.findFirst({
            where: { pipeline_id: BigInt(pipelineId) },
            orderBy: { order: 'desc' }
          });
          finalOrder = (maxOrderComponent?.order || 0) + 1;
        }
        
        console.log('➕ 생성:', {
          finalComponentId,
          pipelineId,
          order: finalOrder
        });
        
        await tx.component_grid.create({
          data: {
            pipeline_id: BigInt(pipelineId),
            component_id: finalComponentId,
            order: finalOrder,
            name: component.name,
            x: component.x || 0,
            y: component.y || 0,
            division_head_header: divisionHeadHeader,
            division_head_body: divisionHeadBody,
            division_head_active: divisionHeadActive
          }
        });
        
        created++;
      }

      // 블록들 저장 - 동일한 componentId 사용 (BlockInstance 사용)
      for (let i = 0; i < component.blocks.length; i++) {
        const block = component.blocks[i];
        
        // BlockInstance로 변환하여 새로운 구조로 저장
        let blockInstance;
        try {
          blockInstance = BlockInstanceFactory.create(
            block.block_type,
            block.block_id,
            {
              header_cells: block.header_cells,
              body_cells: block.body_cells
            }
          );
        } catch (error) {
          console.warn(`Failed to create BlockInstance for block ${block.block_id}, using original format:`, error);
          blockInstance = null;
        }
        
        let bodyCells = block.body_cells;
        if (component.hierarchicalDataMap && component.hierarchicalDataMap[block.block_id]) {
          bodyCells = component.hierarchicalDataMap[block.block_id] as any;
        }
        
        // BlockInstance가 있으면 새로운 구조로 저장, 없으면 기존 구조로 저장
        const dbFormat = blockInstance ? blockInstance.toDbFormat() : {
          header_cells: block.header_cells,
          body_cells: bodyCells
        };

        await tx.block.create({
          data: {
            pipeline_id: BigInt(pipelineId),
            component_id: finalComponentId,
            block_id: block.block_id,
            order: i,
            block_type: block.block_type,
            header_cells: dbFormat.header_cells,
            body_cells: dbFormat.body_cells
          }
        });
      }
    }
  });

  return { created, updated, deleted };
}

/**
 * 다음 사용 가능한 Component ID 가져오기
 */
async function getNextComponentId(pipelineId: number): Promise<number> {
  const lastComponent = await prisma.component_grid.findFirst({
    where: { pipeline_id: BigInt(pipelineId) },
    orderBy: { component_id: 'desc' }
  });
  
  return (lastComponent?.component_id || 0) + 1;
}

/**
 * 다음 사용 가능한 Order 값 가져오기 (최댓값 + 1)
 */
async function getNextOrder(pipelineId: number): Promise<number> {
  const lastComponent = await prisma.component_grid.findFirst({
    where: { pipeline_id: BigInt(pipelineId) },
    orderBy: { order: 'desc' }
  });
  
  return (lastComponent?.order || 0) + 1;
}

/**
 * 트랜잭션 내에서 다음 사용 가능한 Component ID 가져오기 (파이프라인별 독립)
 */
async function getNextComponentIdInTransaction(tx: any, pipelineId: number): Promise<number> {
  const lastComponent = await tx.component_grid.findFirst({
    where: { pipeline_id: BigInt(pipelineId) },
    orderBy: { component_id: 'desc' }
  });
  
  return (lastComponent?.component_id || 0) + 1;
}

/**
 * ComponentGrid 순서 조정 (연결선을 통한 순서 변경)
 * @param pipelineId 파이프라인 ID
 * @param sourceComponentId 소스 컴포넌트 ID
 * @param targetComponentId 타겟 컴포넌트 ID
 * @param direction 'before' | 'after' - 타겟 앞/뒤에 배치
 */
export async function adjustComponentOrder(
  pipelineId: number,
  sourceComponentId: number,
  targetComponentId: number,
  direction: 'before' | 'after'
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.$transaction(async (tx: any) => {
      // 현재 컴포넌트들의 order 정보 조회
      const components = await tx.component_grid.findMany({
        where: { pipeline_id: BigInt(pipelineId) },
        select: { component_id: true, order: true },
        orderBy: { order: 'asc' }
      });

      const sourceComponent = components.find((c: any) => c.component_id === sourceComponentId);
      const targetComponent = components.find((c: any) => c.component_id === targetComponentId);

      if (!sourceComponent || !targetComponent) {
        throw new Error('소스 또는 타겟 컴포넌트를 찾을 수 없습니다.');
      }

      // 타겟 컴포넌트의 order 값
      const targetOrder = targetComponent.order;
      
      // 새로운 order 값 계산
      let newOrder: number;
      
      if (direction === 'before') {
        // 타겟 앞에 배치: 타겟 order - 1
        newOrder = targetOrder - 1;
        
        // 만약 타겟과 이전 컴포넌트 사이에 공간이 없다면 (차이가 1 이하)
        const prevComponent = components
          .filter((c: any) => c.order < targetOrder)
          .sort((a: any, b: any) => b.order - a.order)[0];
          
        if (prevComponent && (targetOrder - prevComponent.order) <= 1) {
          // 이전 컴포넌트들의 order를 재조정
          const componentsToShift = components.filter((c: any) => c.order < targetOrder);
          for (const comp of componentsToShift) {
            await tx.component_grid.update({
              where: {
                pipeline_id_component_id: {
                  pipeline_id: BigInt(pipelineId),
                  component_id: comp.component_id
                }
              },
              data: { order: comp.order - 1 }
            });
          }
          newOrder = targetOrder - 1;
        }
      } else {
        // 타겟 뒤에 배치: 타겟 order + 1
        newOrder = targetOrder + 1;
        
        // 만약 타겟과 다음 컴포넌트 사이에 공간이 없다면 (차이가 1 이하)
        const nextComponent = components
          .filter((c: any) => c.order > targetOrder)
          .sort((a: any, b: any) => a.order - b.order)[0];
          
        if (nextComponent && (nextComponent.order - targetOrder) <= 1) {
          // 다음 컴포넌트들의 order를 재조정
          const componentsToShift = components.filter((c: any) => c.order > targetOrder);
          for (const comp of componentsToShift) {
            await tx.component_grid.update({
              where: {
                pipeline_id_component_id: {
                  pipeline_id: BigInt(pipelineId),
                  component_id: comp.component_id
                }
              },
              data: { order: comp.order + 1 }
            });
          }
          newOrder = targetOrder + 1;
        }
      }

      // 소스 컴포넌트의 order 업데이트
      await tx.component_grid.update({
        where: {
          pipeline_id_component_id: {
            pipeline_id: BigInt(pipelineId),
            component_id: sourceComponentId
          }
        },
        data: { order: newOrder }
      });
    });

    return { success: true };
  } catch (error) {
    console.error('ComponentGrid 순서 조정 실패:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '순서 조정 중 오류가 발생했습니다.' 
    };
  }
}

// /**
//  * 파이프라인별로 다음 사용 가능한 Component ID 가져오기
//  */
// async function getNextComponentIdInTransaction(tx: any, pipelineId: number): Promise<number> {
//   const lastComponent = await tx.component_grid.findFirst({
//     where: { pipeline_id: BigInt(pipelineId) },
//     orderBy: { component_id: 'desc' }
//   });
  
//   return (lastComponent?.component_id || 0) + 1;
// }
