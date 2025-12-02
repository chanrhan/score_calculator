# 성적 계산 흐름
1. DB에서 데이터 불러오기
2. 파이프라인 내 ComponentGrid를 순차적으로 실행
3. ComponentGrid 내 케이스(Case)를 순차적으로 실행
4. 결과 저장 

## 개요
- ComponentGrid, case, block의 모든 입출력 데이터 객체는 Context이다.

### Context
```typescript
{
    identifyNumber : number,
    admissionCode : string,
    majorCode : string,
    graduateYear : number,
    applicantScCode : number,
    finalScore : number,
    finalRank: number,
    subjects: Subject[],
    vars : Map<string, string>
}
```

### Subject
```typescript
{
    grade: number,
    term: number,
    unit: number,
    organizationCode : string,
    courceCode : string,
    subjectCode : string,
    assessment : string,
    achievement : string,
    achievementRatio : string,
    studentCount : number,
    originalSocre : number,
    avgScore : number,
    standardDeviation : number,
    rankingGrade : number,
    subjectSeparationCode : string,
    filtered_block_id : number,
    score : number
}
```

### 최종적으로 grade_results 테이블에 저장되는 컬럼 구조
- prisma/scheme.prisma 파일의 grade_results 테이블 구조와 같다. 

## 1. DB에서 데이터 불러오기

### 1-1. 학생, 과목 데이터 불러오기
- 모든 student_base_info와 모든 subject_score 을 가져오기 (subject_score의 전체 레코드 개수는 약 12만개)
-- where 조건 없이 select 해야 함 
- 가져온 과목 데이터를 학생별로 그룹화 (identifyNumber가 학생의 식별번호)

### 1-2. 부가 데이터 불러오기
- 모든 Token_menu/items 데이터를 불러오기
-- where 조건 : univ_id 
- 불러온 token_menu는 전역 store 형태로 저장되어, 성적 계산 로직 내의 어느 함수에도 접근할 수 있어야 함 
-- token_menu는 key-value 형태 

### 1-3. 계산 데이터 불러오기
- 현재 pipeline_id에 해당하는 component_grid들과 block들 데이터를 불러오기


## 2. 파이프라인 내 ComponentGrid를 순차적으로 실행
- 순서에 맞게 componentGrid별로 순차적으로 executeComponentGrid 실행 

## 3. ComponentGrid 내 케이스(Case)를 순차적으로 실행
- 케이스(Case) : 구분 블록의 리프 셀 별로 실행하는 블록들의 행 단위 

### 3-1. DFS 탐색 
- 구분 블록의 body_cells는 트리(tree) 구조이므로, DFS 탐색을 통해 케이스를 실행한다.
1) 방문한 셀에서의 조건에 맞는 과목들을 별도의 배열로 따로 필터링하고, 탐색을 이어간다.
- 현재 Context의 subject[]를 복사한 후, 조건에 맞지 않은 과목들은 필터링한다. 
2) 리프 셀을 방문하면, 필터링된 copy_subject[]를 가지고 케이스(블록 실행기들)를 실행한다.
3) 이번 DFS 탐색에서 N번쨰로 방문한 리프 셀은, ComponentGrid 내의 (구분 블록 제외) A블록의 N번째 행, B블록의 N번째 행, C블록의 N번째 행들을 순차적으로 실행한다. 
4) 각 블록별 실행기는 Context, copy_subject[], 그리고 N번쨰 행의 values[] (또는 values[][], 열이 2개 이상인 경우) 를 입력으로 받고, Context, copy_subject[]를 출력한다. 
5)  하나의 케이스 실행이 종료되면, copy_subject[]를 원본 Context의 subject[] 에 수정을 적용하고, 다시 DFS 탐색을 이어간다. (1~4번 반복)

## 4. 결과 저장 
- 결과(result)는 하나의 학생들 단위로 모아서 저장해놓았다가, 배치(batch)로 처리하도록 한다. 
- grade_results 테이블에 저장해야 한다.

# 화면 UI 요구사항
- 파이프라인 편집 페이지에서, '저장'버튼 왼쪽에 '계산 시작' 버튼 추가
-- 해당 버튼을 누르면 계산 로직이 실행됨 

- '성적 계산 결과' 페이지 생성 
-- grade_results 테이블의 레코드들을 목록 형태로 보여주는 페이지

# 구현 요구사항
1. 성적 계산 코드의 '뼈대'를 만드는 것에 집중할 것
2. 모듈화 
3. 블록 실행기 내부 로직 코드는 작성하지 말고 비워둘 것. (필요하다면 주석만)
