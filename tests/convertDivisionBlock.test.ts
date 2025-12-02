import { describe, it, expect } from 'vitest'
import { convertGridToHierarchical } from '@/lib/adapters/componentGridDb'

describe('convertDivisionBlock', () => {
  it('convertDivisionBlock should convert division block', () => {
    const before = [
        [
            {
                "values": [
                    [
                        "01"
                    ]
                ],
                "rowspan": 1
            },
            {
                "values": [
                    [
                        "61"
                    ]
                ],
                "rowspan": 1
            }
        ],
        [
            {
                "values": [
                    null
                ],
                "rowspan": 0
            },
            {
                "values": [
                    [
                        "62"
                    ]
                ],
                "rowspan": 1
            }
        ],
        [
            {
                "values": [
                    null
                ],
                "rowspan": 0
            },
            {
                "values": [
                    [
                        "11"
                    ]
                ],
                "rowspan": 1
            }
        ]
    ]
    const after = [
        {
            "id": "",
            "type": "",
            "level": 0,
            "values": [
                [
                    "01"
                ]
            ],
            "rowIndex": 0,
            "colIndex": 0,
            "children": [
                {
                    "id": "",
                    "type": "",
                    "level": 0,
                    "values": [
                        [
                            "61"
                        ]
                    ],
                    "rowIndex": 0,
                    "colIndex": 1,
                    "children": []
                },
                {
                    "id": "",
                    "type": "",
                    "level": 0,
                    "values": [
                        [
                            "62"
                        ]
                    ],
                    "rowIndex": 0,
                    "colIndex": 1,
                    "children": []
                },
                {
                    "id": "",
                    "type": "",
                    "level": 0,
                    "values": [
                        [
                            "11"
                        ]
                    ],
                    "rowIndex": 0,
                    "colIndex": 1,
                    "children": []
                }
            ]
        }
    ]
    const result = convertGridToHierarchical(before)
    expect(result).toEqual(after)
  })

  
})


