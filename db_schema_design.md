# DB 스키마 설계 문서

## 개요
교과성적 산출방법 빌더 솔루션을 위한 데이터베이스 스키마 설계입니다. ComponentGrid의 화면 데이터와 runPipeline의 계산 로직이 모두 활용할 수 있도록 설계되었습니다.

## 테이블 구조

### 1. Component 테이블
ComponentGrid 단위의 데이터를 저장합니다.

```prisma
model Component {
  pipeline_id   Int
  component_id  Int      @id @default(autoincrement())
  order         Int      // 연결선에 따른 순서
  
  // 관계
  blocks        Block[]
  
  @@unique([pipeline_id, component_id])
  @@index([pipeline_id, order])
}
```

### 2. Block 테이블
각 블록의 상세 데이터를 저장합니다.

```prisma
model Block {
  pipeline_id   Int
  component_id  Int
  block_id      Int      @id @default(autoincrement())
  order         Int      // Component 내에서의 순서 (1,2,3,...)
  block_type    Int      // ApplyTerm=1, Division=2, ScoreMap=3 등
  header_cells  Json     // FlowCell[][] 형태의 헤더 셀 데이터
  body_cells    Json     // FlowCell[][] 또는 HierarchicalCell[] 형태의 바디 셀 데이터
  
  // 관계
  component     Component @relation(fields: [component_id], references: [component_id])
  
  @@unique([pipeline_id, component_id, block_id])
  @@index([pipeline_id, component_id, order])
  @@index([block_type])
}
```

## 데이터 타입 매핑

### FlowCell 구조 (일반 블록)
```typescript
interface FlowCell {
  elements: CellElement[]
}

type CellElement = 
  | TokenElement    // 드롭다운 선택
  | TextElement     // 텍스트 표시
  | TableElement    // 테이블 데이터
  | FormulaElement  // DSL 수식
  | InputFieldElement // 입력 필드
```

**DB 저장 예시:**
```json
// header_cells, body_cells
[
  [
    {
      "elements": [
        {
          "element_type": "Token",
          "optional": false,
          "visible": true,
          "items": [
            {"name": "포함", "var": "include"},
            {"name": "제외", "var": "exclude"}
          ],
          "value": "include"
        }
      ]
    }
  ]
]
```

### HierarchicalCell 구조 (Division 블록)
```typescript
interface HierarchicalCell {
  id: string                    // 고유 식별자
  type: string                 // 구분 유형 (gender, track, etc.)
  value: Record<string, any>   // CompositeToken 값들
  level: number                // 계층 깊이 (0=최상위)
  children: HierarchicalCell[] // 자식 셀들
  rowspan?: number            // 계산된 세로 병합 크기
  parent?: string             // 부모 셀 ID
}
```

**DB 저장 예시 (Division 블록의 body_cells):**
```json
[
  {
    "id": "cell_1234567890_abc123",
    "type": "gender",
    "value": {"gender": "male"},
    "level": 0,
    "children": [
      {
        "id": "cell_1234567891_def456",
        "type": "track", 
        "value": {"track": "science"},
        "level": 1,
        "children": [],
        "parent": "cell_1234567890_abc123",
        "rowspan": 1
      }
    ],
    "rowspan": 2
  }
]
```

## 블록 타입 코드 매핑

| block_type | 블록명 | 설명 |
|------------|--------|------|
| 1 | ApplyTerm | 반영학기 설정 |
| 2 | Division | 구분 (성별, 계열 등) |
| 3 | ScoreMap | 점수 변환 테이블 |
| 4 | ApplySubject | 반영교과 설정 |
| 5 | TopSubject | 우수 N과목 |
| 6 | SubjectGroupRatio | 교과군별 반영비율 |
| 7 | SeparationRatio | 교과 구분별 반영비율 |
| 8 | GradeRatio | 학년별 반영비율 |
| 9 | Formula | 수식 블록 |
| 10 | Variable | 변수 저장 |
| 11 | Condition | 조건 분기 |

## 데이터 저장/로드 전략

### ComponentGrid → DB 저장
```typescript
// utils/blockToDbConverter.ts 활용
function saveComponentGridToDb(blocks: FlowBlock[], pipelineId: number, componentId: number) {
  blocks.forEach((block, index) => {
    const blockData = {
      pipeline_id: pipelineId,
      component_id: componentId,
      block_id: block.id,
      order: index + 1,
      block_type: getBlockTypeCode(block.type.name),
      header_cells: block.type.headers, // FlowCell[][]
      body_cells: isDivisionBlock(block) 
        ? hierarchicalDataMap[block.id]  // HierarchicalCell[]
        : block.type.body               // FlowCell[][]
    }
    
    // DB INSERT
    await prisma.block.create({ data: blockData })
  })
}
```

### DB → runPipeline 로드
```typescript
// lib/adapters/dbToDomain.ts
function loadPipelineFromDb(pipelineId: number): Pipeline {
  const components = await prisma.component.findMany({
    where: { pipeline_id: pipelineId },
    include: { blocks: true },
    orderBy: { order: 'asc' }
  })
  
  return {
    id: pipelineId.toString(),
    components: components.map(comp => ({
      id: comp.component_id,
      blocks: comp.blocks.map(convertDbBlockToAnyBlock)
    }))
  }
}

function convertDbBlockToAnyBlock(dbBlock: Block): AnyBlock {
  // block_type에 따라 적절한 AnyBlock 구조로 변환
  switch (dbBlock.block_type) {
    case 2: // Division
      return {
        kind: 'division',
        spec: {
          rows: convertHierarchicalToFlatRows(dbBlock.body_cells)
        }
      } as DivisionBlock
    // 기타 블록 타입들...
  }
}
```

## 구분 블록(Division) 특수 처리

Division 블록은 `body_cells`에 `HierarchicalCell[]` 구조를 저장하여 계층적 구분 기능을 지원합니다.

### 장점
- 기존 스키마 구조 유지
- ComponentGrid의 복잡한 계층 구조 완벽 지원
- rowspan, 부모-자식 관계 정보 보존

### 주의사항
- `body_cells` 필드가 블록 타입에 따라 다른 구조를 가짐
- 타입 안전성 확보를 위해 적절한 유틸리티 함수 필요
- Division 블록 파싱 시 `HierarchicalCell` 구조로 해석해야 함

## 인덱스 전략

```sql
-- 성능 최적화를 위한 인덱스
CREATE INDEX idx_component_pipeline_order ON Component(pipeline_id, order);
CREATE INDEX idx_block_component_order ON Block(pipeline_id, component_id, order);
CREATE INDEX idx_block_type ON Block(block_type);

-- JSONB 필드 인덱스 (필요시)
CREATE INDEX idx_block_header_gin ON Block USING GIN(header_cells);
CREATE INDEX idx_block_body_gin ON Block USING GIN(body_cells);
```

## 마이그레이션 고려사항

1. **기존 데이터 호환성**: 현재 `ComponentGrid.tsx`에서 사용하는 데이터 구조와 완전 호환
2. **점진적 마이그레이션**: 블록별로 순차적 데이터 이전 가능
3. **백업 전략**: 마이그레이션 전 기존 JSON 파일 백업 필요

## 사용 예시

### 1. ApplyTerm 블록 저장
```json
{
  "pipeline_id": 1,
  "component_id": 1,
  "block_id": 101,
  "order": 1,
  "block_type": 1,
  "header_cells": [[{"elements": [{"element_type": "Text", "content": "반영학기"}]}]],
  "body_cells": [[{"elements": [
    {"element_type": "Token", "value": "1-1:on", "items": [{"name": "1-1 ON", "var": "1-1:on"}]}
  ]}]]
}
```

### 2. Division 블록 저장
```json
{
  "pipeline_id": 1,
  "component_id": 1,
  "block_id": 102,
  "order": 2,
  "block_type": 2,
  "header_cells": [[{"elements": [{"element_type": "Token", "value": "gender"}]}]],
  "body_cells": [
    {
      "id": "cell_123",
      "type": "gender",
      "value": {"gender": "male"},
      "level": 0,
      "children": [],
      "rowspan": 1
    }
  ]
}
```

이 스키마 설계를 통해 ComponentGrid의 모든 기능과 runPipeline의 계산 로직을 완벽하게 지원할 수 있습니다.