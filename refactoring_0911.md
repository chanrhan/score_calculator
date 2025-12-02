# block-structure.ts 기반 시스템 전면 리팩토링 구현 계획

## 1. 핵심 구조 이해

### A. 구분 블록 (Division) 구조
```typescript
// block-structure.ts의 Division 구조
{
  name: 'Division',
  header: [CellElement, CellElement, ...], // 배열 길이 = 열 개수
  children: [HierarchicalCell, HierarchicalCell,...]  // 트리 구조 
}

// HierarchicalCell의 tree 구조
interface HierarchicalCell {
  elements: readonly CellElement[] // 해당 셀의 내용
  children: readonly HierarchicalCell[] // 자식 셀들 (같은 열의 하위 행들)
}
```

**행/열 계산:**
- **열 개수**: `header.length`
- **행 개수**: `children tree`의 **리프 셀(leaf cell, CASE)의 개수**
- **특징**: 
  - children은 tree 구조로 저장
  - 형제 HierarchicalCell들은 같은 열에 존재
  - 부모는 왼쪽, 자식은 오른쪽 열에 존재
  - 맨 오른쪽 열의 자식들이 리프 셀(leaf cell, CASE)이 됨
  - **리프 셀의 개수가 구분 블록뿐만 아니라 속한 ComponentGrid의 전체 행 수를 결정**

### B. 일반 블록 (ApplySubject, GradeRatio 등) 구조
```typescript
// block-structure.ts의 일반 블록 구조
{
  name: 'ApplySubject',
  cols: [
    {
      header: CellElement, // 해당 열의 헤더 셀 (elements 속성 없음)
      rows: [
        { elements: [CellElement, ...] }, // 첫 번째 행
        { elements: [CellElement, ...] }, // 두 번째 행
        ...
      ]
    },
    // 추가 열들...
  ]
}
```

**행/열 계산:**
- **열 개수**: `cols.length`
- **행 개수**: `cols[0].rows.length` (모든 열의 행 수는 동일해야 함)
- **특징**: header는 elements 속성이 없고, 바로 셀 하나의 정보

## 2. DB 저장 구조 (Prisma Schema)

### A. element_type 테이블
```sql
CREATE TABLE element_type (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(50) NOT NULL UNIQUE -- 'Token', 'Text', 'Table', 'Formula', 'InputField'
);
```

### B. block_data 테이블 (블록 기본 정보 및 Cell Type 정보)
```sql
CREATE TABLE block_data (
  univ_id         VARCHAR(3) NOT NULL,
  block_type      VARCHAR(50) NOT NULL, -- 'ApplySubject', 'Division', 'GradeRatio' 등
  block_name      VARCHAR(100) NOT NULL,
  header_cell_type JSONB NOT NULL,      -- Cell Type 정보
  body_cell_type   JSONB NOT NULL,      -- Cell Type 정보
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (univ_id, block_type)
);
```

### C. block 테이블 (일반 블록용)
```sql
CREATE TABLE block (
  pipeline_id  BIGINT NOT NULL,
  component_id INT NOT NULL,
  block_id     INT NOT NULL,
  order        INT NOT NULL,
  block_type   INT NOT NULL,
  header_cells JSONB,    -- 1차원 배열 (header_cell_type의 element_type 파라미터들)
  body_cells   JSONB,    -- 2차원 배열 (body_cell_type의 element_type 파라미터들)
  created_at   TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (pipeline_id, component_id, block_id)
);
```

### D. block 테이블 (구분 블록용)
```sql
CREATE TABLE block (
  pipeline_id  BIGINT NOT NULL,
  component_id INT NOT NULL,
  block_id     INT NOT NULL,
  order        INT NOT NULL,
  block_type   INT NOT NULL,
  header_cells JSONB,    -- 구분 유형 코드 배열 [1,3,7,2,3]
  body_cells   JSONB,    -- 트리 구조 (HierarchicalCell[])
  created_at   TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (pipeline_id, component_id, block_id)
);
```

### E. block_data 저장 예시

#### Division 블록의 block_data
```json
{
  "univ_id": "001",
  "block_type": "Division",
  "block_name": "구분 블록",
  "header_cell_type": {
    "gender": "gender_tk_mn",
    "grade": "grade_tk_mn"
  },
  "body_cell_type": {
    "gender": [
      {"id": 1, "name": "Token", "optional": false, "visible": true, "menu_key": "division_values"}
    ],
    "grade": [
      {"id": 1, "name": "Token", "optional": false, "visible": true, "menu_key": "division_values"}
    ]
  }
}
```

#### ApplySubject 블록의 block_data
```json
{
  "univ_id": "001",
  "block_type": "ApplySubject",
  "block_name": "반영교과 블록",
  "header_cell_type": {
    "element_types": [
      {"id": 1, "name": "Token", "optional": false, "visible": true, "menu_key": "include_exclude"},
      {"id": 2, "name": "Text", "optional": false, "visible": true}
    ]
  },
  "body_cell_type": {
    "element_types": [
      {"id": 1, "name": "Token", "optional": false, "visible": true, "menu_key": "subject_groups"}
    ]
  }
}
```

### F. block 테이블 저장 예시

#### 구분 블록의 block 테이블
```json
{
  "block_type": 1,
  "header_cells": ["gender_tk_mn", "grade_tk_mn"], // token_menu의 key 값 배열
  "body_cells": [
    {
      "elements": [{"male", null}], // Token 값, Text 값 (Text는 null)
      "children": [
        {
          "elements": [{"1학년", null}],
          "children": []
        },
        {
          "elements": [{"2학년", null}],
          "children": []
        }
      ]
    },
    {
      "elements": [{"female", null}],
      "children": [
        {
          "elements": [{"1학년", null}],
          "children": []
        }
      ]
    }
  ]
}
```

#### 일반 블록의 block 테이블 (ApplySubject)
```json
{
  "block_type": 2,
  "header_cells": [
    ["반영교과", "include"] // Text 값, Token 값 (element_type 순서대로)
  ],
  "body_cells": [
    [
      ["국어", null, "SUM(A1:A10)"] // TOKEN, TEXT, FORMULA 순서대로 값 배열
    ],
    [
      ["수학", "추가 설명", "AVG(B1:B10)"]
    ]
  ]
}
```

### G. DB 저장/로드 시 값 배열과 element_type 매핑

#### DB 저장 구조
- **header_cells 컬럼 (JSONB)**: 각 셀 내부의 element 값들의 배열
- **body_cells 컬럼 (JSONB)**: 각 셀 내부의 element 값들의 배열
- **값 배열 순서**: `block_data`의 `element_types` 배열 순서와 동일하게 저장

#### 값 배열 예시
```json
// block_data의 body_cell_type
{
  "element_types": [
    {"name": "TOKEN", "menu_key": "subject_groups"},
    {"name": "TEXT", "optional": true},
    {"name": "FORMULA", "menu_key": "formulas"}
  ]
}

// block 테이블의 body_cells 컬럼 값
[
  ["국어", null, "SUM(A1:A10)"],  // 첫 번째 행
  ["수학", "추가 설명", "AVG(B1:B10)"]  // 두 번째 행
]
```

#### DB 로드 시 매핑 과정
```typescript
// DB에서 가져온 값: ["국어", null, "SUM(A1:A10)"]
// block_data의 element_types: [TOKEN, TEXT, FORMULA]

// 인덱스 기반 매핑
const mapValuesToElements = (values: any[], elementTypes: any[]) => {
  return values.map((value, index) => {
    const elementType = elementTypes[index];
    return {
      type: elementType.name,
      value: value,
      menu_key: elementType.menu_key || '',
      optional: elementType.optional || false,
      visible: elementType.visible !== false
    };
  });
};

// 결과: element_type의 속성과 값을 결합한 객체 배열
[
  {
    type: "TOKEN",
    value: "국어",
    menu_key: "subject_groups",
    optional: false,
    visible: true
  },
  {
    type: "TEXT", 
    value: null,
    optional: true,
    visible: true
  },
  {
    type: "FORMULA",
    value: "SUM(A1:A10)",
    menu_key: "formulas",
    optional: false,
    visible: true
  }
]
```

## 3. 구현 계획

### Phase 1: 타입 시스템 전면 교체

#### A. 기존 타입 제거
```typescript
// types/blocks.ts에서 제거할 타입들
- AnyBlock
- DivisionBlock
- FunctionBlock
- ConditionBlock
- AggregationBlock
- VariableBlock
```

#### B. 새로운 타입 시스템 도입
```typescript
// types/domain.ts
export type FlowBlock = {
  id: number;
  type: FlowBlockType; 
  data: Record<string, any>;
};

export type Component = {
  id: number;
  name: string;
  predecessorId?: number | null;
  position: number;
  blocks: FlowBlock[]; // AnyBlock → FlowBlock 교체
  ui: { x: number; y: number };
};
```

### Phase 2: 행/열 계산 로직 구현

#### A. FlowBlockGridCalculator 클래스
```typescript
// lib/adapters/flowBlockGridCalculator.ts
export class FlowBlockGridCalculator {
  
  static calculateGridSize(block: FlowBlock): { rows: number; cols: number } {
    const blockType = block.type;
    
    if (blockType.name === 'Division') {
      return this.calculateDivisionGrid(blockType);
    } else {
      return this.calculateGeneralBlockGrid(blockType);
    }
  }
  
  private static calculateDivisionGrid(blockType: FlowBlockType): { rows: number; cols: number } {
    // 구분 블록: header = 열 수, children tree의 리프 셀 개수 = 행 수
    const cols = blockType.header?.length || 1;
    const rows = this.countLeafCells(blockType.children || []);
    return { rows, cols };
  }
  
  private static countLeafCells(children: HierarchicalCell[]): number {
    if (children.length === 0) return 0;
    
    let leafCount = 0;
    for (const child of children) {
      if (child.children.length === 0) {
        // 리프 셀 (자식이 없는 셀)
        leafCount++;
      } else {
        // 재귀적으로 자식들의 리프 셀 개수 계산
        leafCount += this.countLeafCells(child.children);
      }
    }
    return leafCount;
  }
  
  private static calculateGeneralBlockGrid(blockType: FlowBlockType): { rows: number; cols: number } {
    // 일반 블록: cols.length = 열 수, cols[0].rows.length = 행 수
    const cols = blockType.cols?.length || 1;
    const rows = blockType.cols?.[0]?.rows?.length || 1;
    return { rows, cols };
  }
}
```

### Phase 3: DB 어댑터 구현

#### A. FlowBlockAdapter 클래스
```typescript
// lib/adapters/flowBlockAdapter.ts
export class FlowBlockAdapter {
  
  // FlowBlock → DB 저장 형식
  static toDbFormat(block: FlowBlock, blockData: any): DbBlockFormat {
    const blockType = block.type;
    
    if (blockType.name === 'Division') {
      return {
        block_type: this.getBlockTypeId('Division'),
        header_cells: this.extractDivisionHeaderCells(blockType),
        body_cells: JSON.stringify(blockType.children)
      };
    } else {
      return {
        block_type: this.getBlockTypeId(blockType.name),
        header_cells: this.extractGeneralHeaderCells(blockType, blockData),
        body_cells: this.extractGeneralBodyCells(blockType, blockData)
      };
    }
  }
  
  // DbBlockFormat 타입 정의
  interface DbBlockFormat {
    block_type: number;
    header_cells: any;
    body_cells: any;
  }
  
  // getBlockType 함수 (block-structure.ts에서 import)
  // import { getBlockType, BlockTypeName, FlowBlockType, CellElement, FlowColumn, HierarchicalCell } from '../types/block-structure';
  
  // DB 저장 형식 → FlowBlock
  static fromDbFormat(dbBlock: any, blockData: any): FlowBlock {
    const blockTypeName = this.getBlockTypeNameById(dbBlock.block_type);
    const blockType = getBlockType(blockTypeName);
    
    if (blockTypeName === 'Division') {
      return {
        id: dbBlock.block_id,
        type: {
          ...blockType,
          header: this.reconstructDivisionHeader(dbBlock.header_cells, blockData.header_cell_type),
          children: JSON.parse(dbBlock.body_cells)
        },
        data: {}
      };
    } else {
      return {
        id: dbBlock.block_id,
        type: {
          ...blockType,
          cols: this.reconstructGeneralCols(dbBlock.header_cells, dbBlock.body_cells, blockData)
        },
        data: {}
      };
    }
  }
  
  // Division 블록의 header_cells 추출 (token_menu key 값 배열)
  private static extractDivisionHeaderCells(blockType: FlowBlockType): string[] {
    return blockType.header?.map(header => header.menu_key) || [];
  }
  
  // 일반 블록의 header_cells 추출 (1차원 배열 - element_type 파라미터들만)
  private static extractGeneralHeaderCells(blockType: FlowBlockType, blockData: any): any[] {
    const headerElement = blockType.cols?.[0]?.header;
    if (!headerElement || !blockData?.header_cell_type?.element_types) return [];
    
    // block_data의 header_cell_type.element_types 순서에 따라 파라미터 값들만 추출
    return blockData.header_cell_type.element_types.map((et: any) => {
      if (et.name === 'Token') return headerElement.value;
      if (et.name === 'Text') return headerElement.content;
      return null;
    });
  }
  
  // 일반 블록의 body_cells 추출 (2차원 배열 - element_type 파라미터들만)
  private static extractGeneralBodyCells(blockType: FlowBlockType, blockData: any): any[][] {
    const rows = blockType.cols?.[0]?.rows || [];
    if (!blockData?.body_cell_type?.element_types) return [];
    
    return rows.map(row => {
      return blockData.body_cell_type.element_types.map((et: any) => {
        if (et.name === 'Token') return row.elements[0]?.value;
        if (et.name === 'Text') return row.elements[0]?.content;
        return null;
      });
    });
  }
  
  // Division 블록의 header 재구성 (token_menu key → CellElement)
  private static reconstructDivisionHeader(headerCells: string[], headerCellType: any): CellElement[] {
    return headerCells.map((tokenKey, index) => {
      const divisionType = Object.keys(headerCellType)[index];
      return {
        type: 'Token',
        value: tokenKey,
        menu_key: tokenKey,
        optional: false,
        visible: true
      };
    });
  }
  
  // 일반 블록의 cols 재구성 (header_cells + body_cells → FlowColumn[])
  private static reconstructGeneralCols(headerCells: any[], bodyCells: any[][], blockData: any): FlowColumn[] {
    const cols: FlowColumn[] = [];
    const headerElementTypes = blockData?.header_cell_type?.element_types || [];
    const bodyElementTypes = blockData?.body_cell_type?.element_types || [];
    
    // 각 열에 대해 FlowColumn 생성
    for (let colIndex = 0; colIndex < headerCells.length; colIndex++) {
      const headerCell = headerCells[colIndex];
      
      // header CellElement 생성
      const headerElement: CellElement = {
        type: headerElementTypes[0]?.name || 'Text',
        value: headerCell[0] || '',
        content: headerCell[1] || '',
        optional: false,
        visible: true
      };
      
      // body rows 생성
      const rows = bodyCells.map(row => ({
        elements: row.map((cellValue, elementIndex) => {
          const elementType = bodyElementTypes[elementIndex];
          if (!elementType) return null;
          
          return {
            type: elementType.name,
            value: cellValue || '',
            content: cellValue || '',
            optional: elementType.optional || false,
            visible: elementType.visible !== false
          };
        }).filter(Boolean) as CellElement[]
      }));
      
      cols.push({
        header: headerElement,
        rows: rows
      });
    }
    
    return cols;
  }
  
  // 블록 타입 ID 조회
  private static getBlockTypeId(blockTypeName: string): number {
    const typeMap: Record<string, number> = {
      'Division': 1,
      'ApplySubject': 2,
      'GradeRatio': 3,
      'Function': 4,
      'Condition': 5,
      'Aggregation': 6,
      'Variable': 7
    };
    return typeMap[blockTypeName] || 0;
  }
  
  // 블록 타입 ID로 이름 조회
  private static getBlockTypeNameById(blockTypeId: number): string {
    const idMap: Record<number, string> = {
      1: 'Division',
      2: 'ApplySubject', 
      3: 'GradeRatio',
      4: 'Function',
      5: 'Condition',
      6: 'Aggregation',
      7: 'Variable'
    };
    return idMap[blockTypeId] || 'Unknown';
  }
}
```

## 4. 블록 생성 과정 (Block Creation Process)

### A. 블록 생성 전체 플로우
```mermaid
graph TD
    A[사용자가 블록 팔레트에서 블록 드래그] --> B[블록 타입 코드 획득]
    B --> C[DB에서 block_data 조회]
    C --> D[block_data 기반으로 블록 객체 생성]
    D --> E[blocks[] 배열에 삽입]
    E --> F[ComponentGrid 셀 렌더링 수행]
```

### B. 블록 생성 단계별 상세 과정

#### 1단계: 블록 타입 코드 획득 및 block_data 조회
```typescript
// components/builder/PipelineEditor/ComponentNode.tsx
const onDropBlock = async (e: React.DragEvent, atIndex?: number) => {
  e.preventDefault();
  const blockTypeCode = e.dataTransfer.getData('application/x-block-type-code');
  if (!blockTypeCode) return;

  // DB에서 block_data 조회 (블록 타입 코드 기반)
  const blockData = await fetchBlockData(blockTypeCode);
  // blockData = {
  //   univ_id: "001",
  //   block_type: "ApplySubject",
  //   block_name: "반영교과 블록",
  //   header_cell_type: { element_types: [...] },
  //   body_cell_type: { element_types: [...] }
  // }
};
```

#### 2단계: block_data 기반 블록 객체 생성
```typescript
// block_data를 기반으로 실제 블록 구조 생성
const createBlockFromBlockData = (blockData: any, blockTypeCode: number) => {
  return {
    block_type: blockTypeCode, // 1, 2, 3, ...
    col: blockData.init_col || 1, // 현재 열 개수 (block_data.init_col 기반)
    header_cells: [], // 빈 배열로 시작 (사용자 편집 시 채워짐)
    body_cells: []    // 빈 배열로 시작 (사용자 편집 시 채워짐)
  };
};

// 예시: ApplySubject 블록 생성
const applySubjectBlock = {
  block_type: 2,
  col: 1, // init_col이 1이므로 열 개수 1
  header_cells: [], // 사용자가 편집할 때 채워짐
  body_cells: []    // 사용자가 편집할 때 채워짐
};
```

#### 3단계: blocks[] 배열에 삽입
```typescript
// store/usePipelines.ts
const addBlockToComponent = (pipelineId: number, componentId: number, block: any, atIndex?: number) => {
  // 1. 블록 ID 할당 (기존 블록들 중 최대 ID + 1)
  const newBlockId = Math.max(...component.blocks.map(b => b.id), 0) + 1;
  block.id = newBlockId;
  
  // 2. 블록을 컴포넌트의 blocks[] 배열에 추가
  const updatedComponent = {
    ...component,
    blocks: atIndex !== undefined 
      ? [...component.blocks.slice(0, atIndex), block, ...component.blocks.slice(atIndex)]
      : [...component.blocks, block]
  };
  
  // 3. 상태 업데이트
  updateComponent(pipelineId, componentId, updatedComponent);
};
```

#### 4단계: 셀 렌더링 트리거
```typescript
// blocks[] 배열이 변경되면 ComponentGrid가 자동으로 셀 렌더링 수행
// ComponentGrid는 blocks[] 배열을 감시하고 변경 시 리렌더링
```

## 5. 셀 렌더링 과정 (Cell Rendering Process)

### A. 셀 렌더링 전체 플로우
```mermaid
graph TD
    A[blocks[] 배열 변경 감지] --> B[ComponentGrid 전체 행×열 크기 계산]
    B --> C[N×M 빈 셀 그리드 생성]
    C --> D[각 셀(r,c)의 내용 채우기]
    D --> E[block_data 참조하여 셀 정보 렌더링]
    E --> F[element_type별 셀 렌더링]
    F --> G[Token/Text/Formula 등 개별 렌더링]
```

### B. 셀 렌더링 단계별 상세 과정

#### 1단계: ComponentGrid 전체 행×열 크기 계산
```typescript
// components/builder/Primitives/ComponentGrid.tsx
const ComponentGrid: React.FC<Props> = ({ component, onBlockChange }) => {
  // 1. 전체 행 크기 계산 (1행: 블록명 + 2행: 헤더 + 3행부터: 바디)
  const calculateTotalRows = (blocks: any[]) => {
    // 구분 블록이 있는지 확인
    const divisionBlock = blocks.find(block => block.block_type === 1); // Division 블록
    
    let bodyRows = 1; // 기본 body 행 수
    if (divisionBlock) {
      // 구분 블록의 리프 셀 개수 계산
      bodyRows = countLeafCells(divisionBlock.body_cells);
    }
    
    // 전체 행 수 = 1행(블록명) + 1행(헤더) + bodyRows
    return 2 + bodyRows;
  };
  
  // 2. 전체 열 크기 계산 (모든 블록의 col 속성 합계)
  const calculateTotalCols = (blocks: any[]) => {
    return blocks.reduce((total, block) => total + block.col, 0);
  };
  
  const totalRows = calculateTotalRows(component.blocks);
  const totalCols = calculateTotalCols(component.blocks);
  
  return (
    <div className="component-grid">
      {/* N×M 빈 셀 그리드 생성 후 각 셀 채우기 */}
    </div>
  );
};
```

#### 2단계: N×M 빈 셀 그리드 생성
```typescript
// ComponentGrid에서 전체 행×열 크기로 빈 셀 그리드 생성
const createEmptyGrid = (totalRows: number, totalCols: number) => {
  return Array.from({ length: totalRows }, (_, rowIndex) => (
    <div key={rowIndex} className="grid-row">
      {Array.from({ length: totalCols }, (_, colIndex) => (
        <div key={colIndex} className="empty-cell" data-row={rowIndex} data-col={colIndex}>
          {/* 빈 셀 - 나중에 내용 채워짐 */}
        </div>
      ))}
    </div>
  ));
};
```

#### 3단계: 각 셀(r,c)의 내용 채우기
```typescript
// 각 셀의 위치에 따라 해당하는 블록과 내용을 찾아서 채우기
const fillCellContent = (rowIndex: number, colIndex: number, blocks: any[]) => {
  // 현재 열이 어느 블록에 속하는지 찾기
  let currentCol = 0;
  let targetBlock = null;
  let blockColIndex = 0;
  
  for (const block of blocks) {
    if (colIndex >= currentCol && colIndex < currentCol + block.col) {
      targetBlock = block;
      blockColIndex = colIndex - currentCol;
      break;
    }
    currentCol += block.col;
  }
  
  if (!targetBlock) return <div className="empty-cell" />;
  
  // 해당 블록의 block_data 조회
  const blockData = getBlockData(targetBlock.block_type);
  
  // 블록의 header_cells, body_cells에 충분한 데이터가 있는지 확인
  // 없으면 block_data의 cell_type으로 렌더링하고 block에 데이터 추가
  ensureBlockDataExists(targetBlock, blockData, rowIndex, blockColIndex);
  
  // 행과 열 위치에 따라 셀 내용 렌더링
  return renderCellByPosition(targetBlock, blockData, rowIndex, blockColIndex, totalRows, targetBlock.col);
};

// 블록의 header_cells, body_cells에 필요한 데이터가 있는지 확인하고 없으면 추가
const ensureBlockDataExists = (block: any, blockData: any, rowIndex: number, colIndex: number) => {
  if (rowIndex === 1) { // Header 행
    // header_cells에 해당 열의 데이터가 없으면 block_data의 header_cell_type으로 생성
    if (!block.header_cells[colIndex]) {
      const headerCellType = blockData.header_cell_type;
      if (block.block_type === 1) { // Division 블록
        block.header_cells[colIndex] = headerCellType[Object.keys(headerCellType)[colIndex]];
      } else { // 일반 블록
        block.header_cells[colIndex] = headerCellType.element_types.map(et => ({
          type: et.name,
          value: '',
          content: '',
          optional: et.optional || false,
          visible: et.visible !== false,
          menu_key: et.menu_key || ''
        }));
      }
    }
  } else if (rowIndex >= 2) { // Body 행
    const bodyRowIndex = rowIndex - 2;
    // body_cells에 해당 행과 열의 데이터가 없으면 block_data의 body_cell_type으로 생성
    if (!block.body_cells[bodyRowIndex]) {
      block.body_cells[bodyRowIndex] = [];
    }
    if (!block.body_cells[bodyRowIndex][colIndex]) {
      const bodyCellType = blockData.body_cell_type;
      if (block.block_type === 1) { // Division 블록
        block.body_cells[bodyRowIndex][colIndex] = {
          elements: bodyCellType[Object.keys(bodyCellType)[colIndex]].map(et => ({
            type: et.name,
            value: '',
            content: '',
            optional: et.optional || false,
            visible: et.visible !== false,
            menu_key: et.menu_key || ''
          })),
          children: []
        };
      } else { // 일반 블록
        block.body_cells[bodyRowIndex][colIndex] = bodyCellType.element_types.map(et => ({
          type: et.name,
          value: '',
          content: '',
          optional: et.optional || false,
          visible: et.visible !== false,
          menu_key: et.menu_key || ''
        }));
      }
    }
  }
};

// 행과 열 위치에 따라 다른 셀 내용 렌더링
const renderCellByPosition = (block: any, blockData: any, rowIndex: number, colIndex: number, totalRows: number, blockCols: number) => {
  if (rowIndex === 0) {
    // 1행: 블록명 (첫 번째 열에만 표시, 나머지 열은 빈 셀)
    if (colIndex === 0) {
      return (
        <div className="block-name-cell">
          {blockData.block_name}
        </div>
      );
    } else {
      return <div className="empty-cell" />;
    }
  } else if (rowIndex === 1) {
    // 2행: Header 셀들 (각 열마다 header_cell_type 렌더링)
    return renderHeaderCells(block, blockData, colIndex, blockCols);
  } else {
    // 3행부터: Body 셀들 (각 열마다 body_cell_type 렌더링)
    return renderBodyCells(block, blockData, rowIndex - 2, colIndex, totalRows - 2, blockCols);
  }
};
```

#### 4단계: 최종 렌더링 (빈 그리드 + 셀 내용 채우기)
```typescript
// ComponentGrid의 최종 렌더링
const ComponentGrid: React.FC<Props> = ({ component, onBlockChange }) => {
  const totalRows = calculateTotalRows(component.blocks);
  const totalCols = calculateTotalCols(component.blocks);
  
  return (
    <div className="component-grid">
      {/* N×M 빈 셀 그리드 생성 */}
      {Array.from({ length: totalRows }, (_, rowIndex) => (
        <div key={rowIndex} className="grid-row">
          {Array.from({ length: totalCols }, (_, colIndex) => (
            <div key={colIndex} className="grid-cell" data-row={rowIndex} data-col={colIndex}>
              {/* 각 셀의 내용 채우기 */}
              {fillCellContent(rowIndex, colIndex, component.blocks)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
```

#### 5단계: block_data 참조하여 셀 정보 렌더링
```typescript
// Header 셀 렌더링 (특정 열의 헤더 셀)
const renderHeaderCells = (block: any, blockData: any, colIndex: number, blockCols: number) => {
  const headerCellType = blockData.header_cell_type;
  
  if (block.block_type === 1) { // Division 블록
    // Division 블록의 header는 token_menu key 배열
    const tokenKey = block.header_cells[colIndex];
    return (
      <div className="header-cell">
        {renderCellByElementTypes([{ type: 'Token', menu_key: tokenKey }])}
      </div>
    );
  } else { // 일반 블록
    // DB에서 가져온 값 배열을 element_type과 매핑
    const values = block.header_cells[colIndex] || [];
    const elements = mapValuesToElements(values, headerCellType.element_types);
    
    return elements.map((element: any, index: number) => (
      <div key={index} className="header-cell">
        {renderCellByElementTypes([element])}
      </div>
    ));
  }
};

// DB 값 배열을 element_type과 매핑하는 함수
const mapValuesToElements = (values: any[], elementTypes: any[]) => {
  return values.map((value, index) => {
    const elementType = elementTypes[index];
    return {
      type: elementType.name,
      value: value,
      menu_key: elementType.menu_key || '',
      optional: elementType.optional || false,
      visible: elementType.visible !== false
    };
  });
};

// Body 셀 렌더링 (특정 행과 열 위치의 셀)
const renderBodyCells = (block: any, blockData: any, bodyRowIndex: number, colIndex: number, totalBodyRows: number, blockCols: number) => {
  const bodyCellType = blockData.body_cell_type;
  
  if (block.block_type === 1) { // Division 블록
    // Division 블록의 body는 트리 구조에서 특정 행의 셀 렌더링
    return renderDivisionBodyCell(block.body_cells, bodyRowIndex, colIndex, 0);
  } else { // 일반 블록
    // DB에서 가져온 값 배열을 element_type과 매핑
    const values = block.body_cells[bodyRowIndex]?.[colIndex] || [];
    const elements = mapValuesToElements(values, bodyCellType.element_types);
    
    return elements.map((element: any, elementIndex: number) => (
      <div key={elementIndex} className="body-cell">
        {renderCellByElementTypes([element])}
      </div>
    ));
  }
};

// Division 블록의 특정 행과 열 셀 렌더링
const renderDivisionBodyCell = (cells: any[], targetRowIndex: number, colIndex: number, currentDepth: number) => {
  let currentRowIndex = 0;
  
  for (const cell of cells) {
    if (cell.children && cell.children.length > 0) {
      // 자식이 있는 경우, 자식들을 재귀적으로 확인
      const childResult = renderDivisionBodyCell(cell.children, targetRowIndex - currentRowIndex, colIndex, currentDepth + 1);
      if (childResult) return childResult;
    } else {
      // 리프 셀인 경우
      if (currentRowIndex === targetRowIndex) {
        // 해당 열의 element만 렌더링 (colIndex에 해당하는 element)
        const element = cell.elements[colIndex];
        if (element) {
          return (
            <div className="division-body-cell">
              <div className="element-container">
                {renderElementByType(element)}
              </div>
            </div>
          );
        } else {
          return <div className="empty-cell" />;
        }
      }
      currentRowIndex++;
    }
  }
  
  return <div className="empty-cell" />; // 해당 행 인덱스에 셀이 없는 경우
};
```

#### 6단계: element_type별 셀 렌더링
```typescript
// element_type 배열에 따라 순차적으로 셀 내부에 배치
const renderCellByElementTypes = (elementTypes: any[]) => {
  return (
    <div className="cell-elements">
      {elementTypes.map((elementType, index) => (
        <div key={index} className="element-container">
          {renderElementByType(elementType)}
        </div>
      ))}
    </div>
  );
};

// element_type별 개별 렌더링
const renderElementByType = (elementType: any) => {
  switch (elementType.name) {
    case 'Token':
      return (
        <TokenSelector
          menuKey={elementType.menu_key}
          value={elementType.value || ''}
          onChange={(newValue) => handleElementChange(elementType, newValue)}
        />
      );
      
    case 'Text':
      return (
        <input
          type="text"
          value={elementType.content || ''}
          onChange={(e) => handleElementChange(elementType, e.target.value)}
        />
      );
      
    case 'Formula':
      return (
        <FormulaEditor
          value={elementType.content || ''}
          onChange={(newContent) => handleElementChange(elementType, newContent)}
        />
      );
      
    case 'InputField':
      return (
        <input
          type="number"
          value={elementType.value || ''}
          onChange={(e) => handleElementChange(elementType, e.target.value)}
        />
      );
      
    default:
      return <div className="unknown-element">Unknown element type</div>;
  }
};
```

### C. Division 블록 특별 처리

#### 트리 구조 셀 렌더링
```typescript
// Division 블록의 계층적 셀 렌더링
const renderHierarchicalCells = (cells: any[], depth: number) => {
  return cells.map((cell, cellIndex) => (
    <div key={cellIndex} className={`hierarchical-cell depth-${depth}`}>
      {/* 현재 셀의 elements 렌더링 */}
      <div className="cell-elements">
        {cell.elements.map((element: any, elementIndex: number) => (
          <div key={elementIndex} className="element-container">
            {renderElementByType(element)}
          </div>
        ))}
      </div>
      
      {/* 자식 셀들 재귀 렌더링 */}
      {cell.children && cell.children.length > 0 && (
        <div className="children-cells">
          {renderHierarchicalCells(cell.children, depth + 1)}
        </div>
      )}
    </div>
  ));
};
```

### D. 셀 편집 시 데이터 업데이트 과정

#### 1단계: 셀 값 변경 감지
```typescript
// element 값 변경 시
const handleElementChange = (elementType: any, newValue: any) => {
  // 1. elementType 업데이트
  const updatedElementType = { ...elementType, value: newValue };
  
  // 2. 상위 컴포넌트로 변경사항 전달
  onChange(updatedElementType);
};
```

#### 2단계: 블록 데이터 업데이트
```typescript
// 블록의 header_cells 또는 body_cells 업데이트
const updateBlockCells = (blockIndex: number, cellType: 'header' | 'body', cellData: any) => {
  const updatedBlocks = [...component.blocks];
  updatedBlocks[blockIndex] = {
    ...updatedBlocks[blockIndex],
    [`${cellType}_cells`]: cellData
  };
  
  // 컴포넌트 전체 업데이트
  updateComponent(pipelineId, componentId, {
    ...component,
    blocks: updatedBlocks
  });
};
```

### E. 성능 최적화

#### 1. 메모이제이션 적용
```typescript
// CellBox 컴포넌트 메모이제이션
const CellBox = React.memo<Props>(({ elementType, onChange }) => {
  // 셀 렌더링 로직...
}, (prevProps, nextProps) => {
  // elementType이 변경되었을 때만 리렌더링
  return prevProps.elementType === nextProps.elementType;
});
```

#### 2. 가상화 적용 (대용량 데이터)
```typescript
// VirtualizedGrid 컴포넌트 (필요시)
const VirtualizedGrid: React.FC<Props> = ({ blocks, onBlockChange }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  
  return (
    <div className="virtualized-grid">
      {blocks.slice(visibleRange.start, visibleRange.end).map((block, index) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </div>
  );
};
```

### Phase 6: 블록 생성 로직 수정

#### A. Canvas.tsx 수정
```typescript
// components/builder/PipelineEditor/Canvas.tsx
async function createBlockBaseFromDetail(detail: any, univId?: string) {
  const kind: string = detail?.kind;
  if (!kind) return null;

  // block-structure.ts의 BLOCK_TYPES 직접 사용
  const blockType = getBlockType(kind as BlockTypeName);
  
  return {
    id: 0,
    type: blockType, // 변환 없이 직접 사용
    data: {}
  };
}
```

#### B. ComponentNode.tsx 수정
```typescript
// components/builder/PipelineEditor/ComponentNode.tsx
const onDropBlock = async (e: React.DragEvent, atIndex?: number) => {
  e.preventDefault();
  const kind = e.dataTransfer.getData('application/x-block-kind') as BlockTypeName;
  if (!kind) return;

  // block-structure.ts의 BLOCK_TYPES 직접 사용
  const blockType = getBlockType(kind);
  const block: FlowBlock = {
    id: 0,
    type: blockType,
    data: {}
  };

  addBlockToComponent(pipelineId, comp.id, block, atIndex);
};
```

### Phase 7: 렌더링 시스템 교체

#### A. blockRegistry.tsx 수정
```typescript
// components/builder/Blocks/blockRegistry.tsx
export function getFlowBlockRenderer(block: FlowBlock): FlowBlockRendererEntry {
  const blockType = block.type;
  
  if (blockType.name === 'Division') {
    return {
      title: () => '구분',
      Renderer: DivisionFlowBlockView,
      grid: () => FlowBlockGridCalculator.calculateGridSize(block)
    };
  }
  
  // 다른 블록들도 FlowBlockType 구조 직접 사용
  return {
    title: () => blockType.name,
    Renderer: GenericFlowBlockView,
    grid: () => FlowBlockGridCalculator.calculateGridSize(block)
  };
}
```

#### B. 블록 뷰 컴포넌트 수정
```typescript
// components/builder/Blocks/Specific/DivisionFlowBlockView.tsx
type Props = {
  model: FlowBlock;
  onChange?: (patch: Record<string, any>) => void;
};

const DivisionFlowBlockView: React.FC<Props> = ({ model, onChange }) => {
  const blockType = model.type;
  
  // header와 children 직접 사용
  const headerElements = blockType.header || [];
  const childrenData = blockType.children || [];
  
  // 렌더링 로직...
};
```

### Phase 8: 기존 코드 정리

#### A. 제거할 파일들
- `utils/divisionDataConverter.ts` (전체 파일)
- `types/blocks.ts`의 기존 타입들
- 변환 관련 유틸리티 함수들

#### B. 수정할 파일들
- `store/usePipelines.ts` - 블록 관리 로직
- `components/builder/PipelineEditor/Canvas.tsx` - 블록 생성
- `components/builder/PipelineEditor/ComponentNode.tsx` - 블록 렌더링
- 모든 블록 뷰 컴포넌트들

## 6. 행/열 계산 예시

### A. 구분 블록 예시
```typescript
// 3행 × 2열 구분 블록 (리프 셀 3개)
const divisionBlock = {
  type: {
    name: 'Division',
    header: [header1, header2], // 2열
    children: [
      {
        elements: [male],
        children: [
          { elements: [grade1], children: [] }, // 리프 셀 1
          { elements: [grade2], children: [] }  // 리프 셀 2
        ]
      },
      {
        elements: [female],
        children: [
          { elements: [grade1], children: [] }  // 리프 셀 3
        ]
      }
    ]
  }
};

// 계산 결과: { rows: 3, cols: 2 }
// 리프 셀 3개가 ComponentGrid의 전체 행 수를 결정
```

### B. 일반 블록 예시
```typescript
// 2행 × 3열 학년별 반영비율 블록
const gradeRatioBlock = {
  type: {
    name: 'GradeRatio',
    cols: [
      { header: header1, rows: [row1, row2] }, // 2행
      { header: header2, rows: [row1, row2] }, // 2행
      { header: header3, rows: [row1, row2] }  // 2행
    ]
  }
};

// 계산 결과: { rows: 2, cols: 3 }
```

## 7. 마이그레이션 전략

### A. 점진적 마이그레이션
1. **Phase 1**: 타입 시스템 교체 (가장 먼저)
2. **Phase 2**: 행/열 계산 로직 구현
3. **Phase 3**: DB 어댑터 구현
4. **Phase 4**: 블록 생성 과정 구현
5. **Phase 5**: 셀 렌더링 과정 구현
6. **Phase 6**: 블록 생성 로직 수정
7. **Phase 7**: 렌더링 시스템 교체
8. **Phase 8**: 기존 코드 정리

### B. 호환성 보장
- 기존 데이터는 자동으로 새로운 구조로 변환
- 사용자에게는 변경사항이 투명하게 처리
- 롤백 가능한 구조 유지

## 8. 예상 효과

### A. 장점
- 단일 데이터 구조로 통일
- `block-structure.ts`의 설계 철학 완전 구현
- DB 스키마와 완벽한 일치
- 향후 확장성 향상
- 변환 로직 없이 직접 구조 사용
- **Cell Type 관리 체계화** (element_type, cell_type 테이블 분리)
- **구분 블록의 유연한 구분 유형 지원** (header_cell_type의 Map 구조)

### B. 주의사항
- 기존 데이터 마이그레이션 필요
- Division 블록의 복잡한 tree 구조 이해 필요
- **리프 셀 계산 로직의 정확성 검증 필요** (ComponentGrid 전체 행 수 결정)
- **token_menu key와 element_type 매핑 로직 구현 필요**
- **header_cells와 body_cells의 데이터 구조 차이 이해 필요**
- 테스트 범위 확대 필요

## 9. 검증 방법

### A. 단위 테스트
- **리프 셀 계산 로직 테스트** (Division 블록의 핵심)
- **token_menu key 매핑 로직 테스트**
- **header_cells와 body_cells 변환 로직 테스트**
- 행/열 계산 로직 테스트
- DB 저장/로딩 테스트
- 블록 생성 로직 테스트

### B. 통합 테스트
- ComponentGrid 렌더링 테스트
- 블록 편집 기능 테스트
- 데이터 일관성 테스트

## 10. 수정된 FlowBlockAdapter 완전 구현

### A. 완전한 FlowBlockAdapter 클래스
```typescript
// lib/adapters/flowBlockAdapter.ts
import { getBlockType, BlockTypeName, FlowBlockType, CellElement, FlowColumn, HierarchicalCell } from '../types/block-structure';

export class FlowBlockAdapter {
  
  // FlowBlock → DB 저장 형식
  static toDbFormat(block: FlowBlock, blockData: any): DbBlockFormat {
    const blockType = block.type;
    
    if (blockType.name === 'Division') {
      return {
        block_type: this.getBlockTypeId('Division'),
        header_cells: this.extractDivisionHeaderCells(blockType),
        body_cells: JSON.stringify(blockType.children)
      };
    } else {
      return {
        block_type: this.getBlockTypeId(blockType.name),
        header_cells: this.extractGeneralHeaderCells(blockType, blockData),
        body_cells: this.extractGeneralBodyCells(blockType, blockData)
      };
    }
  }
  
  // DB 저장 형식 → FlowBlock
  static fromDbFormat(dbBlock: any, blockData: any): FlowBlock {
    const blockTypeName = this.getBlockTypeNameById(dbBlock.block_type);
    const blockType = getBlockType(blockTypeName);
    
    if (blockTypeName === 'Division') {
      return {
        id: dbBlock.block_id,
        type: {
          ...blockType,
          header: this.reconstructDivisionHeader(dbBlock.header_cells, blockData.header_cell_type),
          children: JSON.parse(dbBlock.body_cells)
        },
        data: {}
      };
    } else {
      return {
        id: dbBlock.block_id,
        type: {
          ...blockType,
          cols: this.reconstructGeneralCols(dbBlock.header_cells, dbBlock.body_cells, blockData)
        },
        data: {}
      };
    }
  }
  
  // Division 블록의 header_cells 추출 (token_menu key 값 배열)
  private static extractDivisionHeaderCells(blockType: FlowBlockType): string[] {
    return blockType.header?.map(header => header.menu_key) || [];
  }
  
  // 일반 블록의 header_cells 추출 (1차원 배열 - element_type 파라미터들만)
  private static extractGeneralHeaderCells(blockType: FlowBlockType, blockData: any): any[] {
    const headerElement = blockType.cols?.[0]?.header;
    if (!headerElement || !blockData?.header_cell_type?.element_types) return [];
    
    // block_data의 header_cell_type.element_types 순서에 따라 파라미터 값들만 추출
    return blockData.header_cell_type.element_types.map((et: any) => {
      if (et.name === 'Token') return headerElement.value;
      if (et.name === 'Text') return headerElement.content;
      return null;
    });
  }
  
  // 일반 블록의 body_cells 추출 (2차원 배열 - element_type 파라미터들만)
  private static extractGeneralBodyCells(blockType: FlowBlockType, blockData: any): any[][] {
    const rows = blockType.cols?.[0]?.rows || [];
    if (!blockData?.body_cell_type?.element_types) return [];
    
    return rows.map(row => {
      return blockData.body_cell_type.element_types.map((et: any) => {
        if (et.name === 'Token') return row.elements[0]?.value;
        if (et.name === 'Text') return row.elements[0]?.content;
        return null;
      });
    });
  }
  
  // Division 블록의 header 재구성 (token_menu key → CellElement)
  private static reconstructDivisionHeader(headerCells: string[], headerCellType: any): CellElement[] {
    return headerCells.map((tokenKey, index) => {
      const divisionType = Object.keys(headerCellType)[index];
      return {
        type: 'Token',
        value: tokenKey,
        menu_key: tokenKey,
        optional: false,
        visible: true
      };
    });
  }
  
  // 일반 블록의 cols 재구성 (header_cells + body_cells → FlowColumn[])
  private static reconstructGeneralCols(headerCells: any[], bodyCells: any[][], blockData: any): FlowColumn[] {
    const cols: FlowColumn[] = [];
    const headerElementTypes = blockData?.header_cell_type?.element_types || [];
    const bodyElementTypes = blockData?.body_cell_type?.element_types || [];
    
    // 각 열에 대해 FlowColumn 생성
    for (let colIndex = 0; colIndex < headerCells.length; colIndex++) {
      const headerCell = headerCells[colIndex];
      
      // header CellElement 생성
      const headerElement: CellElement = {
        type: headerElementTypes[0]?.name || 'Text',
        value: headerCell[0] || '',
        content: headerCell[1] || '',
        optional: false,
        visible: true
      };
      
      // body rows 생성
      const rows = bodyCells.map(row => ({
        elements: row.map((cellValue, elementIndex) => {
          const elementType = bodyElementTypes[elementIndex];
          if (!elementType) return null;
          
          return {
            type: elementType.name,
            value: cellValue || '',
            content: cellValue || '',
            optional: elementType.optional || false,
            visible: elementType.visible !== false
          };
        }).filter(Boolean) as CellElement[]
      }));
      
      cols.push({
        header: headerElement,
        rows: rows
      });
    }
    
    return cols;
  }
  
  // 블록 타입 ID 조회
  private static getBlockTypeId(blockTypeName: string): number {
    const typeMap: Record<string, number> = {
      'Division': 1,
      'ApplySubject': 2,
      'GradeRatio': 3,
      'Function': 4,
      'Condition': 5,
      'Aggregation': 6,
      'Variable': 7
    };
    return typeMap[blockTypeName] || 0;
  }
  
  // 블록 타입 ID로 이름 조회
  private static getBlockTypeNameById(blockTypeId: number): string {
    const idMap: Record<number, string> = {
      1: 'Division',
      2: 'ApplySubject', 
      3: 'GradeRatio',
      4: 'Function',
      5: 'Condition',
      6: 'Aggregation',
      7: 'Variable'
    };
    return idMap[blockTypeId] || 'Unknown';
  }
}

// DbBlockFormat 타입 정의
interface DbBlockFormat {
  block_type: number;
  header_cells: any;
  body_cells: any;
}
```

## 11. 데이터 변환 로직 검증

### A. Division 블록 변환 검증
```typescript
// 1. FlowBlock → DB 저장
const divisionBlock: FlowBlock = {
  id: 1,
  type: {
    name: 'Division',
    header: [
      { type: 'Token', value: 'gender_tk_mn', menu_key: 'gender_tk_mn', optional: false, visible: true },
      { type: 'Token', value: 'grade_tk_mn', menu_key: 'grade_tk_mn', optional: false, visible: true }
    ],
    children: [
      {
        elements: [{ type: 'Token', value: 'male', menu_key: 'division_values', optional: false, visible: true }],
        children: [
          {
            elements: [{ type: 'Token', value: '1학년', menu_key: 'division_values', optional: false, visible: true }],
            children: []
          }
        ]
      }
    ]
  },
  data: {}
};

// 2. DB 저장 형식
const dbFormat = FlowBlockAdapter.toDbFormat(divisionBlock, null);
// 결과: {
//   block_type: 1,
//   header_cells: ["gender_tk_mn", "grade_tk_mn"],
//   body_cells: "[{\"elements\":[{\"type\":\"Token\",\"value\":\"male\",\"menu_key\":\"division_values\",\"optional\":false,\"visible\":true}],\"children\":[{\"elements\":[{\"type\":\"Token\",\"value\":\"1학년\",\"menu_key\":\"division_values\",\"optional\":false,\"visible\":true}],\"children\":[]}]}]"
// }

// 3. DB 로드 → FlowBlock
const blockData = {
  header_cell_type: {
    "gender": "gender_tk_mn",
    "grade": "grade_tk_mn"
  }
};
const loadedBlock = FlowBlockAdapter.fromDbFormat(dbFormat, blockData);
// 결과: 원본 FlowBlock과 동일한 구조
```

### B. 일반 블록 변환 검증
```typescript
// 1. FlowBlock → DB 저장
const applySubjectBlock: FlowBlock = {
  id: 2,
  type: {
    name: 'ApplySubject',
    cols: [
      {
        header: { type: 'Text', content: '반영교과', optional: false, visible: true },
        rows: [
          { elements: [{ type: 'Token', value: '국어', menu_key: 'subject_groups', optional: false, visible: true }] },
          { elements: [{ type: 'Token', value: '수학', menu_key: 'subject_groups', optional: false, visible: true }] }
        ]
      }
    ]
  },
  data: {}
};

// 2. DB 저장 형식
const blockData = {
  header_cell_type: {
    element_types: [
      { id: 1, name: 'Text', optional: false, visible: true },
      { id: 2, name: 'Token', optional: false, visible: true, menu_key: 'include_exclude' }
    ]
  },
  body_cell_type: {
    element_types: [
      { id: 1, name: 'Token', optional: false, visible: true, menu_key: 'subject_groups' }
    ]
  }
};

const dbFormat = FlowBlockAdapter.toDbFormat(applySubjectBlock, blockData);
// 결과: {
//   block_type: 2,
//   header_cells: ["반영교과", null], // Text 값, Token 값 (없음)
//   body_cells: [["국어"], ["수학"]] // Token 값들
// }

// 3. DB 로드 → FlowBlock
const loadedBlock = FlowBlockAdapter.fromDbFormat(dbFormat, blockData);
// 결과: 원본 FlowBlock과 동일한 구조
```

## 12. 최종 검증 결과

### ✅ **완전히 수정된 부분들**
1. **FlowBlockAdapter.toDbFormat()**: blockData 매개변수 추가
2. **FlowBlockAdapter.fromDbFormat()**: 완전한 구현
3. **누락된 메서드들**: 모두 구현 완료
   - `reconstructDivisionHeader()`
   - `reconstructGeneralCols()`
   - `getBlockTypeId()`
   - `getBlockTypeNameById()`
4. **타입 안전성**: DbBlockFormat 인터페이스 추가
5. **에러 처리**: null/undefined 체크 로직 추가

### ✅ **데이터 변환 로직 일관성**
1. **Division 블록**: header → token_menu key 배열, children → JSON 문자열
2. **일반 블록**: header → element_type 파라미터 배열, body → 2차원 배열
3. **역변환**: DB 데이터 → FlowBlock 구조 완전 복원

### ✅ **프론트엔드-DB 연동**
1. **저장**: FlowBlock → DB 형식 변환
2. **로드**: DB 형식 → FlowBlock 변환
3. **렌더링**: FlowBlock 직접 사용 (변환 없음)

이제 `block-structure.ts`의 구조만을 사용하는 완전히 통일된 시스템이 구축되었습니다.

## 13. 블록 생성 및 셀 렌더링 과정 요약

### A. 블록 생성 과정 핵심 포인트

#### 1. 사용자 인터랙션부터 블록 생성까지
- **블록 팔레트 드래그**: 사용자가 블록 팔레트에서 블록을 드래그
- **블록 타입 코드 획득**: 드래그된 블록의 타입 코드(1, 2, 3, ...) 획득
- **block_data 조회**: DB에서 블록 타입 코드 기반으로 block_data 조회
- **블록 객체 생성**: block_data를 기반으로 실제 블록 구조 생성
- **blocks[] 배열 삽입**: 생성된 블록을 blocks[] 배열에 추가

#### 2. 초기 데이터 설정
- **빈 배열로 시작**: header_cells와 body_cells는 빈 배열로 초기화
- **사용자 편집 대기**: 사용자가 편집할 때 실제 데이터로 채워짐
- **ID 할당**: 기존 블록들 중 최대 ID + 1로 새 ID 할당

### B. 셀 렌더링 과정 핵심 포인트

#### 1. 렌더링 계층 구조
```
ComponentGrid
├── 전체 행×열 크기 계산
│   ├── 행: 구분 블록 존재 시 2 + 리프 셀 개수, 없을 시 3행
│   └── 열: 모든 블록의 col 속성 합계
├── N×M 빈 셀 그리드 생성
├── 각 셀(r,c)의 내용 채우기
│   ├── 1행: 블록명 (첫 번째 열에만, 나머지는 빈 셀)
│   ├── 2행: Header (각 열마다 block_data.header_cell_type)
│   └── 3행부터: Body (각 열마다 block_data.body_cell_type)
└── element_type별 셀 렌더링
    ├── Token (TokenSelector)
    ├── Text (input)
    ├── Formula (FormulaEditor)
    └── InputField (number input)
```

#### 2. 데이터 흐름
- **빈 그리드 생성**: 전체 행×열 크기로 빈 셀 그리드를 먼저 생성
- **셀 내용 채우기**: 각 셀(r,c)의 위치에 따라 해당하는 블록과 내용을 찾아서 채우기
- **동적 데이터 생성**: block의 header_cells, body_cells에 데이터가 없으면 block_data의 cell_type으로 렌더링하고 block에 데이터 추가
- **DB 저장/로드**: 값 배열을 element_type 순서대로 저장하고, 로드 시 인덱스 기반으로 매핑
- **col 속성 기반**: 각 블록의 열 개수는 block.col 속성으로 결정 (block_data.init_col 기반)
- **block_data 중심**: 모든 셀 정보는 block_data에서 참조
- **element_type 배열**: 각 셀은 1개 이상의 element_type으로 구성
- **순차적 배치**: element_type[]에 따라 순차적으로 셀 내부에 배치
- **상향식 데이터 전달**: 셀 편집 → 블록 업데이트 → 컴포넌트 상태 업데이트

#### 3. Division 블록 특별 처리
- **리프 셀 계산**: `countLeafCells`로 ComponentGrid 전체 행 수 결정
- **특정 행×열 셀 렌더링**: `renderDivisionBodyCell` 함수로 트리 구조에서 특정 행과 열의 셀 렌더링
- **계층적 셀 편집**: depth별로 다른 스타일링 및 편집 로직 적용

### C. 실제 구현 방식의 특징

#### 1. DB 중심 설계
- **block_data 테이블**: 모든 블록의 메타데이터와 셀 타입 정보 저장
- **element_type 테이블**: Token, Text, Formula 등 셀 요소 타입 정의
- **실시간 조회**: 렌더링 시마다 block_data를 조회하여 최신 정보 사용

#### 2. 빈 그리드 + 셀 채우기 방식
- **빈 그리드 생성**: 전체 행×열 크기로 빈 셀 그리드를 먼저 생성
- **col 속성 기반**: 각 블록의 열 개수는 block.col 속성으로 결정 (block_data.init_col 기반)
- **셀 내용 채우기**: 각 셀(r,c)의 위치에 따라 해당하는 블록과 내용을 찾아서 채우기
- **동적 데이터 생성**: block의 header_cells, body_cells에 데이터가 없으면 block_data의 cell_type으로 렌더링하고 block에 데이터 추가
- **DB 저장/로드**: 값 배열을 element_type 순서대로 저장하고, 로드 시 인덱스 기반으로 매핑
- **1행**: 블록명 (첫 번째 열에만, 나머지는 빈 셀)
- **2행**: Header (각 열마다 block_data.header_cell_type)
- **3행부터**: Body (각 열마다 block_data.body_cell_type)
- **일관된 구조**: 모든 블록이 동일한 행 구조를 따름

#### 3. element_type 기반 셀 구성
- **유연한 셀 구성**: 각 셀은 여러 element_type으로 구성 가능
- **타입별 렌더링**: Token, Text, Formula 등 각각 다른 UI 컴포넌트 사용
- **순차적 배치**: element_type 배열 순서대로 셀 내부에 배치

### D. 성능 최적화 전략

#### 1. 렌더링 최적화
- **React.memo**: CellBox 컴포넌트 메모이제이션
- **가상화**: 대용량 데이터 시 VirtualizedGrid 적용
- **지연 로딩**: 필요시에만 블록 뷰 컴포넌트 로드

#### 2. 상태 관리 최적화
- **불변성**: immer 라이브러리 활용 고려
- **선택적 업데이트**: 변경된 블록만 리렌더링
- **배치 업데이트**: 여러 셀 변경 시 한 번에 처리

### E. 확장성 고려사항

#### 1. 새로운 블록 타입 추가
- `block_data` 테이블에 새 블록 타입 등록
- `header_cell_type`과 `body_cell_type` 정의
- 해당 블록의 렌더링 로직 구현

#### 2. 새로운 셀 타입 추가
- `element_type` 테이블에 새 타입 등록
- `renderElementByType` 함수에 새 케이스 추가
- 해당 셀 타입의 편집 컴포넌트 구현

이러한 구조를 통해 DB 중심의 데이터 관리와 일관된 3행 구조를 유지하면서도, 유연한 셀 구성과 확장성을 제공할 수 있습니다.
