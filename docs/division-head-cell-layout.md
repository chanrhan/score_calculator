# 구분 헤드의 바디 셀 레이아웃

## 졸업년도 (graduateYear)
- body properties
    - year: number {InputField=type:number}
    - compare_option: string {Token=menu_key:compare_option}

## 졸업학년 (graduateGrade)
- body properties
    - grade: string {Token=menu_key:grade}

## 교과군 (subjectGroup)
- body properties
    - subject_groups: Array<string> {List=item_type:{Token=menu_key:subject_group}}

## 모집전형 (admissionCode)
- body properties
    - codes: Array<string> {List=item_type:{Token=menu_key:admission_code}}

## 모집단위 (majorCode)
- body properties
    - codes: Array<string> {List=item_type:{Token=menu_key:major_code}}

## 지원자 유형 (applicantScCode)
- body properties
    - type: string {Token=menu_key:applicant_sc_code}

## 과목구분 (subjectSeparationCode)
- body properties
    - codes: Array<string> {List=item_type:{Token=menu_key:subject_separation_code}}

## 교과군별 이수단위 합 (subjectGroupUnitSum)
- body properties
    - value: number {InputField=type:number}

## 필터링된 블록 ID (filtered_block_id)
- body properties
    - value: number {InputField=type:number}