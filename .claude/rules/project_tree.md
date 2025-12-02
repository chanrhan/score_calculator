---
description:
globs:
alwaysApply: false
---

.
├─ app/
│  ├─ layout.tsx
│  ├─ globals.css                      # Tailwind 포함(또는 /styles로 분리)
│  └─ (dashboard)/
│     ├─ page.tsx                      # 대시보드 진입/리다이렉트
│     ├─ pipelines/
│     │  ├─ page.tsx                   # 파이프라인 목록
│     │  └─ [id]/
│     │     └─ edit/
│     │        └─ page.tsx            # 파이프라인 편집(컴포넌트/블록/케이스)
│     ├─ run/
│     │  └─ page.tsx                   # N명 실행 화면
│     ├─ results/
│     │  └─ page.tsx                   # 정렬/랭크 결과
│     ├─ audit/
│     │  └─ [batchId]/
│     │     └─ [itemId]/
│     │        └─ page.tsx            # 감사 로그 뷰어
│     └─ import-export/
│        └─ page.tsx                   # 전체 상태 Import/Export
│
├─ components/
│  ├─ layout/
│  │  ├─ AppShell.tsx
│  │  ├─ TopNav.tsx
│  │  └─ SideNav.tsx
│  ├─ PipelineList.tsx
│  ├─ PipelineEditor/
│  │  ├─ Canvas.tsx                    # DAG 캔버스(컴포넌트 노드/에지)
│  │  ├─ ComponentNode.tsx
│  │  ├─ BlockPalette.tsx
│  │  ├─ ValidationPanel.tsx
│  │  └─ Toolbar.tsx
│  ├─ CaseEditor/
│  │  ├─ CaseList.tsx                  # 케이스 리프 목록/정렬
│  │  └─ CaseChainEditor.tsx           # 케이스 오른쪽 체인 편집
│  ├─ BlockEditors/
│  │  ├─ DivisionEditor.tsx
│  │  ├─ ConditionEditor.tsx
│  │  ├─ AggregationEditor.tsx
│  │  ├─ VariableEditor.tsx
│  │  ├─ FinalizeEditor.tsx
│  │  └─ FunctionEditor/
│  │     ├─ ApplySubjectEditor.tsx
│  │     ├─ ApplyTermEditor.tsx
│  │     ├─ TopSubjectEditor.tsx
│  │     ├─ ScoreMapEditor.tsx
│  │     ├─ GradeRatioEditor.tsx
│  │     ├─ SubjectGroupRatioEditor.tsx
│  │     ├─ SeparationRatioEditor.tsx
│  │     ├─ MultiplyRatioEditor.tsx
│  │     └─ FormulaEditor.tsx
│  ├─ Students/
│  │  ├─ StudentUploader.tsx
│  │  └─ StudentTable.tsx
│  ├─ Results/
│  │  ├─ ResultTable.tsx
│  │  └─ RankBadge.tsx
│  ├─ Audit/
│  │  ├─ AuditTimeline.tsx
│  │  └─ AuditDiffView.tsx
│  └─ Common/
│     ├─ JSONImportExport.tsx
│     ├─ FileDropZone.tsx
│     ├─ Toast.tsx
│     ├─ ConfirmDialog.tsx
│     ├─ Field.tsx
│     ├─ Tabs.tsx
│     └─ Select.tsx
│
├─ lib/
│  ├─ engine/
│  │  ├─ index.ts                      # 엔진 진입/런너 모듈 export
│  │  ├─ runPipeline.ts                # 파이프라인 전체 실행
│  │  ├─ runComponent.ts               # 컴포넌트 좌→우 실행
│  │  ├─ runDivision.ts                # Division + 케이스 분기 실행
│  │  ├─ runCaseChain.ts               # 케이스 Right Chain 실행
│  │  ├─ dispatch.ts                   # Function 디스패처
│  │  ├─ dispatch-block.ts             # Block 디스패처(Condition/Aggregation/Variable 등)
│  │  ├─ blocks/
│  │  │  ├─ condition.ts
│  │  │  ├─ aggregation.ts
│  │  │  ├─ variable.ts
│  │  │  └─ finalize.ts
│  │  ├─ functions/
│  │  │  ├─ applySubject.ts
│  │  │  ├─ applyTerm.ts
│  │  │  ├─ topSubject.ts
│  │  │  ├─ scoreMap.ts
│  │  │  ├─ gradeRatio.ts
│  │  │  ├─ subjectGroupRatio.ts
│  │  │  ├─ separationRatio.ts
│  │  │  ├─ multiplyRatio.ts
│  │  │  └─ formula.ts
│  │  └─ audit.ts                      # before/after 스냅샷 유틸
│  ├─ dsl/
│  │  ├─ ast.ts
│  │  ├─ parser.ts
│  │  └─ eval.ts                       # 안전 인터프리터
│  ├─ validators/
│  │  ├─ pipeline.ts                   # zod 스키마(파이프라인/컴포넌트/블록)
│  │  ├─ blocks.ts
│  │  ├─ functions.ts
│  │  └─ context.ts
│  └─ utils/
│     ├─ id.ts                         # uuid/숫자 시퀀스
│     ├─ sort.ts                       # 정렬/타이브레이커
│     ├─ context.ts                    # Context 클론/머지 유틸
│     ├─ persist.ts                    # LocalStorage 퍼시스트
│     ├─ csv.ts                        # 결과 내보내기
│     ├─ hashing.ts                    # ctx hash, 간단 해시
│     └─ time.ts
│
├─ store/
│  ├─ usePipelines.ts                  # Zustand: 파이프라인 CRUD
│  ├─ useStudents.ts                   # 학생/과목 로컬 상태
│  ├─ useBatches.ts                    # 실행 배치/아이템/결과
│  └─ useSettings.ts                   # 감사 레벨/동시성 등 사용자 설정
│
├─ types/
│  ├─ domain.ts                        # Context/Subject/BlockBase 등
│  ├─ functions.ts                     # 기능형 서브 블록 타입
│  └─ blocks.ts                        # Condition/Aggregation/Variable 타입
│
├─ fixtures/
│  ├─ sample-pipeline.json
│  ├─ sample-students.json
│  └─ sample-run-config.json
│
├─ public/
│  ├─ favicon.ico
│  └─ logo.svg
│
├─ styles/
│  └─ tailwind.css                     # (globals.css에 통합 가능)
│
├─ tests/
│  ├─ dsl/
│  │  └─ eval.test.ts
│  ├─ engine/
│  │  ├─ functions.test.ts
│  │  ├─ aggregation.test.ts
│  │  ├─ condition.test.ts
│  │  ├─ variable.test.ts
│  │  └─ runPipeline.test.ts
│  └─ utils/
│     └─ sort.test.ts
│
├─ .vscode/
│  ├─ settings.json
│  └─ extensions.json
│
├─ next.config.mjs
├─ package.json
├─ tsconfig.json
├─ tailwind.config.ts
├─ postcss.config.js
├─ .eslintrc.cjs
└─ .prettierrc
