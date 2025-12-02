# 1번 문제

1) Grid Cell 
(소문자 셀은 병합된 셀임. 계층 셀에는 대응되지 않는 셀임.)
A B C
a b D
a b E
F G H
f g I
f J K

2) Hierarchical Cell
[
    { // 셀 ㄱ 
        values: [],
        children: [
            { // 셀 ㄴ
                values: [],
                children: [
                    { // 셀 ㄷ
                        values: [],
                        children: [

                        ]
                    },
                    { // 셀 ㄹ
                        values: [],
                        children: [

                        ]
                    },
                    { // 셀 ㅁ
                        values: [],
                        children: [

                        ]
                    }
                ]
            }
        ]
    },
    { // 셀 ㅂ
        values: [],
        children: [
            { // 셀 ㅅ
                values: [],
                children: [
                    { // 셀 ㅇ
                        values: [],
                        children: [

                        ]
                    },
                    { // 셀 ㅈ
                        values: [],
                        children: [

                        ]
                    }
                ]
            },
            { // 셀 ㅊ
                values: [],
                children: [
                    { // 셀 ㅋ
                        values: [],
                        children: [

                        ]
                    }
                ]
            }
        ]
    }
]

# 그리드 - 계층 셀 매핑 규칙
- 그리드 셀의 N행 M열의 경우, M
