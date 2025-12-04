# 블록 모듈 시스템

각 블록 타입의 A(구조), B(인스턴스), C(레이아웃)를 한 곳에 모아 관리하는 모듈 시스템입니다.

## 구조

```
lib/blocks/modules/
├── ApplySubject/
│   ├── structure.ts    # A 타입: 블록 구조 정의
│   ├── instance.ts     # B 인스턴스: 데이터 관리
│   ├── layout.tsx      # C 객체: 레이아웃 렌더링
│   └── index.ts        # 통합 export
├── Division/
│   ├── structure.ts
│   ├── instance.ts
│   ├── layout.tsx
│   └── index.ts
└── registry.ts         # 모든 블록 타입 등록
```

## 새로운 블록 타입 추가하기

1. **블록 타입 폴더 생성**
   ```
   lib/blocks/modules/YourBlockType/
   ├── structure.ts
   ├── instance.ts
   ├── layout.tsx
   └── index.ts
   ```

2. **structure.ts 작성** (A 타입)
   ```typescript
   import { FlowBlockType } from '@/types/block-structure';
   
   export const YourBlockTypeStructure: FlowBlockType = {
     name: 'YourBlockType',
     color: 'blue',
     col_editable: false,
     cols: [
       {
         header: { elements: [...] },
         rows: [{ elements: [...] }]
       }
     ]
   };
   ```

3. **instance.ts 작성** (B 인스턴스)
   ```typescript
   import { BlockInstance, BlockInstanceData } from '../../BlockInstance';
   import { BLOCK_TYPE } from '@/types/block-types';
   import { YourBlockTypeStructure } from './structure';
   
   export class YourBlockTypeBlockInstance extends BlockInstance {
     // 데이터 관리 로직
   }
   ```

4. **layout.tsx 작성** (C 객체)
   ```typescript
   import { GenericBlockLayoutRenderer } from '../../layout/GenericBlockLayoutRenderer';
   
   export class YourBlockTypeLayoutRenderer extends GenericBlockLayoutRenderer {
     // 필요시 레이아웃 커스터마이징
   }
   ```

5. **index.ts 작성**
   ```typescript
   export { YourBlockTypeStructure } from './structure';
   export { YourBlockTypeBlockInstance } from './instance';
   export { YourBlockTypeLayoutRenderer } from './layout';
   ```

6. **registry.ts에 등록**
   ```typescript
   import { YourBlockTypeStructure, YourBlockTypeBlockInstance, YourBlockTypeLayoutRenderer } from './YourBlockType';
   
   BlockStructureRegistry[BLOCK_TYPE.YOUR_BLOCK_TYPE] = YourBlockTypeStructure;
   BlockInstanceRegistry[BLOCK_TYPE.YOUR_BLOCK_TYPE] = YourBlockTypeBlockInstance;
   BlockLayoutRendererRegistry[BLOCK_TYPE.YOUR_BLOCK_TYPE] = () => new YourBlockTypeLayoutRenderer();
   ```

## 장점

- **관심사 분리**: 각 블록 타입의 A, B, C가 한 폴더에 모여있어 수정이 쉬움
- **확장성**: 새로운 블록 타입 추가가 간단함
- **유지보수성**: 특정 블록 타입만 수정할 때 해당 폴더만 보면 됨
- **재사용성**: 각 모듈이 독립적으로 관리됨

