# ComponentGrid 데이터 흐름 분석

## 1. 프론트엔드 데이터 저장

### 메모리 상태 관리
- **Zustand Store** (`store/usePipelines.ts`)
- Pipeline → Component → Block 계층 구조
- 블록 데이터: `AnyBlock` 타입 (id, kind, position, spec)

### 블록 생성
```typescript
// Division 블록 예시
{
  id: 1,
  kind: 'division',
  position: 1,
  skipPolicy: 'skip_empty_case',
  spec: {
    rows: [
      { type: 'default', values: ['기본'] },
      { type: 'body', values: [''] }
    ]
  },
  cases: []
}
```

## 2. DB 저장 구조

### 현재 구조 (Prisma)
```sql
-- block_data 테이블
CREATE TABLE block_data (
  univ_id    String   @db.Char(3)
  block_type String
  block_name String
  data       Json     -- 블록 설정 데이터
)
```

### 향후 구조 (설계 문서)
```sql
-- blocks 테이블 (공통)
CREATE TABLE blocks (
  id            BIGSERIAL PRIMARY KEY,
  component_id  BIGINT NOT NULL,
  name          TEXT NOT NULL,
  kind          TEXT NOT NULL,
  position_in_component INT NOT NULL
);

-- division_blocks 테이블 (Division 전용)
CREATE TABLE division_blocks (
  block_id        BIGINT PRIMARY KEY,
  spec_json       JSONB NOT NULL,  -- 구분유형/항목 테이블 구조
  skip_policy     TEXT NOT NULL
);
```

## 3. DB → 화면 데이터 로딩

### 로딩 과정
1. `getBlockData(univId, blockType)` - DB 조회
2. `createBlockFromData(blockData)` - 데이터 변환
3. `addBlockToComponent()` - ComponentGrid 추가

### 변환 로직
```typescript
export function createBlockFromData(blockData: BlockData): any {
  const base = { id: 0, kind: blockData.block_type, position: 1 }
  
  if (blockData.data && typeof blockData.data === 'object') {
    return { ...base, ...blockData.data }
  }
  
  return base
}
```

## 4. 화면 표시

### 블록 렌더링
- `blockRegistry.tsx`의 `getBlockRenderer()` 함수
- Division 블록: `DivisionBlockView` 컴포넌트
- 행/열 크기: `grid()` 함수로 계산

### Division 블록 표시
```typescript
// 행 수: Math.max(...spec.rows.map(row => row.values.length))
// 열 수: spec.rows.length
```

## 5. block-structure.ts와의 관계

### 구조적 차이
- **block-structure.ts**: 새로운 리팩토링 구조 (FlowBlockType)
- **현재 시스템**: 기존 구조 (AnyBlock with spec.rows)

### 데이터 변환
- `DivisionDataConverter` 클래스
- `flatToHierarchical()`: flat → 계층적
- `hierarchicalToFlat()`: 계층적 → flat

## 6. 데이터 흐름 요약

```
사용자 입력 → Zustand Store → DB 저장
     ↓
DB 조회 → 데이터 변환 → ComponentGrid 렌더링
     ↓
block-structure.ts 구조 ↔ 기존 AnyBlock 구조
```
