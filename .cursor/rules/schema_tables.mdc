---
description:
globs:
alwaysApply: false
---
-- 학생 기본
CREATE TABLE students (
  id                BIGSERIAL PRIMARY KEY,
  identify_number   TEXT UNIQUE NOT NULL,
  admission         TEXT NOT NULL,
  major             TEXT NOT NULL,
  graduate_year     INT NOT NULL,
  applicant_sc_code TEXT NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- 학생 과목 (컨텍스트 subjects의 영속 레이어)
CREATE TABLE student_subjects (
  id                        BIGSERIAL PRIMARY KEY,
  student_id                BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_name              TEXT NOT NULL,
  organization_name         TEXT NOT NULL,
  subject_separation_code   TEXT NOT NULL,
  grade                     INT NOT NULL CHECK (grade BETWEEN 1 AND 3),
  term                      INT NOT NULL CHECK (term IN (1,2)),
  credit                    NUMERIC(6,2) NOT NULL,
  original_score            NUMERIC(6,2),
  ranking_grade             INT,
  achievement               TEXT,
  assessment                TEXT,
  student_count             INT,
  avg_score                 NUMERIC(6,2),
  standard_deviation        NUMERIC(6,2),
  achievement_ratio         NUMERIC(6,4),
  created_at                TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_student_subjects_student ON student_subjects(student_id);

-- 파이프라인
CREATE TABLE pipelines (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  version     TEXT NOT NULL,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (name, version)
);

-- 컴포넌트: 선행 최대 1개(선형/분기 DAG 가능)
CREATE TABLE components (
  id              BIGSERIAL PRIMARY KEY,
  pipeline_id     BIGINT NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  predecessor_id  BIGINT REFERENCES components(id),
  position_in_dag INT NOT NULL, -- 토포 정렬용(작을수록 먼저)
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_components_pipeline ON components(pipeline_id);
CREATE INDEX idx_components_predecessor ON components(predecessor_id);

-- 공통 블록 테이블 (추상)
-- in_type/out_type은 요구1 반영: context|scalar|none
CREATE TABLE blocks (
  id            BIGSERIAL PRIMARY KEY,
  component_id  BIGINT NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  kind          TEXT NOT NULL CHECK (kind IN ('division','function','condition','aggregation','variable','finalize')),
  in_type       TEXT NOT NULL CHECK (in_type IN ('context')),
  out_type      TEXT NOT NULL CHECK (out_type IN ('context','scalar','none')),
  position_in_component INT NOT NULL, -- 좌→우 순서
  is_in_case    BOOLEAN NOT NULL DEFAULT FALSE, -- Case 체인 소속 표시
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_blocks_component ON blocks(component_id);

-- Division 블록 (요구2: "하나의 구분 블록 = 1 레코드")
CREATE TABLE division_blocks (
  block_id        BIGINT PRIMARY KEY REFERENCES blocks(id) ON DELETE CASCADE,
  spec_json       JSONB NOT NULL,  -- 구분유형/항목 테이블 구조(에디터 직렬화)
  skip_policy     TEXT NOT NULL CHECK (skip_policy IN ('skip_empty_case','error_empty_case')),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Case (요구2-2: "하나의 케이스 = 1 레코드")
CREATE TABLE division_cases (
  id               BIGSERIAL PRIMARY KEY,
  division_block_id BIGINT NOT NULL REFERENCES division_blocks(block_id) ON DELETE CASCADE,
  case_key         TEXT NOT NULL,        -- ex) "GY:2024-2025|SG:수학/과학"
  criteria_json    JSONB NOT NULL,       -- 리프 조건 직렬화
  is_implicit      BOOLEAN DEFAULT FALSE, -- GLOBAL (Division 없는 컴포넌트용 암묵 케이스)
  position_in_div  INT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (division_block_id, case_key)
);

CREATE INDEX idx_cases_division ON division_cases(division_block_id);

-- Case 체인 상의 블록 순서(케이스별 오른쪽 체인, 블록 일반화)
CREATE TABLE case_block_orders (
  case_id    BIGINT NOT NULL REFERENCES division_cases(id) ON DELETE CASCADE,
  block_id   BIGINT NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  position_in_case INT NOT NULL,
  PRIMARY KEY (case_id, position_in_case)
);


-- Function 블록 (요구2-1: Function ↔ Case = 1:N)
-- 모든 Function은 반드시 어떤 Case에 속한다.
-- Division이 없으면 암묵적 GLOBAL 케이스를 만들어 연결.
CREATE TABLE function_blocks (
  block_id      BIGINT PRIMARY KEY REFERENCES blocks(id) ON DELETE CASCADE,
  case_id       BIGINT NOT NULL REFERENCES division_cases(id) ON DELETE CASCADE,
  func_type     TEXT NOT NULL  -- 'apply_subject','apply_term','top_subject','score_map','grade_ratio','subject_group_ratio','separation_ratio','multiply_ratio','formula'
               CHECK (func_type IN ('apply_subject','apply_term','top_subject','score_map','grade_ratio','subject_group_ratio','separation_ratio','multiply_ratio','formula')),
  params_json   JSONB NOT NULL,   -- 파라미터(배점표/비율/DSL 등)
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Condition 블록
CREATE TABLE condition_blocks (
  block_id    BIGINT PRIMARY KEY REFERENCES blocks(id) ON DELETE CASCADE,
  expr_dsl    TEXT NOT NULL,     -- DSL 문자열
  has_else    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Aggregation 블록
CREATE TABLE aggregation_blocks (
  block_id     BIGINT PRIMARY KEY REFERENCES blocks(id) ON DELETE CASCADE,
  agg_fn       TEXT NOT NULL CHECK (agg_fn IN ('SUM','AVG','COUNT','MAX','MIN','STD')),
  target_expr  TEXT NOT NULL,    -- 예: 'subject.score.final'
  filter_expr  TEXT,             -- 선택
  output_name  TEXT,             -- metrics 저장 키(선택)
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Variable 블록 (Scalar → ctx.vars[name])
CREATE TABLE variable_blocks (
  block_id        BIGINT PRIMARY KEY REFERENCES blocks(id) ON DELETE CASCADE,
  var_name        TEXT NOT NULL,
  scope           TEXT NOT NULL CHECK (scope IN ('component','pipeline')),
  overwrite_policy TEXT NOT NULL CHECK (overwrite_policy IN ('allow','deny')),
  created_at      TIMESTAMPTZ DEFAULT now()
);


-- 일괄 실행 배치(요구 2-3, 2-4)
CREATE TABLE grade_batches (
  id             BIGSERIAL PRIMARY KEY,
  pipeline_id    BIGINT NOT NULL REFERENCES pipelines(id),
  requested_by   TEXT,                -- 실행자
  started_at     TIMESTAMPTZ DEFAULT now(),
  finished_at    TIMESTAMPTZ,
  status         TEXT NOT NULL CHECK (status IN ('running','succeeded','failed')) DEFAULT 'running',
  note           TEXT
);

-- 학생별 실행 단위 (1 학생 = 1 파이프라인 실행)
CREATE TABLE grade_batch_items (
  id             BIGSERIAL PRIMARY KEY,
  batch_id       BIGINT NOT NULL REFERENCES grade_batches(id) ON DELETE CASCADE,
  student_id     BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status         TEXT NOT NULL CHECK (status IN ('running','succeeded','failed')) DEFAULT 'running',
  started_at     TIMESTAMPTZ DEFAULT now(),
  finished_at    TIMESTAMPTZ,
  final_score    NUMERIC(10,4),   -- 최종 점수(집계)
  metrics_json   JSONB,           -- 필요 시 전체 metrics
  vars_json      JSONB,           -- 필요 시 전체 vars
  ctx_hash       TEXT,            -- 컨텍스트 스냅샷 해시(원본은 Audit에)
  error_message  TEXT
);

CREATE INDEX idx_items_batch ON grade_batch_items(batch_id);
CREATE INDEX idx_items_student ON grade_batch_items(student_id);

-- 감사 로그: 블록 단위 Before/After 스냅샷
CREATE TABLE audit_block_logs (
  id               BIGSERIAL PRIMARY KEY,
  batch_id         BIGINT NOT NULL REFERENCES grade_batches(id) ON DELETE CASCADE,
  item_id          BIGINT NOT NULL REFERENCES grade_batch_items(id) ON DELETE CASCADE,
  component_id     BIGINT NOT NULL REFERENCES components(id),
  block_id         BIGINT NOT NULL REFERENCES blocks(id),
  case_id          BIGINT,  -- 케이스 체인에서 실행됐다면 기록
  executed_at      TIMESTAMPTZ DEFAULT now(),
  status           TEXT NOT NULL CHECK (status IN ('ok','skipped','error')),
  last_scalar      NUMERIC(18,6),
  ctx_before_json  JSONB,   -- 무거우면 정책적으로 필드 서브셋/압축/해시
  ctx_after_json   JSONB,
  message          TEXT
);

CREATE INDEX idx_audit_item ON audit_block_logs(item_id);
CREATE INDEX idx_audit_block ON audit_block_logs(block_id);

-- 배치 결과(정렬/순위) 물리화
CREATE TABLE grade_results (
  batch_id     BIGINT NOT NULL REFERENCES grade_batches(id) ON DELETE CASCADE,
  student_id   BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  final_score  NUMERIC(10,4) NOT NULL,
  rank         INT NOT NULL,            -- RANK() WITH TIES
  tie_breaker  JSONB,                   -- 표준편차/이수단위/이름 등 근거 저장
  PRIMARY KEY (batch_id, student_id)
);

CREATE INDEX idx_results_rank ON grade_results(batch_id, rank);
