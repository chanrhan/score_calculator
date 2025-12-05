# BlockInstance 기본값 관리 개선 명세서

## 1. 목적

현재 BlockStructure에 정의된 `defaults`가 BlockInstance 생성 시 사용되지 않아, 기본값이 여러 곳에 하드코딩되어 있습니다. 이를 개선하여 단일 소스(BlockStructure.defaults)에서 기본값을 관리하도록 합니다.

## 2. 현재 문제점

### 2.1 기본값 소스 분산
- `lib/blocks/modules/[BlockName]/structure.ts`: `defaults` 정의 (사용 안 됨)
- `lib/blocks/modules/[BlockName]/instance.ts`: 하드코딩된 기본값
- `store/usePipelines.ts`: 하드코딩된 샘플 데이터

### 2.2 새 블록 생성 시 기본값 미적용
```typescript
// store/usePipelines.ts:461
blocks.splice(idx, 0, { 
  block_id: bid, 
  block_type: 0,
  header_cells: [['샘플 헤더']],  // ❌ 하드코딩
  body_cells: [[['샘플 데이터']]] 
});
```

### 2.3 DB 로드 시 기본값 보정 없음
- DB에 값이 없으면 빈 값으로 표시됨
- BlockStructure의 기본값으로 보정하지 않음

## 3. 목표

### 3.1 단일 소스 원칙
- BlockStructure의 `defaults`가 유일한 기본값 소스
- 모든 BlockInstance는 이 기본값으로 초기화

### 3.2 데이터 흐름
```
1. BlockStructure.defaults 정의
   ↓
2. 새 블록 생성:
   BlockInstanceFactory.create(blockType, blockId, {}) 
   → BlockStructure.defaults를 사용하여 초기화
   ↓
3. DB에서 로드:
   BlockInstanceFactory.create(blockType, blockId, dbData)
   → DB 데이터가 있으면 병합, 없으면 BlockStructure.defaults 사용
   ↓
4. BlockLayout 렌더링:
   block.getHeaderProperties() / getBodyProperties()
   → BlockInstance의 현재 상태 반영 (기본값이 이미 적용됨)
```

## 4. 구체적인 변경 사항

### 4.1 BlockInstance 생성 시 기본값 적용

#### 4.1.1 BlockInstanceFactory 수정
- `create()` 메서드에서 BlockStructure를 가져와 `defaults` 사용
- `data`가 비어있거나 일부 속성이 없으면 `defaults`로 보정

#### 4.1.2 각 BlockInstance의 constructor 수정
- `data`가 없거나 불완전한 경우, BlockStructure의 `defaults` 사용
- `data`와 `defaults`를 병합 (data 우선, 없으면 defaults 사용)

### 4.2 새 블록 생성 로직 수정

#### 4.2.1 store/usePipelines.ts 수정
- 하드코딩된 샘플 데이터 제거
- BlockInstanceFactory를 사용하여 기본값으로 초기화된 BlockInstance 생성

#### 4.2.2 BlockInstanceFactory에 createWithDefaults() 추가 (선택사항)
- 새 블록 생성 전용 메서드
- BlockStructure.defaults만 사용하여 초기화

### 4.3 DB 로드 시 기본값 보정

#### 4.3.1 componentGridDb.ts 수정
- DB 데이터 로드 후, BlockStructure.defaults와 병합
- 누락된 속성은 기본값으로 채움

## 5. 구현 단계

### Phase 1: BlockStructure에서 기본값 가져오기 유틸리티
1. `lib/blocks/modules/common/defaults.ts` 생성
   - `getBlockDefaults(blockType: number): BlockPropertyValues` 함수
   - BlockStructure에서 defaults 추출

### Phase 2: BlockInstance 생성 시 기본값 적용
1. `BlockInstanceFactory.create()` 수정
   - BlockStructure.defaults 가져오기
   - data와 defaults 병합 로직 추가

2. 각 BlockInstance의 constructor 수정
   - ApplySubjectBlockInstance부터 시작
   - BlockStructure.defaults 사용하도록 변경
   - 하드코딩된 기본값 제거

### Phase 3: 새 블록 생성 로직 수정
1. `store/usePipelines.ts`의 `addBlockToComponent` 수정
   - BlockInstanceFactory 사용하여 기본값으로 초기화

### Phase 4: DB 로드 시 기본값 보정
1. `lib/adapters/componentGridDb.ts` 수정
   - DB 데이터 로드 후 기본값 병합

### Phase 5: 테스트 및 검증
1. 새 블록 생성 시 기본값 확인
2. DB 로드 시 기본값 보정 확인
3. 기존 데이터 호환성 확인

## 6. 영향받는 파일

### 6.1 수정 필요
- `lib/blocks/modules/registry.ts` (BlockInstanceFactory)
- `lib/blocks/modules/[BlockName]/instance.ts` (모든 BlockInstance)
- `store/usePipelines.ts`
- `lib/adapters/componentGridDb.ts`

### 6.2 신규 생성
- `lib/blocks/modules/common/defaults.ts` (기본값 유틸리티)

## 7. 데이터 병합 전략

### 7.1 병합 규칙
- DB 데이터가 있으면 우선 사용
- DB 데이터가 없거나 `null`/`undefined`이면 BlockStructure.defaults 사용
- 배열의 경우: DB 데이터가 빈 배열이면 defaults 사용 (선택사항)

### 7.2 예시
```typescript
// BlockStructure.defaults
{
  include_option: 'include',
  subject_groups: []
}

// DB data
{
  include_option: 'exclude',  // DB 값 사용
  // subject_groups 없음 → defaults 사용
}

// 최종 결과
{
  include_option: 'exclude',  // DB 값
  subject_groups: []          // defaults 값
}
```

## 8. 하위 호환성

**하위 호환성 및 레거시 코드 지원하지 않음**
- 기존 DB 데이터는 기본값으로 보정
- 레거시 포맷 변환 로직 제거
- 새로운 구조(BlockStructureDefinition)만 지원

## 9. 예외 처리

### 9.1 BlockStructure를 찾을 수 없는 경우
- 기본값 없이 기존 로직 사용 (하위 호환성)

### 9.2 defaults가 정의되지 않은 경우
- 빈 객체/배열로 초기화 (기존 동작 유지)

## 10. 검증 항목

- [ ] 새 블록 생성 시 BlockStructure.defaults가 적용되는가?
- [ ] DB 로드 시 기본값이 보정되는가?
- [ ] 기존 DB 데이터가 정상적으로 로드되는가?
- [ ] 모든 블록 타입에서 기본값이 적용되는가?
- [ ] 하위 호환성이 유지되는가?

