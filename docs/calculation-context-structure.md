# Context, Subject 및 Scope 명세서

## 개요

점수 계산 시스템에서 사용되는 핵심 데이터 구조인 `Context`(학생)와 `Subject`(과목)의 구조 및 `Scope` 개념에 대해 설명합니다.

---

## 1. 데이터 구조

### 1.1 Context (학생)

`Context`는 한 명의 학생 정보를 나타내는 최상위 데이터 구조입니다.

```typescript
export type Context = {
  identifyNumber: number; // 식별번호
  admissionCode: string; // 전형 코드
  majorCode: string; // 단위 코드
  graduateYear: number; // 졸업년도
  graduateGrade: number; // 졸업학년
  applicantScCode: number; // 지원자 유형
  finalScore: number; // 최종점수
  finalRank: number; // 최종등수
  subjects: Subject[]; // 학생이 이수한 과목들
  vars: VarsScope; // 학생 내부 변수
  snapshot?: Snapshot[]; // 로깅용 (선택)
};
```

### 1.2 Subject (과목)

`Subject`는 학생이 이수한 개별 과목의 정보를 나타내는 데이터 구조입니다.

```typescript
export type Subject = {
  yearterm: number; // 과목이 이수된 학년-학기 정보 (예: 1-2, 3-1 등)
  seqNumber: number; // 과목별 시퀀스 번호
  grade: number; // 이수된 학년 (1, 2, 3)
  term: number; // 이수된 학기 (1, 2)
  unit: number; // 이수학점
  organizationCode: string; // 편제코드
  subjectGroup: string; // 교과군 (국어, 수학, 영어, 과학, 체육 등, TokenMenu 참고)
  subjectName: string; // 과목명
  courseCode: string; // 교과코드
  subjectCode: string; // 과목코드
  assessment: string; // 평어점수 (수, 우, 미, 양, 가)
  achievement: string; // 성취도점수 (A, B, C, D, E)
  achievementRatio: string; // 성취도 비율
  studentCount: number; // 동일 과목 이수 학생 수
  originalScore: number; // 원점수 (예: 89)
  avgScore: number; // 평균점수
  standardDeviation: number; // 표준편차
  rankingGrade: number; // 석차등급 (1~9)
  subjectSeparationCode: string; // 과목구분코드 (00, 01, 02, 03)
  filtered_block_id: number; // 필터링된 블록 ID
  score: number | null; // 기준점수
  vars?: Map<string, any>; // 과목 내부 변수 (선택)
  snapshot: Snapshot[]; // 로깅용
};
```

---

## 2. Scope 개념

### 2.1 Scope의 정의

파이프라인 편집 페이지에서 각 블록의 헤더 셀에는 `var_scope` 속성이 있습니다. 이 속성은 해당 블록 내에서 사용 가능한 변수의 범위를 지정합니다.

- **학생(Student)**: `Context` 레벨의 속성 및 변수 사용/저장
- **과목(Subject)**: `Subject` 레벨의 속성 및 변수 사용/저장

### 2.2 Scope의 동작 방식

1. **변수 사용 제한**: `var_scope`가 지정되면, 해당 scope 내의 속성들만 사용할 수 있습니다.
2. **변수 저장 위치**: 변수 저장 시 `var_scope` 값에 따라 다음 위치에 저장됩니다.
   - `Student` scope → `Context.vars`
   - `Subject` scope → `Subject.vars`

### 2.3 Token Menu와의 관계

- 파이프라인 편집 페이지에서 `var_scope`가 학생/과목으로 지정된 블록의 바디 셀에서는, 해당 scope 내의 항목들만 Token 드롭다운 메뉴에 표시됩니다.
- 이를 통해 사용자는 scope에 맞는 변수만 선택할 수 있습니다.

---

## 3. UI 요구사항

### 3.1 변수 목록 패널

파이프라인 편집 페이지 좌측에 학생 및 과목의 현재 변수 목록을 표시하는 패널을 구현해야 합니다.

#### 표시 규칙
- ✅ `snapshot`은 표시하지 않음
- ✅ `vars` 내부의 속성도 함께 표시
- ✅ 모든 속성을 표시하는 것이 아니라, 사용자에게 필요한 속성만 표시
- ✅ 속성의 **값이 아닌 속성명만** 표시
- ✅ 파이프라인 변수가 추가되면 해당 목록에도 즉시 반영
- ✅ 사용자가 추가한 변수는 구별 가능하도록 표시

#### 표시 형식

다음 목록을 한글로 표시하는 UI로 구현합니다.

**학생 (Student)**
- 전형 코드
- 단위 코드
- 졸업년도
- 졸업학년
- 지원자 유형
- 최종점수
- {학생 내부 변수1}
- {학생 내부 변수2}
- ...

**과목 (Subject)**
- 이수 학년
- 이수 학기
- 이수 학점
- 편제코드
- 교과군
- 과목명
- 평어점수
- 성취도점수
- 성취도비율
- 동일 과목 이수 학생 수
- 원점수
- 평균점수
- 표준편차
- 석차등급
- 과목구분코드
- 필터링된 블록 ID
- {과목 내부 변수1}
- {과목 내부 변수2}
- ...