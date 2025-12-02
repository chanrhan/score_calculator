# Grid Cell과 Hierarchical Cell 매핑 규칙

## 개요
DivisionBlock에서 렌더링 그리드의 셀을 수정할 때, 계층적 구조의 어떤 셀이 수정되어야 하는지에 대한 매핑 규칙입니다.

## 기본 구조

### Grid Cell 렌더링 예시
```
A B C
a b D
a b E
F G H
f g I
f J K
```

### Hierarchical Cell 구조
```json
[
    { // ㄱ (루트 0)
        values: [],
        children: [
            { // ㄴ (자식 0)
                values: [],
                children: [
                    { // ㄷ (리프 0)
                        values: [],
                        children: []
                    },
                    { // ㄹ (리프 1)
                        values: [],
                        children: []
                    },
                    { // ㅁ (리프 2)
                        values: [],
                        children: []
                    }
                ]
            }
        ]
    },
    { // ㅂ (루트 1)
        values: [],
        children: [
            { // ㅅ (자식 0)
                values: [],
                children: [
                    { // ㅇ (리프 0)
                        values: [],
                        children: []
                    },
                    { // ㅈ (리프 1)
                        values: [],
                        children: []
                    }
                ]
            },
            { // ㅊ (자식 1)
                values: [],
                children: [
                    { // ㅋ (리프 0)
                        values: [],
                        children: []
                    }
                ]
            }
        ]
    }
]
```

## 매핑 규칙

### 1. 좌표계 정의
- **렌더링 좌표계**: `(rowIndex, colIndex)`
  - `rowIndex`: 렌더링 그리드의 행 인덱스 (0, 1, 2, ...)
  - `colIndex`: 렌더링 그리드의 열 인덱스 (깊이, 0, 1, 2, ...)

- **계층적 좌표계**: `(rootIndex, childIndex)`
  - `rootIndex`: 루트 셀의 인덱스 (0, 1, ...)
  - `childIndex`: 자식 셀의 인덱스 (0, 1, ...)

### 2. 매핑 테이블

| Grid Cell | 렌더링 좌표 | 수정되는 계층적 셀 | 계층적 좌표 |
|-----------|-------------|-------------------|-------------|
| A | (0,0) | ㄱ의 values | (0, -) |
| B | (0,1) | ㄴ의 values | (0, 0) |
| C | (0,2) | ㄷ의 values | (0, 0, 0) |
| a | (1,0) | ㄱ의 values | (0, -) |
| b | (1,1) | ㄴ의 values | (0, 0) |
| D | (1,2) | ㄹ의 values | (0, 0, 1) |
| a | (2,0) | ㄱ의 values | (0, -) |
| b | (2,1) | ㄴ의 values | (0, 0) |
| E | (2,2) | ㅁ의 values | (0, 0, 2) |
| F | (3,0) | ㅂ의 values | (1, -) |
| G | (3,1) | ㅅ의 values | (1, 0) |
| H | (3,2) | ㅇ의 values | (1, 0, 0) |
| f | (4,0) | ㅂ의 values | (1, -) |
| g | (4,1) | ㅅ의 values | (1, 0) |
| I | (4,2) | ㅈ의 values | (1, 0, 1) |
| f | (5,0) | ㅂ의 values | (1, -) |
| J | (5,1) | ㅊ의 values | (1, 1) |
| K | (5,2) | ㅋ의 values | (1, 1, 0) |

### 3. 매핑 알고리즘

#### 3.1 렌더링 좌표 → 계층적 좌표 변환
```typescript
function convertRenderToHierarchical(
  renderRowIndex: number,
  renderColIndex: number,
  hierarchicalCells: HierarchicalCell[]
): { rootIndex: number; childIndex: number | null } {
  // 1. renderRowIndex로 루트 셀 찾기
  const rootIndex = findRootIndexByRenderRow(renderRowIndex, hierarchicalCells);
  
  // 2. renderColIndex로 자식 셀 찾기
  const childIndex = findChildIndexByRenderCol(renderColIndex, hierarchicalCells[rootIndex]);
  
  return { rootIndex, childIndex };
}
```

#### 3.2 루트 셀 찾기
- 렌더링 그리드의 각 행은 특정 루트 셀에 속함
- rowspan으로 병합된 셀들은 같은 루트 셀을 참조

#### 3.3 자식 셀 찾기
- 렌더링 그리드의 열 인덱스는 트리의 깊이와 일치
- 깊이 0: 루트 셀의 values
- 깊이 1: 첫 번째 자식 셀의 values
- 깊이 2: 두 번째 자식 셀의 values

### 4. 특별한 경우

#### 4.1 rowspan 병합 셀
- 소문자 셀들 (a, b, f, g)은 부모 셀의 values를 수정
- 실제로는 같은 셀을 여러 행에서 참조

#### 4.2 리프 셀
- 대문자 셀들 (A~K)은 해당 깊이의 실제 셀 values를 수정
- 깊이가 깊을수록 더 구체적인 셀을 수정

## 구현 가이드

### 1. 함수 시그니처
```typescript
function updateDivisionCellByRenderPosition(
  block: FlowBlock,
  renderRowIndex: number,
  renderColIndex: number,
  elementIndex: number,
  value: any
): FlowBlock
```

### 2. 핵심 로직
1. 렌더링 좌표를 계층적 좌표로 변환
2. 해당 계층적 셀의 values[elementIndex] 업데이트
3. 불변성을 유지하며 새로운 블록 반환

### 3. 에러 처리
- 잘못된 좌표에 대한 방어 로직
- 존재하지 않는 셀에 대한 처리
- 배열 범위 초과에 대한 처리
