-- Phase 2-2: 설문 모듈 스키마

-- 설문 폼
CREATE TABLE survey_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  target_responses INT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 설문 그룹 (HLM 다층분석용)
CREATE TABLE survey_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES survey_forms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 설문 문항
CREATE TABLE survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES survey_forms(id) ON DELETE CASCADE,
  latent_variable_id UUID REFERENCES latent_variables(id),
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  scale_min INT DEFAULT 1,
  scale_max INT DEFAULT 5,
  is_reversed BOOLEAN DEFAULT false,
  order_index INT NOT NULL,
  page_number INT DEFAULT 1,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 설문 응답 (응답자별)
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES survey_forms(id) ON DELETE CASCADE,
  group_id UUID REFERENCES survey_groups(id),
  respondent_token TEXT UNIQUE,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  is_complete BOOLEAN DEFAULT false,
  ip_hash TEXT,
  metadata JSONB DEFAULT '{}'
);

-- 설문 응답 데이터 (문항별)
CREATE TABLE survey_response_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID REFERENCES survey_responses(id) ON DELETE CASCADE,
  question_id UUID REFERENCES survey_questions(id),
  value_numeric NUMERIC,
  value_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화
ALTER TABLE survey_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_response_items ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 설문 폼 (프로젝트 소유자만 접근)
CREATE POLICY "survey_forms_owner" ON survey_forms
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- RLS 정책: 설문 그룹
CREATE POLICY "survey_groups_owner" ON survey_groups
  FOR ALL USING (
    form_id IN (
      SELECT sf.id FROM survey_forms sf
      JOIN projects p ON sf.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- RLS 정책: 설문 문항 (소유자 + 응답자 읽기)
CREATE POLICY "survey_questions_owner" ON survey_questions
  FOR ALL USING (
    form_id IN (
      SELECT sf.id FROM survey_forms sf
      JOIN projects p ON sf.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "survey_questions_public_read" ON survey_questions
  FOR SELECT USING (
    form_id IN (
      SELECT id FROM survey_forms WHERE status = 'active'
    )
  );

-- RLS 정책: 응답 (소유자 전체 접근, 응답자 본인만 삽입)
CREATE POLICY "survey_responses_owner" ON survey_responses
  FOR ALL USING (
    form_id IN (
      SELECT sf.id FROM survey_forms sf
      JOIN projects p ON sf.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "survey_responses_insert" ON survey_responses
  FOR INSERT WITH CHECK (
    form_id IN (
      SELECT id FROM survey_forms WHERE status = 'active'
    )
  );

-- RLS 정책: 응답 아이템
CREATE POLICY "survey_response_items_owner" ON survey_response_items
  FOR ALL USING (
    response_id IN (
      SELECT sr.id FROM survey_responses sr
      JOIN survey_forms sf ON sr.form_id = sf.id
      JOIN projects p ON sf.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "survey_response_items_insert" ON survey_response_items
  FOR INSERT WITH CHECK (
    response_id IN (
      SELECT id FROM survey_responses
    )
  );

-- 인덱스
CREATE INDEX idx_survey_forms_project ON survey_forms(project_id);
CREATE INDEX idx_survey_groups_form ON survey_groups(form_id);
CREATE INDEX idx_survey_questions_form ON survey_questions(form_id);
CREATE INDEX idx_survey_responses_form ON survey_responses(form_id);
CREATE INDEX idx_survey_responses_group ON survey_responses(group_id);
CREATE INDEX idx_survey_response_items_response ON survey_response_items(response_id);
