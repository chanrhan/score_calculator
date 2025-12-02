# DivisionBlock에 대한 규칙

## DB block 테이블의 header_cells 컬럼 값 규칙

[ 
    '헤더 셀의 Token key 값', ... 
]
- 배열 내 요소의 인덱스는 DivisionBlock의 열(col) 인덱스와 같아.
- DivisionBlock의 열 개수는 header_cells의 배열 길이이다. 

## DB block 테이블의 body_cells 컬럼 값 규칙
- 아래 json 형식을 따라야 함
[
    {
        values: [],
        children: [
            {
                values: [],
                children: [

                ]
            }
        ]
    },
    {
        values: [],
        children: [
                
        ]
    },
    {},...
]
- values 배열은 다른 블록에서와 동일하다

## 프론트엔드에서 DivisionBlock의 FlowBlock 구조
(기본적인 구조는 같고, header/body_cells의 json 구조만 다르다)
{
    header_cells: [ 
        '헤더 셀의 Token key 값 : string', ... 
    ],
    body_cells: [
        {
            values: [],
            children: [
                {
                    values: [],
                    children: [

                    ]
                }
            ]
        },
        {
            values: [],
            children: [
                    
            ]
        },
        {},...
    ]
}
- values[]에는 element_type[]이 들어간다. 

## DivisionBlock (FlowBlock) 초기 생성 규칙
- body_cells의 기본값은 아래와 같다. 
body_cells: [
    {
        values: [],
        children: []
    }
]


## 화면에서의 ComponentGrid에서 DivisionBlock Cell 렌더링할 떄의 규칙
- 각 열마다 header_cells의 구분 유형 key 마다 해다 열의 body_cell이 표시하는 셀 내용이 달라진다. (이미 구현되어 있을 듯 )
1. DivisionBlock의 리프 셀 개수를 찾는다.
[
    { // 셀 A
        values: [],
        children: [
            { // 셀 B
                values: [],
                children: [
                    { // 셀 C
                        values: [],
                        children: [

                        ]
                    },
                    { // 셀 D
                        values: [],
                        children: [

                        ]
                    },
                    { // 셀 E
                        values: [],
                        children: [

                        ]
                    }
                ]
            }
        ]
    },
    { // 셀 F
        values: [],
        children: [
            { // 셀 G
                values: [],
                children: [
                    { // 셀 H
                        values: [],
                        children: [

                        ]
                    },
                    { // 셀 I
                        values: [],
                        children: [

                        ]
                    }
                ]
            },
            { // 셀 J
                values: [],
                children: [
                    { // 셀 K
                        values: [],
                        children: [

                        ]
                    }
                ]
            }
        ]
    }
]
(셀 A,B,C,... 는 편의상 이름붙인 것이다)
- 위 예시 데이터에서의 리프 셀의 개수는 3개이다. 
- 트리의 depth가 열 인덱스인 셈이다. 
-- 무조건 모든 리프 셀은 같은 depth에 있어야 한다. 
3. 자식이 있는 부모 셀은 자식 셀의 개수만큼 rowspan을 한다. 
- 위 예시 데이터에서는 각 셀의 렌더링 배치는 아래와 같다.
- 대문자 알파벳은 셀 이름이고, 소문자 알파벳은 rowspan 된 셀의 표시이다.
(_ 는 헤더 셀이다)
ex) 예시 1번 
_ _ _ 
A B C
a b D
a b E
F G H
f g I
f J K

## 행, 열 추가 규칙

### 행 추가 규칙
- DivisionBlock의 셀의 하단 측면을 클릭하면 행이 추가된다.
- DivisionBlock에서의 행 추가는 자식 '형제 셀 추가'와 같다.
1) '예시 1번에서 3행 1열의 a 셀에 행 추가를 했다면 결과는 아래처럼 된다.
ex) 예시 2번 
_ _ _ 
A B C
a b D
a b E
L M N
F G H
f g I
f J K

- 데이터 구조는 아래처럼 된다. 
[
    { // 셀 A
        values: [],
        children: [
            { // 셀 B
                values: [],
                children: [
                    { // 셀 C
                        values: [],
                        children: [

                        ]
                    },
                    { // 셀 D
                        values: [],
                        children: [

                        ]
                    },
                    { // 셀 E
                        values: [],
                        children: [

                        ]
                    }
                ]
            }
        ]
    },
    { // 셀 F
        values: [],
        children: [
            { // 셀 G
                values: [],
                children: [
                    { // 셀 H
                        values: [],
                        children: [

                        ]
                    },
                    { // 셀 I
                        values: [],
                        children: [

                        ]
                    }
                ]
            },
            { // 셀 J
                values: [],
                children: [
                    { // 셀 K
                        values: [],
                        children: [

                        ]
                    }
                ]
            }
        ]
    },
    { // 셀 L
        values: [],
        children: [
            { // 셀 M
                values: [],
                children: [
                    { // 셀 N
                        values: [],
                        children: [

                        ]
                    }
                ]
            }
        ]
    }
]

2) '예시 1번에서 3행 2열의 b 셀에 행 추가를 했다면 결과는 아래처럼 된다.
ex) 예시 3번 
_ _ _ 
A B C
a b D
a b E
a L M
F G H
f g I
f J K

- 데이터 구조는 아래처럼 된다. 
[
    { // 셀 A
        values: [],
        children: [
            { // 셀 B
                values: [],
                children: [
                    { // 셀 C
                        values: [],
                        children: [

                        ]
                    },
                    { // 셀 D
                        values: [],
                        children: [

                        ]
                    },
                    { // 셀 E
                        values: [],
                        children: [

                        ]
                    }
                ]
            },
             { // 셀 L
                values: [],
                children: [
                    { // 셀 M
                        values: [],
                        children: []
                    }
                ]
            }
        ]
    },
    { // 셀 F
        values: [],
        children: [
            { // 셀 G
                values: [],
                children: [
                    { // 셀 H
                        values: [],
                        children: [

                        ]
                    },
                    { // 셀 I
                        values: [],
                        children: [

                        ]
                    }
                ]
            },
            { // 셀 J
                values: [],
                children: [
                    { // 셀 K
                        values: [],
                        children: [

                        ]
                    }
                ]
            }
        ]
    }
]


3) '예시 1번에서 3행 3열의 E 셀에 행 추가를 했다면 결과는 아래처럼 된다.
ex) 예시 4번 
_ _ _ 
A B C
a b D
a b E
a b L
F G H
f g I
f J K

- 데이터 구조는 아래처럼 된다. 
[
    { // 셀 A
        values: [],
        children: [
            { // 셀 B
                values: [],
                children: [
                    { // 셀 C
                        values: [],
                        children: [

                        ]
                    },
                    { // 셀 D
                        values: [],
                        children: [

                        ]
                    },
                    { // 셀 E
                        values: [],
                        children: [

                        ]
                    },
                    { // 셀 L
                        values: [],
                        children: [

                        ]
                    }
                ]
            }
        ]
    },
    { // 셀 F
        values: [],
        children: [
            { // 셀 G
                values: [],
                children: [
                    { // 셀 H
                        values: [],
                        children: [

                        ]
                    },
                    { // 셀 I
                        values: [],
                        children: [

                        ]
                    }
                ]
            },
            { // 셀 J
                values: [],
                children: [
                    { // 셀 K
                        values: [],
                        children: [

                        ]
                    }
                ]
            }
        ]
    }
]

### 열 추가 규칙
- 열 추가 시 그냥 열이 하나 추가된다. 
1) '예시 1번에서 열 추가를 했다면 결과는 아래처럼 된다.
ex) 예시 5번 
_ _ _ 
A B C L
a b D M
a b E N
F G H O
f g I P
f J K Q


- 데이터 구조는 아래처럼 된다. 
[
    { // 셀 A
        values: [],
        children: [
            { // 셀 B
                values: [],
                children: [
                    { // 셀 C
                        values: [],
                        children: [
                            { // 셀 L
                                values: [],
                                children: [

                                ]
                            }
                        ]
                    },
                    { // 셀 D
                        values: [],
                        children: [
                            { // 셀 M
                                values: [],
                                children: [

                                ]
                            }
                        ]
                    },
                    { // 셀 E
                        values: [],
                        children: [
                            { // 셀 N
                                values: [],
                                children: [

                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },
    { // 셀 F
        values: [],
        children: [
            { // 셀 G
                values: [],
                children: [
                    { // 셀 H
                        values: [],
                        children: [
                            { // 셀 O
                                values: [],
                                children: [

                                ]
                            }
                        ]
                    },
                    { // 셀 I
                        values: [],
                        children: [
                            { // 셀 P
                                values: [],
                                children: [

                                ]
                            }
                        ]
                    }
                ]
            },
            { // 셀 J
                values: [],
                children: [
                    { // 셀 K
                        values: [],
                        children: [
                            { // 셀 Q
                                values: [],
                                children: [

                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }
]

## 계층적 셀 데이터구조(json)을 셀 렌더링에 적용하기
[
    { // 셀 A
        values: [],
        children: [
            { // 셀 B
                values: [],
                children: [
                    { // 셀 C
                        values: [],
                        children: [

                        ]
                    },
                    { // 셀 D
                        values: [],
                        children: [

                        ]
                    },
                    { // 셀 E
                        values: [],
                        children: [

                        ]
                    }
                ]
            }
        ]
    },
    { // 셀 F
        values: [],
        children: [
            { // 셀 G
                values: [],
                children: [
                    { // 셀 H
                        values: [],
                        children: [

                        ]
                    },
                    { // 셀 I
                        values: [],
                        children: [

                        ]
                    }
                ]
            },
            { // 셀 J
                values: [],
                children: [
                    { // 셀 K
                        values: [],
                        children: [

                        ]
                    }
                ]
            }
        ]
    }
]
다른 블록들의 셀 렌더링 방식과 동일하게 이미 만들어진 N * M 그리드 셀들에
값을 채우는 방식이다.
- 모든 셀의 부분 트리의 리프 셀 수를 미리 계산한 후, 1열 1행, 1열 2행, 1열 3행,... 2열 1행, 2열 2행,... 이런 식으로 열 순서대로 렌더링한다. 병합은 rowspan으로 처리한다.
- 각 셀의 내용은 해당 셀이 위치한 열에 따라 달라진다. 열 인덱스에 해당하는 구분 블록의 header_cells 인덱스의 값이 해당 열의 구분 유형이고, 이에 따라 셀에 채워지는 cell element type이 달라진다. 