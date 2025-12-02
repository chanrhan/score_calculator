# 데이터 구조 
## 계층적 셀 구조 (Hierachial Cell)
- 트리 구조 
```json
body_cells : [
    { // 셀 ㄱ 
        "values": [],
        "children" : [
            { // 셀 ㄴ
                "valaues" : [],
                "children" : [
                    { // 셀 ㄷ
                        "values" : [],
                        "children" : []
                    }
                ]
            },
            { // 셀 ㄹ
                "valaues" : [],
                "children" : [

                ]
            },
            ...
        ]
    },
    { // 셀 ㅁ
        "values": [],
        "children" : [

        ]
    },
    ...
]
```

## 그리드 셀 구조 (Grid Cell)
- 2차원 배열 구조 

```typescript
body_cells: [
    [ // 1행
        { // 1행 1열의 셀, 셀 A
            "rowspan" : number,
            "values" : []
        },
        { // 1행 2열의 셀, 셀 B
            "rowspan" : number,
            "values" : []
        },
        ...
    ],
    [ // 2행
        { // 2행 1열의 셀, 셀 C
            "rowspan" : number,
            "values" : []
        },
        { // 2행 2열의 셀, 셀 D 
            "rowspan" : number,
            "values" : []
        },
        ...
    ],
    ...
]
```

### 그리드 셀 추가 설명 
- 

# 데이터 변환 