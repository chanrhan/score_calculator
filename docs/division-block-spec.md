# 구분 헤드(Division Head) 명세서

## 1. 개요

### 1.1 목적
기존의 독립적인 Division Block을 제거하고, 각 Component에 항상 포함되는 구분 헤드(Division Head)로 통합합니다.

### 1.2 구분 헤드의 정의
- **구분 헤드(Division Head)**: Component가 항상 1개만 보유하는 블록 형태의 요소
- **특징**:
  - 기능은 기존 Division Block과 동일
  - 사용자가 임의로 배치하거나 독립적으로 삭제할 수 없음
  - Component 생성 시 자동으로 포함됨

---

## 2. 구조 및 데이터 모델

### 2.1 시각적 구조
구분 헤드는 표(table) 형태로, 다음과 같이 구성됩니다:

```
┌─────────────────────────────────────────┐
│ [점3개]  [Token: division_type]        │  ← Header (헤더)
├─────────────────────────────────────────┤
│ [Token]  [Token]  [Token]  ...         │  ← Body Row 1 (바디 행 1)
│ [Token]  [Token]  [Token]  ...         │  ← Body Row 2 (바디 행 2)
│   ...      ...      ...    ...         │
└─────────────────────────────────────────┘
```

### 2.2 헤더(Header) 구조

**구성 요소**:
- **division_type Token**: 구분 유형을 선택하는 Token 요소
  - Token Menu Key: `division_type` (또는 `division_criteria`)
  - Token Menu Type: `Token_Menu` (DB의 `token_menu` 테이블 참조)
  - 선택된 값에 따라 바디 셀의 유형이 결정됨

**셀 JSON 구조**:
- 각 헤더 셀은 **key-value 형태**의 간단한 객체입니다
- Key: `division_type` (고정)
- Value: 선택된 구분 유형의 값 (문자열)

**데이터 구조 예시**:
```json
[
  {
    "division_type": "admission_code"
  }
]
```

**설명**:
- 배열의 각 요소는 하나의 열(column)을 나타냅니다
- 배열 인덱스는 열 인덱스와 동일합니다
- 각 셀은 `{ division_type: "값" }` 형태의 key-value 객체입니다

### 2.3 바디(Body) 구조

**구성 요소**:
- 바디 셀의 유형은 헤더에서 선택된 `division_type`의 `token_menu_item` 항목에 기반
- 각 바디 셀은 **key-value 형태**의 객체입니다
- Key와 Value는 어떤 것이든 들어올 수 있습니다 (완전히 동적)

**셀 JSON 구조**:
- 각 바디 셀은 `{ "속성명": "속성값" }` 형태입니다
- Key(속성명)와 Value(속성값)는 어떤 값이든 가능합니다
- 헤더에서 선택된 `division_type` 값에 따라 바디 셀의 구조가 결정되지만, 실제 저장되는 key-value는 자유롭습니다

**데이터 구조 예시**:

**시나리오**: 헤더에 2개 열이 있고, 각각 `division_type: "admission_code"`, `division_type: "grade"`로 설정된 경우

```json
[
  [
    {
      "admission_code": "71"
    },
    {
      "grade": "1"
    }
  ],
  [
    {
      "admission_code": "72"
    },
    {
      "grade": "2",
      "include": true
    }
  ]
]
```

**설명**:
- 외부 배열: 행(row) 배열
- 내부 배열: 각 행의 열(column) 배열
- 각 셀 객체: `{ "속성명": "속성값" }` 형태의 key-value
- Key와 Value는 어떤 것이든 들어올 수 있습니다
- 예: `{ "grade": "1" }`, `{ "admission_code": "71" }`, `{ "grade": "2", "include": true }` 등

**다른 예시**: 다양한 key-value 조합
```json
{
  "year": "2024"
}
```

또는 여러 속성이 있는 경우:
```json
{
  "grade": "1",
  "include": true,
  "priority": 10
}
```

### 2.4 셀 병합 규칙

구분 헤드는 계층적 셀 병합 구조를 가집니다:

**병합 규칙**:
- 각 셀은 오른쪽 열의 개수만큼 세로로 병합됨
- 열 인덱스가 낮을수록 더 많은 행과 병합됨

**예시**:
```
열 인덱스:  0       1       2
행 0:     [A────]  [B──]   [C]
행 1:     [A────]  [B──]   [D]
행 2:     [A────]  [E──]   [F]
```

- 열 0의 셀 A는 3행에 걸쳐 병합됨 (rowspan=3)
- 열 1의 셀 B는 2행에 걸쳐 병합됨 (rowspan=2)
- 열 2의 셀들은 각각 1행씩 (rowspan=1)

**행 추가 시 동작**:
- 선택된 셀의 열 인덱스가 `n`인 경우:
  - 열 인덱스 `n` 이상: 새로운 셀이 추가됨
  - 열 인덱스 `n` 미만: 기존 셀의 병합 범위가 확장됨 (rowspan 증가)

---

## 3. 기능 명세

### 3.1 기능 접근 방법

**주 메뉴 (점 3개 아이콘)**:
- 위치: 다른 블록들의 기능 버튼과 동일한 위치 (헤더 우측 상단)
- 클릭 시 옵션 메뉴 표시
- 제공 기능:
  - 활성화/비활성화
  - 열 추가

**컨텍스트 메뉴 (우클릭)**:
- 헤더/바디 셀 우클릭 시 드롭다운 메뉴 표시
- 제공 기능:
  - 열 삭제 (헤더 셀 또는 바디 셀)
  - 행 추가 (바디 셀만)
  - 행 삭제 (바디 셀만)

### 3.2 활성화/비활성화

**동작**:
- **비활성화**:
  - 구분 헤드가 아코디언처럼 접힘 (UI에서 숨김)
  - 계산 시 구분 헤드를 사용하지 않음
  - 상태 플래그: `is_active: false`
  
- **활성화**:
  - 접혀진 구분 헤드가 다시 펼쳐짐
  - 계산 시 구분 헤드를 사용함
  - 상태 플래그: `is_active: true`

**실행 방법**: 점 3개 아이콘 → "활성화"/"비활성화" 선택

### 3.3 열 추가

**동작**:
- 구분 헤드에 새로운 열을 추가함
- 새 열의 헤더에는 division_type Token이 추가됨
- 새 열의 바디에는 기본값으로 빈 Token 셀이 추가됨

**실행 방법**: 점 3개 아이콘 → "열 추가" 선택

**제약 조건**: 없음 (무제한 추가 가능)

### 3.4 열 삭제

**동작**:
- 선택된 셀이 속한 열 전체를 삭제함
- 해당 열의 모든 헤더 및 바디 셀이 제거됨

**실행 방법**: 
- 헤더 셀 또는 바디 셀 우클릭 → "열 삭제" 선택

**제약 조건**:
- 열이 1개만 남아있는 경우 삭제 불가
- 최소 1개의 열은 항상 유지되어야 함

### 3.5 행 추가

**동작**:
- 선택된 바디 셀 아래에 새로운 행을 추가함
- 셀 병합 규칙에 따라 적절히 병합됨

**실행 방법**: 
- 바디 셀 우클릭 → "행 추가" 선택

**병합 로직**:
- 선택된 셀의 열 인덱스가 `n`인 경우:
  - 열 인덱스 `[0, n-1]`: 기존 셀의 rowspan 증가
  - 열 인덱스 `[n, 마지막]`: 새로운 셀 추가

**예시**:
```
기존 상태 (열 1의 셀 선택):
[A────]  [B──]   [C]
[A────]  [B──]   [D]

행 추가 후:
[A────]  [B──]   [C]
[A────]  [B──]   [D]
[A────]  [E──]   [F]  ← 새 행 추가
```

### 3.6 행 삭제

**동작**:
- 선택된 바디 셀이 속한 행 전체를 삭제함
- 해당 행의 모든 셀이 제거됨
- 병합된 셀의 rowspan이 자동으로 조정됨

**실행 방법**: 
- 바디 셀 우클릭 → "행 삭제" 선택

**제약 조건**:
- 행이 1개만 남아있는 경우 삭제 불가
- 최소 1개의 행은 항상 유지되어야 함

---

## 4. 데이터 저장

### 4.1 저장 위치

**테이블**: `component_grid` (기존 `block` 테이블이 아님)

**이유**: 
- 구분 헤드는 Component에 종속된 필수 요소이므로 Component 레벨에서 관리
- 독립적인 Block으로 취급하지 않음

### 4.2 스키마 구조

**컬럼 추가 필요**:
```sql
ALTER TABLE component_grid ADD COLUMN division_head_header JSONB;
ALTER TABLE component_grid ADD COLUMN division_head_body JSONB;
ALTER TABLE component_grid ADD COLUMN division_head_active BOOLEAN DEFAULT true;
```

**또는 Prisma Schema**:
```prisma
model component_grid {
  // ... 기존 필드들 ...
  division_head_header Json?  // 구분 헤드 헤더 데이터
  division_head_body   Json?  // 구분 헤드 바디 데이터
  division_head_active Boolean @default(true)  // 활성화 상태
}
```

### 4.3 데이터 형식

**division_head_header** (헤더 데이터):
- 배열 형태: 각 요소는 하나의 열(column)을 나타냅니다
- 각 셀은 key-value 형태의 객체입니다

```json
[
  {
    "division_type": "gender"
  },
  {
    "division_type": "grade"
  }
]
```

**division_head_body** (바디 데이터):
- 2차원 배열 형태: 외부 배열은 행(row), 내부 배열은 열(column)
- 각 셀은 key-value 형태의 객체입니다
- Key와 Value는 어떤 것이든 들어올 수 있습니다 (완전히 동적)

**예시 1**: 헤더에 `division_type: "admission_code"` 열 1개, 바디에 행 2개 있는 경우
```json
[
  [
    {
      "admission_code": "71"
    }
  ],
  [
    {
      "admission_code": "72"
    }
  ]
]
```

**예시 2**: 헤더에 `division_type: "admission_code"`, `division_type: "grade"` 열이 있고, 바디에 여러 속성이 있는 경우
```json
[
  [
    {
      "admission_code": "71"
    },
    {
      "grade": "1"
    }
  ],
  [
    {
      "admission_code": "72"
    },
    {
      "grade": "2",
      "include": true
    }
  ]
]
```

**예시 3**: 헤더에 `division_type: "year"` 열이 있는 경우
```json
[
  [
    {
      "year": "2024"
    }
  ],
  [
    {
      "year": "2025"
    }
  ]
]
```

**핵심 규칙**:
- 헤더 셀: `{ "division_type": "값" }` 형태 (key는 항상 `division_type`)
- 바디 셀: `{ "속성명": "속성값" }` 형태 (key, value는 어떤 것이든 들어올 수 있음)
- 바디 셀의 key와 value는 완전히 동적이며, 헤더에서 선택된 `division_type` 값에 따라 결정되지만 저장 형식은 자유롭습니다
- JSON/JSONB 자료형 사용
- JSON만 2차원 배열 구조인 것만 동일합니다

## 5. 구현 고려사항

### 5.1 UI/UX

- 구분 헤드는 Component 내 가장 왼쪽에 항상 표시됨 
- 비활성화 시 아코디언 형태로 접힘
- 다른 블록들과 동일한 스타일링 적용

### 5.2 계산 로직

- 활성화된 구분 헤드는 계산 시 Division Block과 동일하게 동작
- 비활성화된 구분 헤드는 계산에서 제외됨
- 기존 Division Block 처리 로직을 재사용 가능

### 5.3 마이그레이션

- 기존 Division Block 데이터를 구분 헤드로 변환하는 마이그레이션 필요
- Component에 Division Block이 없는 경우 기본값으로 구분 헤드 생성

---

## 6. 용어 정리

| 용어 | 설명 |
|------|------|
| **구분 헤드 (Division Head)** | Component에 종속된 구분 블록 형태의 요소 |
| **division_type** | 구분 유형을 선택하는 Token의 menu_key 또는 값 |
| **Token Menu** | DB의 `token_menu` 테이블에 저장된 메뉴 데이터 |
| **Token Menu Item** | Token Menu의 각 항목 (DB의 `token_menu_item` 테이블) |
| **rowspan** | 셀이 병합된 행의 개수 |
| **컨텍스트 메뉴** | 우클릭 시 나타나는 드롭다운 메뉴 |
| **key-value 구조** | 셀 데이터의 저장 형식. 헤더는 `{ division_type: "값" }` 형태, 바디는 `{ "속성명": "속성값" }` 형태 (key, value는 어떤 것이든 가능) |

## 7. 셀 데이터 구조 요약

### 7.1 헤더 셀 구조
```json
{
  "division_type": "gender"  // key는 항상 "division_type", value는 선택된 구분 유형
}
```

### 7.2 바디 셀 구조
```json
{
  "admission_code": "71"  // key와 value는 어떤 것이든 들어올 수 있음
}
```

**여러 속성이 있는 경우**:
```json
{
  "grade": "1",
  "include": true,
  "priority": 10  // 여러 key-value가 있을 수 있음
}
```

**중요**: 
- 바디 셀의 key와 value는 어떤 것이든 들어올 수 있습니다 (완전히 동적)
- 헤더에서 선택된 `division_type` 값에 따라 바디 셀의 구조가 결정되지만, 실제 저장되는 key-value는 자유롭습니다
- JSON만 2차원 배열 구조인 것만 동일합니다
- 하위 호환성 무시하고 진행