New Refactoring

# 컴포넌트 노드 (FlowComponentNode)
- React-flow의 Node이다.
- Header와 Body로 나뉘어져 있다. 
- Header와 Body는 Cell이 배치된 Grid로 이루어져 있다.
- 각 Cell 안의 내용은 블록마다 다르다.
- Componet는 내부 변수로 block의 배열(blocks[])을 가지고 있다.
- 보유하고 있는 block의 정보에 따라 Component의 Header/Body Grid의 Cell이 채워진다. 
-- Block Type의 Header의 Cell 정보는 Component의 Header에, Body의 Cell정보는 Component Body에 채워진다.
- Component 내의 Grid는 (결합, 삭제 시) 보유한 Blocks에 따라 동적으로 늘어난다. 
- Component Grid 내의 배치는 각 Block의 열 길이에 따라 자동으로 계산되어 배치된다. 
-- Block이 3개 있고, 각각 너비가 (4, 3, 1) 이라면, 1번 블록은 1번 열에, 2번 블록은 5번 열에, 3번 블록은 1번 열을 기준으로 표시된다. 
- Header Grid의 첫 행(row)은 각 블록의 블록명을 적는 곳이다.
-- 각 블록이 시작하는 열(col)의 첫 행(row)에 속하는 Cell에 블록명을 표시한다. 
--- 기존의 결합 버튼은 해당 Cell에 위치하도록 한다. 
- 구분 블록 (Division Block)의 경우, 계층 구조를 이룰 수 있게 해야 한다. (기존의 방식처럼)

# 블록 (FlowBlock)
- Node가 아니다. 따라서 드래그할 수도 없다.
- react-component로 존재하지 않으며 (캔버스에 배치할 수 없다) 객체(type)와 인스턴스로만 존재한다.
- 블록은 데이터로만 이루어져 있으며, 무조건 컴포넌트에 하위에 존재한다. 
- 블록의 데이터는 header와 body로 이루어져 있다. 
- 블록의 타입 구조체 예시
Block Type (ex. ApplyTermBlock)
{
    name : 'ApplyTerm'
    headers : [ // Row
        {
            // Cell
            [
                {
                    // Cell Element
                }
            ]
        }
    ],
    body: [ // Rows
        [ // Row
            { // Cell
                [
                    {
                        // Cell Element
                    }
                ]
            }
        ]
    ]
}

# Cell, Cell Element
- Cell 내부에는 여러 Cell Element 들이 있다. 
- Cell Element들이 배치된 순서대로 셀에서 배치되서 화면에 보여진다. 

## Cell Element 유형

### Cell Element의 공통 속성
element_type : string = Element의 속성명
optional : boolean = 선택사항 여부, false이면, 기본값으로는 화면에서 가려졌다가 선택적으로 화면에 표시할 수 있다.
visible : boolean = 화면에 보여지는 여부, optional=true이면 visible도 무조건 true이다. optional=false일 경우, 선택적으로 화면에 표시되면 true가 된다.


### Token
{
    // 공통 속성 
    items: [
        {
            name : // 드롭다운 메뉴에 표시될 항목 이름
            var : //변수 이름
        }
    ]
    value: // 선택된 var 값 
}

### Text
{
    // 공통 속성 
    content: // 텍스트 
}

### Table
{
    // 공통 속성 
    init_rows: 2, // 초기 행 수 
    init_cols: 3, // 초기 열 수 
    input_type: '석차등급',
    input_option: 'range', // optional
    output_type: '성취도등급',
    value: [
        [
            // table 값들 
            // input_option='range' 일 경우, input 행은 테이블 내 2개 셀이 하나의 값을 의미한다. [1,2,3,4]일 경우, 1~2, 3~4 이다. 
        ]
    ]
}

### Formula
{
    // 공통 속성
    value : // DSL 수식 
}
InputFieldExample
{
    // 공통 속성
  content: '', // 자유 입력값
};

# Block Types

// 1) 반영교과
const ApplySubjectBlock = {
  name: 'ApplySubject',
  color: 'blue',
  headers: [
    [
      {
        elements: [
          { element_type: 'Text', optional: false, visible: true, content: '반영교과' },
          {
            element_type: 'Token',
            optional: false,
            visible: true,
            items: [
              { name: '포함', var: 'include' },
              { name: '제외', var: 'exclude' },
            ],
            value: 'include',
          },
        ],
      },
    ],
  ],
  body: [
    [
      {
        elements: [
          {
            element_type: 'Token',
            optional: false,
            visible: true,
            items: [], // subjectGroup 목록(DB 주입)
            value: null,
          },
        ],
      },
    ],
  ],
};

// 2) 반영학기
const ApplyTermBlock = {
  name: 'ApplyTerm',
  color: 'blue',
  headers: [
    [
      {
        elements: [
          { element_type: 'Text', optional: false, visible: true, content: '반영학기' },
          {
            element_type: 'Token',
            optional: false,
            visible: true,
            items: [
              { name: '포함', var: 'include' },
              { name: '제외', var: 'exclude' },
            ],
            value: 'include',
          },
        ],
      },
    ],
  ],
  body: [
    [
      {
        elements: [
          { element_type: 'Text', optional: false, visible: true, content: '학기 선택' },
          { element_type: 'Token', optional: false, visible: true, items: [{ name: '1-1 ON', var: '1-1:on' }, { name: '1-1 OFF', var: '1-1:off' }], value: '1-1:on' },
          { element_type: 'Token', optional: false, visible: true, items: [{ name: '1-2 ON', var: '1-2:on' }, { name: '1-2 OFF', var: '1-2:off' }], value: '1-2:on' },
          { element_type: 'Token', optional: false, visible: true, items: [{ name: '2-1 ON', var: '2-1:on' }, { name: '2-1 OFF', var: '2-1:off' }], value: '2-1:on' },
          { element_type: 'Token', optional: false, visible: true, items: [{ name: '2-2 ON', var: '2-2:on' }, { name: '2-2 OFF', var: '2-2:off' }], value: '2-2:on' },
          { element_type: 'Token', optional: false, visible: true, items: [{ name: '3-1 ON', var: '3-1:on' }, { name: '3-1 OFF', var: '3-1:off' }], value: '3-1:on' },
          { element_type: 'Token', optional: false, visible: true, items: [{ name: '3-2 ON', var: '3-2:on' }, { name: '3-2 OFF', var: '3-2:off' }], value: '3-2:on' },
          // 옵션: 우수 N학기
          {
            element_type: 'Token',
            optional: true,
            visible: true,
            items: [
              { name: '우수 1학기', var: 'top:1' }, { name: '우수 2학기', var: 'top:2' },
              { name: '우수 3학기', var: 'top:3' }, { name: '우수 4학기', var: 'top:4' },
              { name: '우수 5학기', var: 'top:5' }, { name: '우수 6학기', var: 'top:6' },
            ],
            value: null,
          },
        ],
      },
    ],
  ],
};

// 3) 우수 N 과목
const TopSubjectBlock = {
  name: 'TopSubject',
  color: 'blue',
  headers: [[{ elements: [{ element_type: 'Text', optional: false, visible: true, content: '우수 N 과목' }] }]],
  body: [
    [
      {
        elements: [
          { element_type: 'Token', optional: true, visible: true, items: [{ name: '전체', var: 'overall' }, { name: '교과군별', var: 'perGroup' }], value: 'overall' },
          { element_type: 'Token', optional: false, visible: true, items: [{ name: '1', var: '1' }, { name: '2', var: '2' }, { name: '3', var: '3' }, { name: '5', var: '5' }, { name: '10', var: '10' }], value: '3' },
        ],
      },
    ],
  ],
};

// 4) 교과군별 반영비율(헤더에 블록명 없음, 1행만 사용)
const SubjectGroupRatioBlock = {
  name: 'SubjectGroupRatio',
  color: 'blue',
  headers: [
    [
      {
        elements: [
          // 각 열의 헤더가 교과군 토큰(열은 동적 추가/삭제)
          { element_type: 'Token', optional: false, visible: true, items: [], value: null }, // subjectGroup(DB 주입)
        ],
      },
      // 열 추가 시 동일 패턴으로 셀 추가
    ],
  ],
  body: [
    [
      {
        elements: [
          // 비율 0~100
          {
            element_type: 'Token',
            optional: false,
            visible: true,
            items: [{ name: '0', var: '0' }, { name: '25', var: '25' }, { name: '50', var: '50' }, { name: '75', var: '75' }, { name: '100', var: '100' }],
            value: '100',
          },
        ],
      },
      // 열 추가 시 동일 패턴
    ],
  ],
};

// 5) 과목구분별 반영비율(헤더에 블록명 없음, 1행만 사용)
const SeparationRatioBlock = {
  name: 'SeparationRatio',
  color: 'blue',
  headers: [
    [
      { elements: [{ element_type: 'Text', optional: false, visible: true, content: '일반교과' }] },
      { elements: [{ element_type: 'Text', optional: false, visible: true, content: '진로선택과목' }] },
      { elements: [{ element_type: 'Text', optional: false, visible: true, content: '예체능교과' }] },
    ],
  ],
  body: [
    [
      { elements: [{ element_type: 'Token', optional: false, visible: true, items: [{ name: '0', var: '0' }, { name: '25', var: '25' }, { name: '50', var: '50' }, { name: '75', var: '75' }, { name: '100', var: '100' }], value: '100' }] },
      { elements: [{ element_type: 'Token', optional: false, visible: true, items: [{ name: '0', var: '0' }, { name: '25', var: '25' }, { name: '50', var: '50' }, { name: '75', var: '75' }, { name: '100', var: '100' }], value: '100' }] },
      { elements: [{ element_type: 'Token', optional: false, visible: true, items: [{ name: '0', var: '0' }, { name: '25', var: '25' }, { name: '50', var: '50' }, { name: '75', var: '75' }, { name: '100', var: '100' }], value: '100' }] },
    ],
  ],
};

// 6) 학년별 반영비율(헤더에 블록명 없음, 1행만 사용)
const GradeRatioBlock = {
  name: 'GradeRatio',
  color: 'blue',
  headers: [
    [
      { elements: [{ element_type: 'Text', optional: false, visible: true, content: '1학년' }] },
      { elements: [{ element_type: 'Text', optional: false, visible: true, content: '2학년' }] },
      { elements: [{ element_type: 'Text', optional: false, visible: true, content: '3학년' }] },
    ],
  ],
  body: [
    [
      { elements: [{ element_type: 'Token', optional: false, visible: true, items: [{ name: '0', var: '0' }, { name: '25', var: '25' }, { name: '50', var: '50' }, { name: '75', var: '75' }, { name: '100', var: '100' }], value: '100' }] },
      { elements: [{ element_type: 'Token', optional: false, visible: true, items: [{ name: '0', var: '0' }, { name: '25', var: '25' }, { name: '50', var: '50' }, { name: '75', var: '75' }, { name: '100', var: '100' }], value: '100' }] },
      { elements: [{ element_type: 'Token', optional: false, visible: true, items: [{ name: '0', var: '0' }, { name: '25', var: '25' }, { name: '50', var: '50' }, { name: '75', var: '75' }, { name: '100', var: '100' }], value: '100' }] },
    ],
  ],
};

// 7) 배점표
const ScoreMapBlock = {
  name: 'ScoreMap',
  color: 'blue',
  headers: [[{ elements: [{ element_type: 'Text', optional: false, visible: true, content: '배점표' }] }]],
  body: [
    [
      {
        elements: [
          { element_type: 'Token', optional: false, visible: true, items: [
            { name: '석차등급', var: 'rankingGrade' }, { name: '성취도등급', var: 'achievement' },
            { name: '평어등급', var: 'assessment' }, { name: '원점수', var: 'originalScore' }, { name: '배점', var: 'score' }
          ], value: 'originalScore' },
          { element_type: 'Token', optional: false, visible: true, items: [{ name: '일치', var: 'exact' }, { name: '범위', var: 'range' }], value: 'range' },
          { element_type: 'Text', optional: false, visible: true, content: '→' },
          { element_type: 'Token', optional: false, visible: true, items: [
            { name: '석차등급', var: 'rankingGrade' }, { name: '성취도등급', var: 'achievement' },
            { name: '평어등급', var: 'assessment' }, { name: '원점수', var: 'originalScore' }, { name: '배점', var: 'score' }
          ], value: 'score' },
          { element_type: 'Token', optional: false, visible: true, items: [{ name: '일치', var: 'exact' }, { name: '범위', var: 'range' }], value: 'exact' },
          {
            element_type: 'Table',
            optional: false,
            visible: true,
            init_rows: 2,
            init_cols: 3,
            input_type: '원점수',
            input_option: 'range',
            output_type: '배점',
            value: [[], []], // 1행 입력, 2행 출력
          },
        ],
      },
    ],
  ],
};

// 8) 수식
const FormulaBlock = {
  name: 'Formula',
  color: 'blue',
  headers: [[{ elements: [{ element_type: 'Text', optional: false, visible: true, content: '수식' }] }]],
  body: [
    [
      { elements: [{ element_type: 'Formula', optional: false, visible: true, value: '' }] },
    ],
  ],
};

// 9) 변수(변수명은 InputField 사용)
const VariableBlock = {
  name: 'Variable',
  color: 'red',
  headers: [[{ elements: [{ element_type: 'Text', optional: false, visible: true, content: '변수' }] }]],
  body: [
    [
      {
        elements: [
          { element_type: 'InputField', optional: false, visible: true, content: 'varName' }, // 변수명
          { element_type: 'Formula', optional: false, visible: true, value: '' },            // 저장할 DSL 값
        ],
      },
    ],
  ],
};

// 10) 조건(반환값은 boolean)
const ConditionBlock = {
  name: 'Condition',
  color: 'purple',
  headers: [[{ elements: [{ element_type: 'Text', optional: false, visible: true, content: '조건' }] }]],
  body: [
    [
      { elements: [{ element_type: 'Formula', optional: false, visible: true, value: '' }] },
    ],
  ],
};






