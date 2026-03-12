-- H.Research 초기 스키마
-- 모든 테이블: uuid PK, created_at 기본값 now(), RLS 활성화

-- ============================================================
-- users: auth.users와 연동
-- ============================================================
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- organizations: 대학·연구소·기업
-- ============================================================
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('university', 'institute', 'company')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- org_members: 조직-사용자 매핑
-- ============================================================
CREATE TABLE public.org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- projects: 연구 프로젝트
-- ============================================================
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- datasets: 데이터셋 메타정보
-- ============================================================
CREATE TABLE public.datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  row_count integer,
  column_count integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- latent_variables: 잠재변수 정의
-- ============================================================
CREATE TABLE public.latent_variables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  dataset_id uuid REFERENCES public.datasets(id) ON DELETE SET NULL,
  name text NOT NULL,
  color text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.latent_variables ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- canvas_models: 캔버스 모델
-- ============================================================
CREATE TABLE public.canvas_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  canvas_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.canvas_models ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- canvas_versions: 버전 히스토리
-- ============================================================
CREATE TABLE public.canvas_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_model_id uuid NOT NULL REFERENCES public.canvas_models(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  canvas_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.canvas_versions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- analysis_runs: 분석 실행 이력
-- ============================================================
CREATE TABLE public.analysis_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_model_id uuid NOT NULL REFERENCES public.canvas_models(id) ON DELETE CASCADE,
  version_id uuid REFERENCES public.canvas_versions(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  options jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.analysis_runs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- analysis_results: 분석 결과
-- ============================================================
CREATE TABLE public.analysis_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_run_id uuid NOT NULL REFERENCES public.analysis_runs(id) ON DELETE CASCADE,
  result_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  interpretation_ko text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- comments: 랩 코멘트
-- ============================================================
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  analysis_run_id uuid REFERENCES public.analysis_runs(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
