## 구분 헤드(Division Head) 구조 정의
- `component_grid` 테이블 내 컬럼인 `division_head_header`, `division_head_body` 데이터 구조에 대한 정의 명세

## 구분 헤드 헤더 (division_head_header)
- 1행 * M열 구조  
- 아래는 예시 구조
[
  {
    "division_type": "graduateGrade"
  },
  {
    "division_type": "subjectSeparationCode"
  }
]

## 구분 헤드 바디 (division_head_body)
- N행 * M열 구조
- 아래는 예시 구조 
    - rowspan은 모든 셀에 포함된 속성
[
  [
    {
      "rowspan": 3
    },
    {
      "rowspan": 1,
      "subject_groups": [
        "국어"
      ]
    }
  ],
  [
    {
      "rowspan": 0
    },
    {
      "codes": [
        "01"
      ],
      "rowspan": 1,
      "subject_groups": [
        "국어",
        "영어"
      ]
    }
  ],
  [
    {
      "rowspan": 0
    },
    {
      "rowspan": 1
    }
  ]
]